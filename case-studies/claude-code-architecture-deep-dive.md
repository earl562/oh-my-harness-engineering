# Claude Code: Full Architecture Deep Dive

On March 31, 2026, Claude Code's full TypeScript source (512,000 lines, 55 directories, 331 modules) was exposed via an accidentally-shipped Bun source map. This case study documents the architectural patterns revealed — not as a clone guide, but as a blueprint for production harness engineering.

## The Agent Loop: An Async Generator, Not a While Loop

The heart of Claude Code lives in `query.ts`: ~1,700 lines of TypeScript. The most important decision is in the function signature:

```typescript
async function* query(deps: QueryDeps, params: QueryParams): AsyncGenerator<StreamEvent>
```

That `function*` is load-bearing. An async generator yields values over time, pauses on demand, and lets any caller break out at any point. Compare it to what most tutorials teach:

```typescript
// Tutorial version — collapses in production
while (true) {
  const response = await llm.chat(messages)
  if (response.done) break
  messages.push(response)
}
```

The tutorial version fails on 5 axes that the generator solves:

1. **No streaming** — user watches a blank screen for 10-30 seconds
2. **No cancellation** — Ctrl+C requires a separate abort mechanism; with a generator, the caller stops calling `.next()` and the `finally` block runs
3. **No composability** — the REPL UI, sub-agents, and tests all consume the same generator
4. **No backpressure** — if the model generates faster than the terminal renders, memory grows unbounded; a generator pauses when the consumer stops pulling
5. **No error recovery inside the loop** — errors must be handled as first-class states, not outer try-catches

### Five Phases Per Iteration

Each iteration runs through 5 phases:

**Phase 1: Setup.** Apply tool result budgets, run compaction if conversation is long, validate token counts. Most harnesses pass the raw message array and hope nothing breaks.

**Phase 2: Model Invocation.** Call `queryModelWithStreaming()` through a dependency-injected interface, wrapped in a retry system handling 10 error classes. **The streaming tool executor starts executing tools during this phase** — a Grep call starts running the instant its input JSON is complete in the stream, seconds before the next tool call even begins arriving.

**Phase 3: Error Recovery & Compaction.** Check for recoverable errors after the model responds. `prompt-too-long`? Compact and retry. `max_output_tokens` hit? Escalate from 32K to 64K and retry. Context overflow? Run reactive compaction on media-heavy messages. These are first-class states in the loop's state machine.

**Phase 4: Tool Execution.** Tools not yet executed by the streaming executor run here. Results yield to the UI as they complete. Haiku generates tool use summaries asynchronously so the main model doesn't burn tokens on bookkeeping.

**Phase 5: Continuation Decision.** The model's `stop_reason`, turn counter, hooks, and abort signals determine whether to continue. If continuing, increment state and return to Phase 1.

### Dependency Injection Makes It Testable

```typescript
interface QueryDeps {
  callModel: (params) => AsyncGenerator<ModelEvent>
  executeTools: (calls) => Promise<ToolResult[]>
  checkPermission: (tool, input) => Promise<PermissionResult>
  compact: (messages) => Promise<Message[]>
}
```

Inject a mock `callModel` that yields predetermined events, and you can verify context overflow handling, tool failures, and cancellation without touching the real API.

## Tool Execution: Concurrency Classification

Claude Code ships 45+ built-in tools. How they execute matters more than the count.

Every tool is classified by concurrency behavior:

```typescript
type ConcurrencyClass = 'read-only' | 'state-mutating' | 'exclusive'
```

The orchestration layer partitions tool calls into batches:
- **Read-only tools** (Glob, Grep, Read, WebFetch) run concurrently, up to 10 in parallel
- **State-mutating tools** (Bash, Edit, Write) run serially
- **Exclusive tools** run alone with no siblings

This gives 2-5x speedup on multi-tool turns: search 5 files in parallel, then edit one serially. No race conditions.

### The Streaming Tool Executor

Most harnesses wait for the model to finish generating before executing any tools. Claude Code starts execution mid-stream:

```
Model streaming: "Let me search for the config file..."
                  ↓ tool_call JSON complete for Grep
                  [Grep starts executing immediately]
Model streaming: "...and also check the tests..."
                  ↓ tool_call JSON complete for Read
                  [Read starts executing while Grep still running]
Model streaming: "...here's what I found."
                  [Both results already available]
```

