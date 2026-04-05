# Model Routing

## What It Is

Model routing picks the best LLM for each turn based on task complexity. Simple questions go to cheap/fast models; complex reasoning goes to expensive/powerful ones. The harness classifies each prompt and routes accordingly.

## Why It Matters

Using opus for "what time is it?" wastes money. Using haiku for "architect a distributed system" produces garbage. Smart routing saves 50-80% on costs while maintaining quality where it matters.

## The Tiered Approach

```
simple      → haiku    (cheap, fast — greetings, lookups, short answers)
tool_single → sonnet   (balanced — single file edits, searches, tool calls)
tool_multi  → sonnet   (balanced — multi-step workflows)
complex     → opus     (powerful — architecture, debugging, planning)
```

## Classification Heuristics

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

function classifyTask(prompt: string): 'simple' | 'tool_single' | 'tool_multi' | 'complex' {
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

## Override Behavior

Users should be able to override auto-routing:
- `/model opus` — lock to opus, disable auto-routing
- `/model auto` — re-enable auto-routing
- Manual override persists until explicitly changed back

## Fallback Chains

When the primary model is overloaded or rate-limited:
```
primary → fallback → error
opus    → sonnet   → "Model unavailable, retrying..."
sonnet  → haiku    → error
```

## How Top Harnesses Do It

Most harnesses (Claude Code, Aider, Cline) use a **single model** — the user picks one and everything goes through it. This is simple but wasteful.

**Poly** implements per-turn routing with heuristic classification. No LLM call needed for classification — pure regex/keyword matching is fast and free.

**Cursor** uses a multi-model approach in its agent mode, routing between fast and powerful models, but the logic is opaque.

## Common Pitfalls

- **Using LLM for classification** — adds latency and cost to every turn
- **Over-routing to cheap models** — haiku can't handle tool calls well
- **No manual override** — users need escape hatches
- **Not routing at all** — opus for everything is expensive and slow

## Checklist

- [ ] Define model tiers (cheap/balanced/powerful)
- [ ] Implement heuristic classifier (no LLM call)
- [ ] Per-turn routing in the agent loop
- [ ] Manual override via `/model` command
- [ ] Fallback chain for rate limits
- [ ] Log which model was used per turn
