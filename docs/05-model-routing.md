# Model Routing

## What It Is

Model routing picks the best LLM for each turn based on task complexity. Simple questions go to cheap/fast models; complex reasoning goes to expensive/powerful ones. The harness classifies each prompt and routes accordingly — no LLM call needed, pure heuristics.

## Why It Matters

Using opus for "what time is it?" wastes money. Using haiku for "architect a distributed system" produces garbage. Smart routing saves 50-80% on costs while maintaining quality where it matters. Teams report going from $50/day to $12/day after implementing routing — with the same quality on complex tasks.

## The Tiered Approach

```
simple      → haiku    ($0.80/M in, $4/M out — greetings, lookups, short answers)
tool_single → sonnet   ($3/M in, $15/M out — single file edits, searches, tool calls)
tool_multi  → sonnet   ($3/M in, $15/M out — multi-step workflows)
complex     → opus     ($15/M in, $75/M out — architecture, debugging, planning)
```

A production routing config:

```typescript
type TaskComplexity = 'simple' | 'tool_single' | 'tool_multi' | 'complex'

const DEFAULT_ROUTING_CONFIG = {
  enabled: true,
  models: {
    simple:      'claude-haiku-4-5',
    tool_single: 'claude-sonnet-4-6',
    tool_multi:  'claude-sonnet-4-6',
    complex:     'claude-opus-4-6',
  },
  fallback: 'claude-sonnet-4-6',
}
```

## Classification Heuristics

The classifier runs on every turn, inspecting the last user message. It uses keyword detection — no LLM call, no latency, no cost:

```typescript
const REASONING_WORDS = new Set([
  'analyze', 'architect', 'compare', 'debug', 'design',
  'diagnose', 'evaluate', 'explain', 'optimize', 'plan',
  'refactor', 'research', 'review', 'summarize',
])

const ACTION_VERBS = new Set([
  'read', 'write', 'create', 'edit', 'delete', 'run',
  'search', 'find', 'list', 'save', 'draft', 'add',
])

function classifyTask(prompt: string): TaskComplexity {
  const words = prompt.toLowerCase().split(/\s+/)

  // Reasoning words take priority
  const reasoningCount = words.filter(w => REASONING_WORDS.has(w)).length
  if (reasoningCount >= 2) return 'complex'
  if (reasoningCount >= 1 && words.length > 10) return 'complex'

  // Multi-step detection
  const hasMulti = prompt.includes(' and ') || prompt.includes(' then ')
  const actionCount = words.filter(w => ACTION_VERBS.has(w)).length
  if (hasMulti && actionCount >= 2) return 'tool_multi'

  // Single action
  if (actionCount >= 1) return 'tool_single'
  if (reasoningCount >= 1) return 'complex'

  return 'simple'
}
```

This classifier routes correctly **90%+ of the time** in practice. The 10% it gets wrong are edge cases where a simple-sounding prompt actually requires deep reasoning — and the fallback (sonnet) handles those adequately.

### Routing Inside the Agent Loop

The router integrates as a single check at the top of each turn:

```typescript
// Inside the agent loop, before calling provider.chat():
let turnModel = params.model  // default

if (autoRouting) {
  const lastUserMsg = messages.filter(m => m.role === 'user').at(-1)
  if (lastUserMsg) {
    const complexity = classifyTask(lastUserMsg.content)
    turnModel = routingConfig.models[complexity] ?? routingConfig.fallback

    yield { type: 'model_routed', complexity, model: turnModel }
  }
}

const stream = provider.chat({ model: turnModel, messages, tools })
```

The event emission lets the TUI show which model is being used each turn, and cost tracking can apply the correct per-model pricing.

## Cost Impact: Real Numbers

For a typical 30-turn coding session:

| Strategy | Turns by Model | Cost |
|----------|---------------|------|
| **All Opus** | 30 opus turns | ~$15-20 |
| **All Sonnet** | 30 sonnet turns | ~$3-5 |
| **Routed** | 5 haiku + 20 sonnet + 5 opus | ~$5-7 |

The routed approach costs ~65% less than all-opus while maintaining opus quality on the 5 turns that actually need it (planning, architecture, complex debugging).

For a team running 50 sessions/day:
- All opus: ~$750-1000/day
- Routed: ~$250-350/day
- Savings: **$500-650/day** (~$15K/month)

## Escalation Strategy