For a turn with three tool calls, this hides 2-5 seconds of latency. Hard cases handled:
- Tool failure triggers per-tool `siblingAbortController` — siblings die, parent query survives
- Stream fallback discards queued tools and generates synthetic error results
- Results yield in original order even if tool 2 finishes before tool 1

### Tool Result Budgeting

A Bash command dumping 1MB of logs fills the context with noise. Claude Code budgets tool results:
- Each tool specifies `maxResultSizeChars`
- Results exceeding the limit persist to disk
- The model receives a file path reference + preview of the first N characters
- `applyToolResultBudget()` runs before each API call to constrain total tool result tokens

## The System Prompt: A Caching Problem

The system prompt is not a string — it's a structured array of sections with caching metadata:

```
[SYSTEM_PROMPT_STATIC]        ← identical across all users/sessions, globally cached
──── DYNAMIC BOUNDARY ────    ← explicit marker
[SYSTEM_PROMPT_MEMOIZED]      ← computed once per session
[SYSTEM_PROMPT_VOLATILE]      ← recomputed every turn (minimized)
```

Everything above the boundary hits the prompt cache at the API level — ~80% of the prompt. You don't re-tokenize 577+ lines on every API call.

**Context injection lives outside the system prompt.** User context (git status, CLAUDE.md contents, current date) is injected as the first user message in `<system-reminder>` tags. Context changes every turn — putting it in the system prompt would invalidate the cache after the change point. Moving it to a user message keeps the system prompt cache-stable.

No agent tutorial discusses designing the prompt for cache efficiency. At scale, it determines whether your agent costs $0.02 per session or $0.20.

## Four Compaction Strategies

Ordered cheapest to most expensive — cheapest fires first:

### Strategy 1: Microcompact
Runs every turn. If a tool was called and its result hasn't changed since last call, replace the full result with a cached reference. For tools like Read called repeatedly on the same file, saves thousands of tokens per session. Cost: near zero.

### Strategy 2: Snip Compact
Fires when approaching token limits. Removes messages from the beginning while preserving a "protected tail" of recent messages. No model call required. Lossy but fast.

### Strategy 3: Auto Compact
Triggered when token usage crosses a threshold and snip is insufficient. A separate model call summarizes prior conversation. Old messages replaced with the summary. Tracks compaction state to prevent loops (summarizing the summary of the summary).

### Strategy 4: Context Collapse
For multi-hour sessions, behind a feature flag. Multi-phase staged compression: collapse tool results first, then thinking blocks, then entire sections. The expensive option.

**The hierarchy matters:** most harnesses that implement compaction jump straight to summarization. Summarization costs tokens on both the compaction call and the summary. Microcompact and snip handle a large percentage of cases with zero model calls.

## The 7-Stage Permission Pipeline

Not a binary allow/deny — a cascading pipeline:

```
Tool call requested
    ↓
1. Enterprise deny rules     (MDM-enforced, cannot override)
    ↓
2. Project deny rules        (.claude/settings.json)
    ↓
3. User deny rules           (~/.claude/settings.json)
    ↓
4. Session deny rules        (runtime state)
    ↓
5. Pre-tool hooks            (shell scripts, LLM evaluation, HTTP)
    ↓
6. Permission mode check     (default → acceptEdits → bypassPermissions)
    ↓
7. User approval prompt      (if required by mode)
```

Rules use glob-like pattern matching:

```json
{
  "permissions": {
    "allow": ["bash(git *)", "bash(npm test)", "read(*)", "glob(*)"],
    "deny": ["bash(rm *)", "bash(curl *)"]
  }
}
```

"Allow all bash" is too coarse. "Deny all bash" makes the agent useless. "Allow git commands and npm test, prompt for everything else" is the sweet spot.

## Sub-Agent Architecture

Sub-agents are independent instances of the agent loop with their own context, tools, and working directory. Key isolation mechanisms:

- **Fresh context** — no conversation history from the parent
- **Restricted tools** — parent specifies which tools the sub-agent can use
- **Result aggregation** — only the final output reaches the parent, not the full transcript
- **State isolation** — `appState` is a no-op setter; file caches are cloned
- **Cascade abort** — aborting parent cascades to all children

