# Awesome Agentic Harness

[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**The model isn't the moat — the system is.**

The same LLM produces wildly different results depending on the harness wrapping it. A well-designed agentic harness turns a language model into a software engineer. A bad one turns it into an expensive autocomplete.

This repo documents what makes the difference — distilled from studying 10 production agent harnesses and building one from scratch.

## Start Here

| If you want to... | Go to... |
|-------------------|----------|
| Understand what a harness is | [Anatomy Overview](docs/01-anatomy-of-an-agent-harness.md) |
| Pick the right harness for your use case | [Which Harness?](references/use-case-guide.md) |
| Read the best articles and papers | [Reading List](references/reading-list.md) |
| See how top harnesses solve hard problems | [Case Studies](case-studies/) |
| Compare all 10 harnesses side by side | [Harness Matrix](references/harness-matrix.md) |
| Build your own harness | Start with [The Agent Loop](docs/02-the-agent-loop.md), then read all 10 components below |

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

## Which Harness?

Different harnesses excel at different tasks — just like models. Here's the quick version:

| Use Case | Best Fit |
|----------|----------|
| Solo dev, terminal | Claude Code, Aider |
| Solo dev, IDE | Cursor, Continue |
| Autonomous tasks | Claude Code, Devin |
| Untrusted code | OpenHands, Codex CLI |
| Plugin extensibility | Goose |
| Building your own | Agent SDK, SWE-agent |
| Local/private models | Aider, Continue, Goose |

Full guide with decision flowchart and constraint filtering: **[Use Case Guide](references/use-case-guide.md)**

## Case Studies

Deep dives into specific architectural decisions:

| Case Study | Harness | Focus |
|------------|---------|-------|
| [Sub-Agent Patterns](case-studies/claude-code-sub-agent-patterns.md) | Claude Code | Bounded child agents with restricted tool access |
| [ACI Design](case-studies/swe-agent-aci-design.md) | SWE-agent | Why tool interface design beats tool quantity |
| [OS-Native Sandboxing](case-studies/openai-codex-sandboxing.md) | Codex CLI | Kernel-level isolation vs Docker vs permissions |

## Reading List

Curated articles, arxiv papers, and resources: **[Full Reading List](references/reading-list.md)**

Highlights:
- [Components of a Coding Agent](https://magazine.sebastianraschka.com/p/components-of-a-coding-agent) — Sebastian Raschka
- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic
- [SWE-agent: Agent-Computer Interfaces](https://arxiv.org/abs/2405.15793) — Princeton NLP
- [How We Built Codex](https://openai.com/index/building-codex/) — OpenAI

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

## Contributing

We want this to be the definitive resource for agentic harness knowledge. Contributions welcome — see **[CONTRIBUTING.md](CONTRIBUTING.md)** for guidelines.

Especially interested in:
- New articles, papers, and company engineering posts
- Case studies on architectural decisions
- New harness profiles and benchmark results
- Corrections and updates as the space evolves

## License

MIT
