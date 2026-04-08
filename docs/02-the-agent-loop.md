# The Agent Loop

## What It Is

The agent loop is the core execution cycle of any agentic harness. It's the `while` loop that turns a stateless LLM into an autonomous agent: send context to the model, parse the response, execute any tool calls, feed results back, and repeat until the task is done or a limit is hit.

The 2026 paper ["Building Effective AI Coding Agents for the Terminal"](https://arxiv.org/abs/2603.05344) identified the agent loop as the center of a 7-subsystem harness: pre-check, compaction, thinking, self-critique, action (the loop), tool execution, and post-processing. The loop itself is simple — the subsystems around it determine agent quality.

## Why It Matters

A bad agent loop means: wasted tokens on unnecessary turns, infinite loops when the agent gets stuck, lost context when history grows too large, and no way to interrupt or steer. Terminal-Bench 2.0 showed that LangChain improved from 52.8% to 66.5% by changing **only the harness loop** — not the model. The loop is the single largest leverage point after model choice.

## The Core Pattern

Every production harness implements some variant of this async generator:

```typescript
async function* agentLoop(params: {
  messages: Message[]
  provider: LLMProvider
  model: string
  tools: Tool[]
  maxTurns: number
  signal?: AbortSignal
}): AsyncGenerator<AgentEvent> {
  const { messages, provider, model, tools, maxTurns, signal } = params

  for (let turn = 0; turn < maxTurns; turn++) {
    if (signal?.aborted) {
      yield { type: 'abort' }
      return
    }

    // 1. Send to LLM (streaming)
    const stream = provider.chat({ model, messages, tools: toolsToSchemas(tools) })

    // 2. Collect text and tool calls from stream
    let text = ''
    const toolCalls: ToolCall[] = []

    for await (const chunk of stream) {
      if (chunk.type === 'text') {
        text += chunk.text
        yield { type: 'text_delta', text: chunk.text }
      }
      if (chunk.type === 'tool_call') {
        toolCalls.push(chunk)
        yield { type: 'tool_start', name: chunk.name, input: chunk.input }
      }
      if (chunk.type === 'usage') {
        yield { type: 'usage', inputTokens: chunk.inputTokens, outputTokens: chunk.outputTokens }
      }
    }

    // 3. No tool calls → task complete
    if (toolCalls.length === 0) {
      yield { type: 'turn_complete', reason: 'end_turn', turnNumber: turn }
      return
    }

    // 4. Append assistant message with tool calls to history
    messages.push({ role: 'assistant', content: text, tool_calls: toolCalls })

    // 5. Execute tools sequentially, feed results back
    for (const call of toolCalls) {
      const tool = tools.find(t => t.name === call.name)
      if (!tool) {
        messages.push({ role: 'tool', tool_call_id: call.id, content: `Error: unknown tool "${call.name}"` })
        continue
      }

      // Permission check
      const permission = await tool.checkPermission?.(call.input)
      if (permission?.denied) {
        messages.push({ role: 'tool', tool_call_id: call.id, content: `Denied: ${permission.reason}` })
        yield { type: 'tool_denied', name: call.name, reason: permission.reason }
        continue
      }

      // Execute
      try {
        const result = await tool.call(call.input, { signal, cwd: process.cwd() })
        messages.push({ role: 'tool', tool_call_id: call.id, content: result })
        yield { type: 'tool_result', name: call.name, result: result.slice(0, 200) }
      } catch (err) {
        const errorMsg = `Error: ${err.message}`
        messages.push({ role: 'tool', tool_call_id: call.id, content: errorMsg })
        yield { type: 'tool_error', name: call.name, error: err.message }
      }
    }

    // 6. Check context size — trigger compaction if needed
    if (estimateTokens(messages) > maxContextTokens * 0.6) {
      messages = await compact(messages, provider)
      yield { type: 'compaction', messageCount: messages.length }
    }

    // 7. Loop — LLM will see tool results on next turn
  }

  yield { type: 'max_turns_exceeded', turns: maxTurns }
}
```

## The Event System

Production harnesses emit typed events at every stage. This powers the TUI, logging, cost tracking, and observability — all without coupling those concerns into the loop itself.

Here's a real event type system from a production harness:

```typescript
type AgentEvent =
  // Streaming
  | { type: 'text_delta'; text: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number }

  // Tool lifecycle
  | { type: 'tool_start'; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; name: string; result: string }
  | { type: 'tool_error'; name: string; error: string }
  | { type: 'tool_denied'; name: string; reason: string }

  // Turn lifecycle
  | { type: 'turn_complete'; reason: string; turnNumber: number }
  | { type: 'model_routed'; complexity: string; model: string }
  | { type: 'compaction'; messageCount: number }

  // Session lifecycle
  | { type: 'abort' }
  | { type: 'max_turns_exceeded'; turns: number }
```

The consumer of these events doesn't need to understand the loop internals — it just subscribes to the event types it cares about:

```typescript
// TUI only cares about text and tool visualization
for await (const event of agentLoop(params)) {
  switch (event.type) {
    case 'text_delta': renderText(event.text); break
    case 'tool_start': showSpinner(event.name); break
    case 'tool_result': hideSpinner(); break
    case 'usage': updateTokenCounter(event); break
  }
}
```

## The 7-Subsystem Model (2026 Research)

The [OpenDev paper](https://arxiv.org/abs/2603.05344) formalizes the agent loop as a central ReAct core surrounded by 7 subsystems:

```
                    ┌─────────────────┐
                    │   Pre-check     │ ← validate inputs, check context budget
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │   Compaction    │ ← summarize history if context is full
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │   Thinking      │ ← extended thinking / chain-of-thought
                    └────────┬────────┘
                             ↓
              ┌──────────────────────────────┐
              │   ReAct Loop (core)          │
              │   observe → decide → act     │
              └──────────────┬───────────────┘
                             ↓
                    ┌─────────────────┐
                    │   Self-critique │ ← agent reviews own output
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │   Tool Exec     │ ← execute with permission checks
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │  Post-process   │ ← lint gate, format output, persist
                    └─────────────────┘
```

Most simple harnesses only implement the core loop + tool execution. Production harnesses add compaction (Claude Code, Cline), self-critique (SWE-agent's observation validation), and post-processing (lint gates, auto-formatting).

## The Stateful Engine Pattern

Rather than exposing the raw loop, production harnesses wrap it in a stateful `AgentEngine` that maintains history across turns and supports mid-session changes:

```typescript
class AgentEngine {
  private messages: Message[] = []
  private provider: LLMProvider
  private model: string
  private tools: Tool[]
  private systemPrompt: string

  async *submitMessage(userMessage: string, options?: {
    signal?: AbortSignal
    agentName?: string
  }): AsyncGenerator<AgentEvent> {
    this.messages.push({ role: 'user', content: userMessage })

    yield* query({
      messages: [
        { role: 'system', content: this.systemPrompt },
        ...this.messages
      ],
      provider: this.provider,
      model: this.model,
      tools: this.tools,
      maxTurns: 25,
      signal: options?.signal,
    })
  }

  // Mid-session changes
  setModel(provider: LLMProvider, model: string): void { ... }
  setTools(tools: Tool[]): void { ... }
  reset(): void { this.messages = [] }
  getMessages(): readonly Message[] { return this.messages }
}
```

This gives the TUI a clean API: `engine.submitMessage("fix the bug")` returns an event stream, and the engine manages all internal state.

## How Top Harnesses Implement It

### Claude Code
Async generator that yields events. The loop is clean: stream → collect tool calls → execute → append → loop. Max turns configurable. The Agent SDK exposes this as `query()`. Sub-agents get their own fresh `AgentEngine` with restricted tool sets.

### SWE-agent / mini-SWE-agent
The **thought-action-observation** cycle inspired by ReAct. The agent explicitly outputs a "thought" before each action. Observations include structured feedback (line numbers, diffs). Remarkably, mini-SWE-agent achieves 74%+ on SWE-bench Verified with ~100 lines of code and a single `bash` tool — proving the loop pattern matters more than complexity.

### OpenDev (2026)
**Compound AI dual-agent loop.** A planning agent generates a high-level plan, then an execution agent carries it out. Each agent has its own loop with different tools and system prompts. The orchestrator manages handoffs between them. This outperforms single-agent loops on tasks requiring 50+ turns.

### Codex CLI
Two-phase loop: first the model responds, then tool calls are executed with OS-level sandboxing (Seatbelt/Landlock). Each tool call goes through a permission check. The "apply patch" tool is special-cased for file modifications.

### Open-SWE (LangGraph)
Built on LangGraph's Deep Agents pattern. Adds two critical loop extensions that improved Terminal-Bench scores by 14 points:
1. **Self-verification loop** — after each edit, the agent verifies the change is correct
2. **Loop detection** — detects when the agent is repeating the same actions and forces a different strategy

## Per-Turn Model Routing

Advanced loops don't use the same model for every turn. A classifier inspects the user message and routes to the appropriate tier:

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
  const reasoningCount = words.filter(w => REASONING_WORDS.has(w)).length
  const actionCount = words.filter(w => ACTION_VERBS.has(w)).length
  const hasMulti = prompt.includes(' and ') || prompt.includes(' then ')

  if (reasoningCount >= 2) return 'complex'
  if (reasoningCount >= 1 && words.length > 10) return 'complex'
  if (hasMulti && actionCount >= 2) return 'tool_multi'
  if (actionCount >= 1) return 'tool_single'
  return 'simple'
}

// Inside the loop:
let turnModel = model
if (autoRouting) {
  const complexity = classifyTask(lastUserMessage)
  turnModel = routingConfig.models[complexity] ?? routingConfig.fallback
  yield { type: 'model_routed', complexity, model: turnModel }
}
```

This saves 50-80% on costs. Simple tasks go to haiku, complex reasoning goes to opus, everything else uses sonnet. No LLM call needed for classification — pure keyword matching is fast and free.

## Key Patterns

### Stop Conditions
1. **No tool calls** — model responded with text only, task is done
2. **Max turns** — safety limit to prevent infinite loops (typically 25-50)
3. **User abort** — AbortSignal or Ctrl+C
4. **Stop reason** — model explicitly signals completion (`end_turn`, `max_tokens`)
5. **Loop detection** — agent is repeating the same actions (Open-SWE pattern)
6. **Cost limit** — token budget exceeded

### Streaming
Always stream. Users need to see progress. The async generator pattern is ideal — each chunk yields immediately while the loop continues internally. A user who sees nothing for 5 seconds thinks the agent is broken.

### Tool Call Ordering
Execute tool calls **sequentially**, not in parallel. Parallel execution causes race conditions (two tools editing the same file). Some harnesses allow parallel execution for read-only tools only (Claude Code's Explore subagent does this).

### History Management
Append assistant messages (with tool_calls) and tool results to the message array. The LLM sees the full history each turn. When history gets too large, trigger compaction (see [Context Management](04-context-management.md)). Trigger at 60% capacity — not 95%, because the compaction call itself needs context room.

### Token Tracking
Wrap the provider to intercept usage events for cost accounting:

```typescript
function createTrackingProvider(inner: LLMProvider, onUsage: (input: number, output: number) => void): LLMProvider {
  return {
    name: inner.name,
    async *chat(params) {
      for await (const chunk of inner.chat(params)) {
        if (chunk.type === 'usage') onUsage(chunk.inputTokens, chunk.outputTokens)
        yield chunk
      }
    },
    listModels: () => inner.listModels(),
    ping: () => inner.ping(),
  }
}
```

## Common Pitfalls

- **No max turns limit** — agent loops forever burning tokens
- **Swallowing tool errors** — errors should be returned to the LLM so it can adapt
- **Not streaming** — user sees nothing for 30 seconds, thinks it's broken
- **Parallel tool execution** — causes file conflicts and race conditions
- **No abort mechanism** — user can't stop a runaway agent
- **No loop detection** — agent repeats the same failing action 10 times
- **Compacting too late** — at 95% capacity, the compaction call itself may exceed the window
- **No cost tracking** — a 50-turn session with opus can cost $20+ with no visibility

## Checklist

- [ ] Async generator pattern for streaming
- [ ] Max turns limit (default 25)
- [ ] AbortSignal support
- [ ] Tool errors returned to LLM as text
- [ ] Sequential tool execution (parallel only for read-only)
- [ ] Permission check before tool execution
- [ ] Events emitted for UI (text_delta, tool_start, tool_result, turn_complete)
- [ ] Token usage tracking per turn
- [ ] Context size monitoring with compaction trigger at 60%
- [ ] Loop detection (optional but recommended)
- [ ] Per-turn model routing (optional, saves 50-80% on costs)

## Further Reading

- [Build Your First Harness](build-your-first-harness.md) — implement this loop in 200 lines
- [Context Management](04-context-management.md) — compaction strategies for long sessions
- [Model Routing](05-model-routing.md) — per-turn classification and routing
- [Error Recovery](07-error-recovery.md) — what happens when tools fail
- [Case Study: Sub-Agent Patterns](../case-studies/claude-code-sub-agent-patterns.md) — nested loops with restricted tools
- [arxiv 2603.05344](https://arxiv.org/abs/2603.05344) — the 7-subsystem model
- [arxiv 2210.03629](https://arxiv.org/abs/2210.03629) — ReAct: the original thought-action-observation paper