### Git Worktree Isolation

Sub-agents that modify code get their own worktree:

```
getOrCreateWorktree(repoRoot, slug)
    → Validate slug (max 64 chars, no path traversal)
    → Check if worktree already exists (fast resume)
    → git fetch (with no-prompt env vars)
    → git worktree add (new branch: worktree-<slug>)
    → Symlink large dirs (node_modules, .cache)
    → Copy CLAUDE.md, project settings, .env files
    → Return { path, branch, headCommit }
```

One agent, one worktree. Parallel agents share a workspace through symlinks but work on independent branches.

### Task Coordination

Disk-backed task list at `~/.claude/tasks/<taskListId>/<taskId>.json`. File-based locking with exponential backoff (30 retries, 5-100ms). A high water mark prevents task ID reuse after reset. This is distributed coordination for agents.

## The 823-Line Retry System

`withRetry.ts` handles 10+ error classes with specific recovery paths:

| Error | Recovery |
|-------|----------|
| **429 (Rate Limited)** | Check Retry-After header. Under 20s → retry. Over 20s → 30-min cooldown. `overage-disabled` header → permanently disable fast mode. |
| **529 (Overloaded)** | Track consecutive 529s. Three in a row with fallback available → switch models. Background task → bail to prevent cascade. |
| **400 (Context Overflow)** | Parse error for actual/limit token counts. Recalculate: available = limit - input - 1000 safety buffer. Enforce minimum 3,000 output tokens. Retry. |
| **401/403 (Auth)** | Clear API key cache. Force-refresh OAuth. Retry with new credentials. |
| **Network (ECONNRESET, EPIPE)** | Disable keep-alive socket pooling. Retry with new connection. |

Backoff formula: `delay = min(500ms × 2^attempt, 32s) + random(0, 0.25 × baseDelay)`

For unattended sessions (CI/CD, background agents): persistent retry mode retries 429/529 indefinitely. 5-minute max backoff. 6-hour reset cap. 30-second heartbeat emissions prevent idle kills.

The streaming layer adds: 90-second idle timeout watchdog (warning at 45s), 30-second stall detection between chunks, and streaming→non-streaming fallback.

## Four Extension Mechanisms (Zero Source Modifications)

1. **Skills** — Markdown files with YAML frontmatter. Path-based discovery: a skill specifying `paths: ["*.tsx"]` only activates when touching matching files.

2. **Hooks** — Six types: shell commands, LLM evaluation, agentic verification, HTTP endpoints, TypeScript callbacks, in-memory functions. Fires on PreToolUse, PostToolUse, SessionStart, FileChanged, Stop.

3. **MCP** — Five transport types: stdio, SSE, HTTP streaming, WebSocket, in-process. Configured at enterprise, project, and user levels.

4. **Plugins** — Directories containing skills, agents, hooks, and config. Top-level composition: add capabilities without touching existing files.

All four follow: **composition over modification.** Extend by adding, not changing. Core updates don't break extensions.

## Lessons for Your Harness

1. **Async generators for the agent loop.** Streaming, cancellation, composability, backpressure — all inherent to the abstraction.

2. **Concurrency classification for tools.** Read-only parallel, state-mutating serial. 2-5x speedup, zero race conditions.

3. **Tool execution during streaming.** Parse tool calls incrementally, start execution the instant input JSON is complete.

4. **System prompt designed for the cache boundary.** Static content first, dynamic last, boundary marked explicitly.

5. **A compaction hierarchy, not a single strategy.** Cheap first, expensive last.

6. **Error recovery as first-class states in the loop.** Each error type gets its own recovery path inside the state machine.

7. **Layer 4 from day one.** Where does state live across sessions? How do permissions scale to teams? How does coordination work with parallelism?

8. **Extension points requiring zero code changes.** If users fork to customize, your architecture has a gap.

---

*Sources: [Claude Code Architecture Teardown](https://x.com/rohit4verse/status/1909257973578944960) by @rohit4verse, [Anthropic Harness Design Blog](https://www.anthropic.com/engineering/harness-design-for-long-running-application-development), public source analysis.*
