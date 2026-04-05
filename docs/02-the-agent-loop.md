# The Agent Loop

## What It Is

The agent loop is the core execution cycle of any agentic harness. It's the `while` loop that turns a stateless LLM into an autonomous agent: send context to the model, parse the response, execute any tool calls, feed results back, and repeat until the task is done or a limit is hit.

## Why It Matters

A bad agent loop means: wasted tokens on unnecessary turns, infinite loops when the agent gets stuck, lost context when history grows too large, and no way to interrupt or steer.

## The Core Pattern

```typescript
async function* agentLoop(params: {
  messages: Message[]
  provider: LLMProvider
  model: string
  tools: Tool[]
  maxTurns: number
}): AsyncGenerator<Event> {
  const { messages, provider, model, tools, maxTurns } = params

  for (let turn = 0; turn < maxTurns; turn++) {
    // 1. Send to LLM
    const response = await provider.chat({ model, messages, tools })

    // 2. Collect text and tool calls
    let text = ''
    const toolCalls: ToolCall[] = []

    for await (const chunk of response) {
      if (chunk.type === 'text') {
        text += chunk.text
        yield { type: 'text_delta', text: chunk.text }
      }
      if (chunk.type === 'tool_call') {
        toolCalls.push(chunk)
      }
    }

    // 3. No tool calls → task complete
    if (toolCalls.length === 0) {
      yield { type: 'turn_complete', reason: 'end_turn' }
      return
    }

    // 4. Execute tools, append results to history
    messages.push({ role: 'assistant', content: text, tool_calls: toolCalls })

    for (const call of toolCalls) {
      const result = await executeTool(call)
      messages.push({ role: 'tool', content: result, tool_call_id: call.id })
    }

    // 5. Loop back — LLM will see tool results
  }

  yield { type: 'error', message: 'Max turns exceeded' }
}
```

## How Top Harnesses Do It

### Claude Code
Uses an async generator that yields events (text deltas, tool starts, tool results, turn completions). The loop is clean: stream → collect tool calls → execute → append → loop. Max turns configurable. The Agent SDK exposes this as `query()`.

### SWE-agent
Adds a **thought-action-observation** cycle inspired by ReAct. The agent explicitly outputs a "thought" before each action, making its reasoning visible. Observations include structured feedback (line numbers, diffs) rather than raw output.

### Codex CLI
Two-phase loop: first the model responds, then tool calls are executed with OS-level sandboxing. Each tool call goes through a permission check before execution. The loop tracks "apply patches" as a special tool that modifies files.

## Key Patterns

### Stop Conditions
1. **No tool calls** — model responded with text only, task is done
2. **Max turns** — safety limit to prevent infinite loops (typically 25-50)
3. **User abort** — AbortSignal or Ctrl+C
4. **Stop reason** — model explicitly signals completion (`end_turn`, `max_tokens`)

### Streaming
Always stream. Users need to see progress. The async generator pattern is ideal — each chunk yields immediately while the loop continues internally.

### Tool Call Ordering
Execute tool calls sequentially, not in parallel. Parallel execution causes race conditions (two tools editing the same file). Some harnesses allow parallel execution for read-only tools only.

### History Management
Append assistant messages (with tool_calls) and tool results to the message array. The LLM sees the full history each turn. When history gets too large, trigger compaction (see Context Management).

## Common Pitfalls

- **No max turns limit** — agent loops forever burning tokens
- **Swallowing tool errors** — errors should be returned to the LLM so it can adapt
- **Not streaming** — user sees nothing for 30 seconds, thinks it's broken
- **Parallel tool execution** — causes file conflicts and race conditions
- **No abort mechanism** — user can't stop a runaway agent

## Checklist

- [ ] Async generator pattern for streaming
- [ ] Max turns limit (default 25)
- [ ] AbortSignal support
- [ ] Tool errors returned to LLM as text
- [ ] Sequential tool execution
- [ ] Events emitted for UI (text_delta, tool_start, tool_result, turn_complete)
