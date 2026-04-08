# Anatomy of an Agent Harness

## What It Is

An agentic harness is the runtime system that turns an LLM into an autonomous agent. Without a harness, an LLM is a stateless text generator — it can answer questions but can't read files, run commands, or execute multi-step workflows.

The harness provides: a conversation loop, tools to interact with the world, context management to stay on track, and guardrails to stay safe.

## The Four-Layer Model

The industry has traditionally described agent systems as three layers: **model weights**, **context**, and **harness**. The SWE-agent paper from Princeton NLP validated this: same GPT-4, same tasks, 64% improvement by changing only the harness layer. Performance gains live in layers 2 and 3, not layer 1.

But studying production systems like Claude Code reveals a fourth layer that the three-layer model misses:

```
Layer 1: Model Weights      — frozen intelligence, the API you call
Layer 2: Context             — prompt, conversation history, retrieved documents
Layer 3: Harness             — tools, loops, error handling, the agent's designed environment
Layer 4: Infrastructure      — multi-tenancy, RBAC, resource isolation,
                               state persistence, distributed coordination
```

**Most teams talk about the first three because they are interesting to think about. The fourth is where products die.**

Layer 3 describes how one model instance interacts with one set of tools in one session. The moment you need multiple users, multiple sessions, multiple agents, or deployment to environments you don't control, you are in layer 4.

### What Layer 4 Looks Like in Practice

Claude Code's source reveals infrastructure engineering throughout:
- A **4-level CLAUDE.md hierarchy** lets enterprise admins enforce policies via MDM, project maintainers set conventions, and individual developers override locally
- A **disk-backed task list** with file-based locking keeps parallel sub-agents from corrupting each other's state
- **Git worktree isolation** gives 5 agents 5 branches on the same repo with zero conflicts
- A **permission pipeline** cascades deny rules from enterprise → project → user → session

None of that is harness. None of that is context. None of that is weights. That is infrastructure: multi-tenancy, RBAC, resource isolation, state persistence, distributed coordination. Teams that stop at layer 3 build demos. Teams that build all four layers build products.

## The 10 Essential Components