A practical escalation rule: if sonnet fails on a task (wrong output, test failures, loops), automatically escalate to opus:

```typescript
const MAX_SONNET_RETRIES = 3

// If the same task has failed 3 times on sonnet, escalate
if (failureCount >= MAX_SONNET_RETRIES && currentModel !== 'opus') {
  turnModel = routingConfig.models.complex  // opus
  yield { type: 'model_escalated', from: currentModel, to: turnModel, reason: 'repeated_failure' }
}
```

Don't keep burning sonnet tokens on something it can't solve. The cost of 3 failed sonnet attempts often exceeds one opus attempt that succeeds.

## Sub-Agent Routing

When spawning sub-agents, route by task type, not just complexity:

```typescript
// Exploration/research → haiku (cheap, read-only)
Agent({ model: 'haiku', tools: ['Read', 'Glob', 'Grep'] })

// Code implementation → sonnet
Agent({ model: 'sonnet', tools: ['Read', 'Write', 'Edit', 'Bash'] })

// Architecture/planning → sonnet (upgrade to opus only for truly complex decisions)
Agent({ model: 'sonnet', subagent_type: 'planner' })

// Security review → opus (high stakes, needs deep reasoning)
Agent({ model: 'opus', subagent_type: 'security-reviewer' })
```

## Override Behavior

Users must be able to override auto-routing:
- `/model opus` — lock to opus, disable auto-routing
- `/model auto` — re-enable auto-routing
- Manual override persists until explicitly changed back

```typescript
// In the TUI
if (userCommand === '/model auto') {
  autoRouting = true
} else if (userCommand.startsWith('/model ')) {
  autoRouting = false
  fixedModel = userCommand.split(' ')[1]
}
```

## Fallback Chains

When the primary model is overloaded or rate-limited:

```
primary → fallback → error with retry info
opus    → sonnet   → "Model unavailable, retrying in 5s..."
sonnet  → haiku    → error
haiku   → error    → "All models unavailable"
```

```typescript
async function chatWithFallback(
  provider: LLMProvider,
  models: string[],
  params: ChatParams
): AsyncGenerator<StreamChunk> {
  for (const model of models) {
    try {
      yield* provider.chat({ ...params, model })
      return
    } catch (err) {
      if (isRateLimitError(err) || isOverloadedError(err)) {
        continue  // try next model
      }
      throw err  // non-retryable error
    }
  }
  throw new Error('All models unavailable')
}
```

## How Top Harnesses Route

| Harness | Routing Strategy |
|---------|-----------------|
| **Claude Code** | Single model (user chooses), sub-agents can specify different models |
| **Cursor** | Multi-model routing (opaque), uses custom SWE-1.5 for fast tasks |
| **OpenCode** | 75+ providers, user selects per session |
| **Gemini CLI** | Gemini models only, auto-selects Flash vs Pro |
| **Aider** | Single model, user switches manually |
| **Windsurf** | Custom SWE-1.5 model at 13x speed of Claude for standard tasks |
| **Trae** | Routes between Claude, DeepSeek, and GPT based on task |
| **OpenDev** | Compound routing — separate planning model and execution model |

## Common Pitfalls

- **Using LLM for classification** — adds latency and cost to every turn
- **Over-routing to cheap models** — haiku struggles with tool calls and multi-step reasoning
- **No manual override** — users need escape hatches when the classifier is wrong
- **Not routing at all** — opus for everything is 5-10x more expensive than necessary
- **Not logging routing decisions** — you can't optimize what you can't measure
- **No escalation** — retrying a failed sonnet task 10 times instead of escalating to opus

## Checklist

- [ ] Define model tiers with per-model pricing (cheap/balanced/powerful)
- [ ] Implement heuristic classifier (no LLM call, pure keyword/regex)
- [ ] Per-turn routing in the agent loop
- [ ] Sub-agent routing by task type
- [ ] Manual override via `/model` command
- [ ] Fallback chain for rate limits and overloaded models
- [ ] Escalation after N failures on a cheaper model
- [ ] Log which model was used per turn (for cost analysis)
- [ ] Emit routing events for TUI and observability

## Further Reading

- [The Agent Loop](02-the-agent-loop.md) — where routing integrates
- [Provider Abstraction](06-provider-abstraction.md) — the registry that routing targets
- [Lessons from the Field](11-lessons-from-the-field.md) — real cost savings data
