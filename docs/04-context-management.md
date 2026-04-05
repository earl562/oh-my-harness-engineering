# Context Management

## What It Is

Context management controls what the agent remembers across turns. Every turn, the full message history is sent to the LLM. As conversations grow, this history exceeds the context window — the harness must compress, summarize, or drop older context intelligently.

## Why It Matters

Without compaction, agents hit context limits after 10-20 tool-heavy turns. The agent loses its ability to reference earlier work, starts repeating itself, or crashes. Good context management enables long-running sessions (50+ turns) without degradation.

## Three Tiers

### Tier 1: Raw History (minimum viable)
Keep all messages. Simple but hits context limits fast.

### Tier 2: Compaction (production baseline)
When history exceeds a threshold, use the LLM to summarize older turns while preserving recent ones. Claude Code, Cline, and OpenHands all do this.

**Trigger:** When context usage reaches 60% of the window (not 95% — leave room for the compaction call itself).

```typescript
function shouldCompact(messages: Message[], maxTokens: number): boolean {
  const estimatedTokens = estimateTokenCount(messages)
  return estimatedTokens > maxTokens * 0.6
}

async function compact(messages: Message[], provider: LLMProvider): Promise<Message[]> {
  const recentCount = 10 // Protect last 10 messages
  const toCompact = messages.slice(0, -recentCount)
  const recent = messages.slice(-recentCount)

  const summary = await provider.chat({
    model: 'haiku', // Use cheap model for compaction
    messages: [{
      role: 'user',
      content: `Summarize this conversation history, preserving: file paths mentioned, decisions made, errors encountered, and current task state.\n\n${formatMessages(toCompact)}`
    }]
  })

  return [
    { role: 'system', content: `[Compacted history]\n${summary}` },
    ...recent
  ]
}
```

### Tier 3: Structured Memory (advanced)
Separate **working memory** (distilled state: current task, files changed, decisions made) from **transcript** (full conversation log). Working memory is always in context; transcript is searchable but not sent to the LLM.

**Aider's repo map** is a form of structured memory — a tree-sitter-generated summary of all files showing classes, functions, and relationships. It gives the LLM a bird's-eye view without reading every file.

## How Top Harnesses Do It

### Claude Code
Automatic compaction when context reaches threshold. Uses the LLM to summarize, preserving structured metadata. The Agent SDK handles this internally.

### Aider
Generates a **repo map** using tree-sitter — a compact representation of the entire codebase showing file structure, class names, function signatures. This map stays in context and guides the agent to the right files without reading them all.

### Cursor
Full codebase indexing with tree-sitter + vector embeddings. When the agent needs context, it queries the index rather than reading files sequentially. Supports @-mentions to pull specific files into context.

### Cline
Uses the LLM to summarize at 60% context usage. The summary includes: current task, files modified, decisions made, errors encountered. Recent messages preserved in full.

## Prompt Cache Optimization

Structure your system prompt so the stable prefix (instructions + tool definitions) stays constant across turns. Most providers cache this prefix — you only pay for new tokens.

```
[Stable prefix — cached]           ← System prompt + tool schemas (same every turn)
[Compacted history — semi-stable]  ← Changes when compaction runs
[Recent messages — changes]        ← New each turn
```

Claude Code structures prompts this way and gets 50-90% cache hit rates on multi-turn sessions.

## Common Pitfalls

- **Compacting too late** — at 95% capacity, the compaction call itself may exceed the window
- **Losing tool results** — compaction must preserve file paths and error messages
- **No structured metadata** — summary should capture WHAT happened, not just summarize text
- **Compacting everything** — always protect the last N messages in full

## Checklist

- [ ] Monitor context usage per turn
- [ ] Trigger compaction at 60% capacity
- [ ] Use cheap model for compaction (haiku)
- [ ] Preserve recent messages (last 10)
- [ ] Include structured metadata in summaries (files, decisions, errors)
- [ ] Stable system prompt prefix for cache optimization