### 1. The Agent Loop
The core observe-choose-act cycle. Each turn: send messages to the LLM, receive a response, check if tools were called, execute them, feed results back, repeat. The [2026 OpenDev paper](https://arxiv.org/abs/2603.05344) formalizes this as a ReAct core surrounded by 7 subsystems: pre-check, compaction, thinking, self-critique, action, tool execution, and post-processing. See [The Agent Loop](02-the-agent-loop.md).

### 2. Tool System
How the agent interacts with the world. Tools are defined as JSON schemas (name, description, parameters), executed by the harness, and results fed back to the LLM. SWE-agent proved this is the #1 lever for agent quality after the model itself — same model, better tools, 2x task completion. See [Tool System](03-tool-system.md).

### 3. Context Management
What the agent remembers across turns. Production harnesses implement a hierarchy of compaction strategies ordered cheapest to most expensive: **microcompact** (deduplicate unchanged tool results, near-zero cost), **snip** (remove old messages, no model call), **auto-compact** (LLM summarization), and **context collapse** (multi-phase staged compression for multi-hour sessions). See [Context Management](04-context-management.md).

### 4. Model Routing
Not every turn needs the same model. Simple questions → cheap/fast model. Complex reasoning → expensive/powerful model. The harness classifies each turn with keyword heuristics (no LLM call needed) and routes accordingly. Saves 50-80% on costs — teams report going from $50/day to $12/day. See [Model Routing](05-model-routing.md).

### 5. Provider Abstraction
A gateway layer that normalizes different LLM APIs (OpenAI, Anthropic, Google, local models) behind a single `LLMProvider` interface with async generator streaming. ~80% of providers are OpenAI-compatible, covered by one shared handler. See [Provider Abstraction](06-provider-abstraction.md).

### 6. Error Recovery
Agents fail constantly. Production harnesses implement error recovery as a first-class state machine inside the loop, not an outer try-catch. Claude Code's retry system handles 10+ error classes: rate limits with Retry-After headers, context overflow with dynamic budget adjustment, auth failures with token refresh, network errors with connection pool resets. See [Error Recovery](07-error-recovery.md).

### 7. Security & Permissions
Agents can run arbitrary code. Claude Code implements a 7-stage permission pipeline with glob-based pattern matching on tool names and inputs. Modes create progressive trust: new users approve each action → experienced users auto-accept edits → power users bypass permissions. Hooks provide programmatic escape hatches for organization-specific policies. See [Security & Permissions](08-security-and-permissions.md).

### 8. TUI & UX
How the human interacts with the agent. Streaming text, tool call visualization, progress indicators. Good UX builds trust — users who can see what the agent is doing give it more autonomy, and autonomy is where useful work happens. Claude Code's UI shows model name, cost in USD, context window usage %, and rate limit utilization in a persistent status line. See [TUI & UX](09-tui-and-ux.md).

### 9. Eval & Benchmarks
How you measure harness quality. SWE-bench Verified is being retired as a primary discriminator (top scores now 75-79%). The field has moved to SWE-bench Pro, FeatureBench, Terminal-Bench 2.0, and OpenHands Index. Terminal-Bench 2.0 showed that LangChain improved from 52.8% to 66.5% by changing only the harness — not the model. See [Eval & Benchmarks](10-eval-and-benchmarks.md).

### 10. Memory & Persistence
Session state that survives restarts. Claude Code solves this at three levels: **within a session** (compaction), **across sessions** (CLAUDE.md files), **across agents** (disk-backed task list with file locking). The AGENTS.md standard (adopted by 60K+ projects) extends this pattern across different harnesses.

## The Generator-Evaluator Pattern (2026)

[Anthropic's harness research](https://www.anthropic.com/engineering/harness-design-for-long-running-application-development) introduced a GAN-inspired multi-agent architecture that produces dramatically better output than single-agent runs:

```
[Planner]           — expands a 1-sentence prompt into a full product spec
    ↓
[Generator]         — implements features one sprint at a time
    ↓
[Evaluator]         — tests the running app via Playwright, grades against criteria
    ↓
[Generator]         — fixes issues found by evaluator
    ↓
[Evaluator]         — re-tests until quality thresholds are met
    ↓
[Next sprint...]
```

The key insight: **when asked to evaluate their own work, agents confidently praise it — even when quality is mediocre.** Separating the generator from the evaluator creates an external feedback loop. Tuning a standalone evaluator to be skeptical is far more tractable than making a generator critical of its own work.

In their testing, a video game maker prompt produced:
- **Solo agent (20 min, $9):** Interface with broken core gameplay — entities appeared but nothing responded to input
- **Full harness (6 hrs, $200):** Working game with sprite editor, AI-assisted level designer, physics, and playable levels

The evaluator caught issues the generator consistently missed: broken fill tools, incorrect API route ordering, entity selection bugs with specific condition logic.

**Critical lesson from their iteration:** every harness component encodes an assumption about what the model can't do on its own, and those assumptions should be stress-tested as models improve. When they moved from Opus 4.5 to Opus 4.6, they removed the sprint construct entirely because the newer model handled long coherent sessions natively. **Harness complexity should scale down as models improve.**

## What Makes a Harness vs Just a Wrapper

A **wrapper** sends prompts to an LLM and returns responses. That's `curl` with a system prompt.

A **harness** adds:
- Tool execution (the agent can DO things, not just talk about them)
- Multi-turn loops (the agent can iterate until the task is done)
- State management (the agent remembers what happened)
- Error handling (the agent recovers from failures)
- Safety controls (the agent is constrained to appropriate actions)

The minimum viable harness is a loop that sends messages, executes tool calls, and feeds results back. Everything else is optimization — but that optimization is the difference between a demo and a production system. See [Build Your First Harness](build-your-first-harness.md) for a 200-line implementation.

## The Architecture Pattern

```
User Input
    ↓
[System Prompt + Context + History]  ← designed for cache boundary (static first, dynamic last)
    ↓
[LLM Provider] ←→ [Model Router]    ← heuristic classification, no LLM call
    ↓
[Response Parser]                    ← streaming: tokens yield immediately
    ↓
[Tool Calls?] → Yes → [Permission Pipeline] → [Tool Execution] → [Results → History] → Loop
    ↓ No                 ↑ 7-stage trust pipeline
[Text Output → User]    ↑ streaming tool executor: execute during generation
```

Every harness implements this pattern. The differences are in the details: how context is managed, how tools are executed, how errors are handled, how the user interacts. The rest of this repo dives into each of those details.

## The Real Framework

The model isn't the moat. GPT-4, Claude, Gemini — they're all good enough for most tasks. What makes the difference:

1. How you present tools to the model (the ACI)
2. How you manage context across turns (compaction hierarchy)
3. How you recover from errors (state machine, not try-catch)
4. How you route to the right model (keyword heuristics)
5. How you present results to the user (trust builds autonomy)
6. How you coordinate across sessions and agents (infrastructure)

That's the harness + infrastructure. That's the moat.

## Further Reading

- [Build Your First Harness](build-your-first-harness.md) — 200-line tutorial
- [The Agent Loop](02-the-agent-loop.md) — the core execution cycle
- [Tool System](03-tool-system.md) — the highest-leverage component
- [Harness Design for Long-Running Development](https://www.anthropic.com/engineering/harness-design-for-long-running-application-development) — Anthropic's generator/evaluator research
- [Harness Engineering](https://openai.com/index/harness-engineering/) — OpenAI's formalization of the discipline
- [Claude Code Architecture Teardown](https://x.com/rohit4verse/status/1909257973578944960) — deepest public analysis of a production harness
