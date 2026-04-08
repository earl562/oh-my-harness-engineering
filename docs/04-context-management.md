# Context Management

## What It Is

Context management controls what the agent remembers across turns. Every turn, the full message history is sent to the LLM. As conversations grow, this history exceeds the context window — the harness must compress, summarize, or drop older context intelligently.

This is **the single biggest differentiator between agents that work for 10-minute tasks and those that work for 10-hour sessions.** The Poly harness research identified context management as the most critical gap across production harnesses.

## Why It Matters

Without compaction, agents hit context limits after 10-20 tool-heavy turns. The agent loses its ability to reference earlier work, starts repeating itself, or crashes. Research shows a significant quality gap between curated benchmarks (60%+ on SWE-bench Verified) and live tasks (19% on SWE-bench-Live), largely because live tasks require longer sessions with more context management.

The ["Lost in the Middle"](https://arxiv.org/abs/2307.03172) paper proved that LLMs attend to the beginning and end of long contexts but miss information in the middle. This directly impacts harness design: how you structure and position context determines what the agent actually uses.

## The Four Compaction Strategies

Claude Code implements a hierarchy of strategies ordered cheapest to most expensive. Cheapest fires first. Most expensive fires only when nothing else works.

### Strategy 1: Microcompact (Near-Zero Cost)

Runs every turn, before the API call. If a tool was called and its result hasn't changed since last call, replace the full result with a cached reference.

```typescript
function microcompact(messages: Message[]): Message[] {
  const seen = new Map<string, string>()  // hash → tool_call_id

  return messages.map(msg => {
    if (msg.role === 'tool') {
      const hash = createHash('sha256').update(msg.content).digest('hex')
      const previousId = seen.get(hash)

      if (previousId) {
        // Replace duplicate result with reference
        return { ...msg, content: `[Same result as tool call ${previousId}]` }
      }
      seen.set(hash, msg.tool_call_id)
    }
    return msg
  })
}
```

For tools like `Read` called repeatedly on the same file, this saves thousands of tokens per session with zero model calls.

### Strategy 2: Snip Compact (No Model Call)

Fires when approaching token limits, before expensive summarization. Removes messages from the beginning of conversation while preserving a "protected tail" of recent messages.

```typescript
function snipCompact(messages: Message[], maxTokens: number, protectedTail: number = 10): Message[] {
  const recent = messages.slice(-protectedTail)
  const recentTokens = estimateTokens(recent)

  if (recentTokens < maxTokens * 0.8) {
    // Protected tail fits — just drop everything before it
    return [
      { role: 'system', content: '[Earlier conversation history removed]' },
      ...recent
    ]
  }

  // Even tail is too large — more aggressive trimming needed
  return recent.slice(-Math.floor(protectedTail / 2))
}
```

Lossy but fast. No model call, no token cost for the compaction itself.

### Strategy 3: Auto Compact (LLM Summarization)

Triggered when token usage crosses a threshold and snip is insufficient. A separate model call summarizes prior conversation. Old messages are replaced with the summary.

```typescript
async function autoCompact(
  messages: Message[],
  provider: LLMProvider,
  protectedTail: number = 10
): Promise<Message[]> {
  const toCompact = messages.slice(0, -protectedTail)
  const recent = messages.slice(-protectedTail)

  const summary = await provider.chat({
    model: 'haiku',  // Use cheap model — this is bookkeeping, not reasoning
    messages: [{
      role: 'user',
      content: `Summarize this conversation, preserving:
- File paths mentioned and their current state
- Decisions made and their rationale
- Errors encountered and how they were resolved
- Current task state and what remains to be done
- Key code changes made

Conversation:
${formatMessages(toCompact)}`
    }]
  })

  return [
    { role: 'system', content: `[Compacted history]\n${summary}` },
    ...recent
  ]
}
```

The system must track compaction state to prevent loops — summarizing the summary of the summary loses critical detail. Claude Code's implementation prevents re-compaction of already-compacted content.

### Strategy 4: Context Collapse (Multi-Hour Sessions)

For sessions running 2+ hours, behind a feature flag. Multi-phase staged compression:

1. **Phase 1:** Collapse tool results first (keep tool names/inputs, drop full outputs)
2. **Phase 2:** Collapse thinking blocks (keep conclusions, drop reasoning chains)
3. **Phase 3:** Collapse entire message sections (keep only structured metadata)

This is the nuclear option. Expensive and lossy, but it enables sessions that would otherwise be impossible.

### Why the Hierarchy Matters

Most harnesses that implement compaction jump straight to Strategy 3 (LLM summarization). But summarization costs tokens on both the compaction call and the summary itself. Microcompact and snip handle a large percentage of cases with zero model calls. The hierarchy means you pay for expensive compaction only when cheap compaction fails.

**Trigger at 60% capacity — not 95%.** At 95%, the compaction call itself may exceed the window. At 60%, you have room for the compaction prompt plus the summary response.

## The Protected Tail

When compaction runs, recent messages are **never** summarized away. The model keeps full fidelity on the last N exchanges (typically 10) even if earlier context is compressed. This matters because:

- The model can follow through on its current plan without losing track of what it just did
- Recent tool results are preserved in full (file contents, command outputs, error messages)
- The current task state is visible, not summarized

## Codebase Awareness: Three Approaches

Beyond conversation compaction, harnesses need strategies for understanding large codebases without reading every file.

### Approach 1: Repo Map (Aider)

Tree-sitter parses source code into syntax trees. Aider walks these trees to extract class definitions, function signatures, and import relationships — creating a compact "map" of the codebase.

```
src/models/user.ts
  class User
    constructor(id: string, email: string, name: string)
    async save(): Promise<void>
    static async findById(id: string): Promise<User | null>

src/routes/users.ts
  async function getUser(req, res)
  async function createUser(req, res)
```

For a 50-file project, the repo map is ~2,000 tokens (vs 50,000+ to read all files). A graph ranking algorithm (PageRank-style) prioritizes files most relevant to the current task.

**Best for:** Terminal agents that need codebase awareness without full indexing infrastructure.

See [Case Study: Aider Repo Map](../case-studies/aider-repo-map.md).

### Approach 2: Vector Embeddings + Semantic Search (Cursor)

Full codebase indexing with tree-sitter chunking into semantic units (functions, classes), embedded as vectors for retrieval. The agent queries the index for relevant context rather than reading files sequentially. `@codebase` triggers a full semantic search.

**Best for:** IDE agents with persistent environments where the index can stay warm.

See [Case Study: Cursor Codebase Indexing](../case-studies/cursor-codebase-indexing.md).

### Approach 3: Context Providers (Continue)

A modular system where different context sources are pluggable:
- `@codebase` — repository-wide semantic search
- `@docs` — indexed documentation sites
- `@file` — specific file content
- `@repo-map` — call signatures and file relationships
- `HttpContextProvider` — custom REST endpoints for external context

**Best for:** IDE agents that need flexible, extensible context injection.

### Approach 4: Auto-Generated Knowledge Bases (Devin)

DeepWiki automatically indexes repositories every few hours, generating wikis with architecture diagrams, source links, and documentation. The agent reads the wiki instead of the raw codebase.

**Best for:** Autonomous agents working on unfamiliar codebases.

## How Top Harnesses Compare

| Harness | Compaction | RAG/Indexing | Memory System | Instruction Files |
|---------|-----------|--------------|---------------|-------------------|
| **Claude Code** | 4-strategy hierarchy (micro→snip→auto→collapse) | None | CLAUDE.md, sessions, KAIROS (unreleased) | CLAUDE.md |
| **Aider** | None | Repo map (tree-sitter + graph ranking) | None | None |
| **OpenHands** | LLMSummarizingCondenser (~2x cost reduction) | None | Event log replay | None |
| **Cursor** | Internal/undocumented | Full vector indexing + tree-sitter | Persistent sessions | .cursorrules |
| **Cline** | CondenseHandler (LLM self-summary at 60%) | None | None | .clinerules |
| **Codex CLI** | Threshold-based compaction | None | AGENTS.md | AGENTS.md |
| **Continue** | None | @codebase semantic search, @docs indexing | Rules files | .continue/rules/ |
| **SWE-agent** | None (bounded by single-issue tasks) | None | None | None |
| **Goose** | None documented | None | SQLite sessions | AGENTS.md |
| **Devin** | Internal/managed | Auto repo indexing, DeepWiki | DeepWiki knowledge base | Devin Wiki |

## Prompt Cache Optimization

Structure your prompt so the stable prefix stays constant across turns:

```
[Zone 1: Static — globally cached]
  System prompt, persona, instructions, tool schemas
  ─── CACHE BOUNDARY ───

[Zone 2: Semi-stable — session-cached]
  CLAUDE.md / AGENTS.md contents
  Compacted history summary (changes when compaction runs)

[Zone 3: Volatile — changes every turn]
  Recent messages, tool results, user input
```

**Critical insight from Claude Code:** User context (git status, instruction file contents, current date) is injected as the **first user message** wrapped in `<system-reminder>` tags, NOT in the system prompt. Context changes every turn — putting it in the system prompt would invalidate the cache after the change point. Moving it to a user message keeps the system prompt cache-stable.

The paper ["Don't Break the Cache"](https://arxiv.org/abs/2601.06007) found that agentic workflows with 30-50+ tool calls suffer significant cache miss rates as conversation context grows, because each tool call shifts the prefix boundary. Prompt structure matters.

**Impact:** Claude Code achieves 50-90% cache hit rates on multi-turn sessions. At scale, this determines whether your agent costs $0.02 per session or $0.20.

## Context Resets vs Compaction

Anthropic's harness research revealed an important distinction:

- **Compaction** — summarize older messages in place, same agent keeps going
- **Context reset** — clear the context entirely, start a fresh agent, hand off state via structured artifacts

On Opus 4.5, the model exhibited "context anxiety" — prematurely wrapping up work as it approached perceived context limits. Compaction alone didn't fix this because the agent still felt it was running long. A full context reset gave the agent a clean slate.

On Opus 4.6, context anxiety was largely resolved, so compaction alone sufficed and context resets could be dropped. **Lesson: test which approach your model actually needs.**

## Common Pitfalls

- **Compacting too late** — at 95% capacity, the compaction call itself may exceed the window
- **Losing tool results** — compaction must preserve file paths and error messages, not just narrative summary
- **No structured metadata** — summary should capture WHAT happened (files changed, decisions made, errors), not just summarize text
- **Compacting everything** — always protect the last N messages in full
- **Breaking the prompt cache** — volatile context in the system prompt kills cache hits
- **No repo awareness** — without a repo map or index, the agent reads files blind, wasting context on irrelevant content
- **Summarizing the summary** — track compaction state to prevent recursive quality loss

## Checklist

- [ ] Monitor context usage per turn (token estimation)
- [ ] Trigger compaction at 60% capacity (not 95%)
- [ ] Implement cheapest strategy first (microcompact → snip → summarize)
- [ ] Use cheap model for compaction (haiku/flash)
- [ ] Preserve recent messages (protected tail of last 10)
- [ ] Include structured metadata in summaries (files, decisions, errors, next steps)
- [ ] Stable system prompt prefix for cache optimization
- [ ] Dynamic context in user messages, not system prompt
- [ ] Consider repo map or codebase indexing for codebases > 20 files
- [ ] Track compaction state to prevent recursive summarization

## Further Reading

- [Case Study: Aider Repo Map](../case-studies/aider-repo-map.md) — tree-sitter for 10x token efficiency
- [Case Study: Cursor Codebase Indexing](../case-studies/cursor-codebase-indexing.md) — embeddings + structural indexing
- [MemGPT: LLMs as Operating Systems](https://arxiv.org/abs/2310.08560) — OS-inspired memory management
- [Lost in the Middle](https://arxiv.org/abs/2307.03172) — why context placement matters
- [Don't Break the Cache](https://arxiv.org/abs/2601.06007) — prompt structure for cache efficiency
- [Anthropic: Harness Design for Long-Running Development](https://www.anthropic.com/engineering/harness-design-for-long-running-application-development) — context resets vs compaction
