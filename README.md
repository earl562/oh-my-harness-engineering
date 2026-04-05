# Awesome Agentic Harness

**The model isn't the moat — the system is.**

The same LLM produces wildly different results depending on the harness wrapping it. A well-designed agentic harness turns a language model into a software engineer. A bad one turns it into an expensive autocomplete.

This repo documents what makes the difference — distilled from studying 10 production agent harnesses and building one from scratch.

## What Is an Agentic Harness?

An agentic harness is the system that sits between a language model and the real world. It manages the conversation loop, provides tools, handles errors, routes to the right model, enforces permissions, and presents results to the user.

Think of it like a race car: the engine (LLM) matters, but the chassis, suspension, tires, and driver (harness) determine whether you win.

## The 10 Components

| # | Component | Doc |
|---|-----------|-----|
| 0 | [Anatomy Overview](docs/01-anatomy-of-an-agent-harness.md) | What makes a harness vs just an LLM wrapper |
| 1 | [Agent Loop](docs/02-the-agent-loop.md) | Core observe-choose-act cycle |
| 2 | [Tool System](docs/03-tool-system.md) | Schema design, execution, sandboxing |
| 3 | [Context Management](docs/04-context-management.md) | History, compaction, memory |
| 4 | [Model Routing](docs/05-model-routing.md) | Classification, tiering, fallbacks |
| 5 | [Provider Abstraction](docs/06-provider-abstraction.md) | Multi-provider gateway pattern |
| 6 | [Error Recovery](docs/07-error-recovery.md) | Retry, self-correction, lint gates |
| 7 | [Security & Permissions](docs/08-security-and-permissions.md) | Allowlists, sandboxing, approvals |
| 8 | [TUI & UX](docs/09-tui-and-ux.md) | Streaming, progress, trust signals |
| 9 | [Eval & Benchmarks](docs/10-eval-and-benchmarks.md) | Task suites, metrics, measurement |
| 10 | [Lessons from the Field](docs/11-lessons-from-the-field.md) | What works, what doesn't, what's next |

## Built By Studying

| Harness | Org | Key Insight |
|---------|-----|-------------|
| **Claude Code** | Anthropic | Gold standard agent loop + tool system |
| **Aider** | Independent | Git-aware editing with repo maps |
| **OpenHands** | All-Hands-AI | Sandboxed execution in Docker |
| **SWE-agent** | Princeton | Agent-Computer Interface research |
| **Goose** | Block | Plugin-first via MCP |
| **Cline** | Independent | Best permission UX |
| **Codex CLI** | OpenAI | OS-native sandboxing |
| **Continue** | Independent | Context providers pattern |
| **Cursor** | Anysphere | IDE-integrated codebase indexing |
| **Devin** | Cognition | Long-running autonomous agent |

Full comparison: [Harness Matrix](references/harness-matrix.md) | Benchmarks: [Task Suite](benchmarks/task-suite.md)

## License

MIT
