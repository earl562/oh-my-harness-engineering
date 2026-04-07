# Reading List

Curated articles, papers, and resources for understanding agentic harnesses. Organized by category, with key takeaways for each entry.

---

## Foundational Articles

| Title | Author | Key Insight |
|-------|--------|-------------|
| [Components of a Coding Agent](https://magazine.sebastianraschka.com/p/components-of-a-coding-agent) | Sebastian Raschka | Six components that make coding agents work: live repo context, prompt cache reuse, tool access, context bloat minimization, structured session memory, and bounded subagents. Includes a minimal open-source Python implementation. |
| [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) | Anthropic | Patterns for building agents that actually work: augmented LLMs, prompt chaining, routing, parallelization, orchestrator-workers, and evaluator-optimizer loops. Argues most tasks don't need complex frameworks — just well-composed LLM calls. |
| [How We Built Codex](https://openai.com/index/building-codex/) | OpenAI | Architecture of Codex CLI: cloud sandboxes, microVM isolation, tool design, and the two-phase agent loop. Shows how OS-level sandboxing enables full autonomy. |
| [The Agent-Computer Interface](https://princeton-nlp.github.io/SWE-agent/) | Princeton NLP | Research showing that tool interface design matters more than tool quantity. Structured observations, guardrails, and windowed file viewing dramatically improve task completion. |
| [What Makes a Good Agent Loop?](https://blog.langchain.dev/what-is-an-agent/) | LangChain | Breaks down the observe-think-act cycle and different loop architectures: ReAct, plan-and-execute, and reflection patterns. |

## ArXiv Papers

| Paper | Authors | Year | Key Contribution |
|-------|---------|------|-----------------|
| [SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering](https://arxiv.org/abs/2405.15793) | Yang et al. (Princeton) | 2024 | Introduced ACI design principles. Showed that simple agents with well-designed tool interfaces outperform complex multi-agent systems. |
| [SWE-bench: Can Language Models Resolve Real-World GitHub Issues?](https://arxiv.org/abs/2310.06770) | Jimenez et al. (Princeton) | 2023 | The standard benchmark for coding agents. 2,294 real GitHub issues, now the primary way harnesses are evaluated. |
| [OpenHands: An Open Platform for AI Software Developers](https://arxiv.org/abs/2407.16741) | Wang et al. (All-Hands-AI) | 2024 | Architecture for sandboxed agent execution. Docker-based isolation, event streams, and the CodeAct agent pattern. |
| [Agentless: Demystifying LLM-based Software Engineering Agents](https://arxiv.org/abs/2407.01489) | Xia et al. | 2024 | Argues against complex agent architectures. Shows that localization + repair without an agent loop achieves competitive results. A counterpoint to harness complexity. |
| [AutoCodeRover: Autonomous Program Improvement](https://arxiv.org/abs/2404.05427) | Zhang et al. | 2024 | Uses program structure (AST) for context retrieval instead of file-level search. Demonstrates that structured code understanding improves patching accuracy. |
| [CodeR: Issue Resolving with Multi-Agent and Task Graphs](https://arxiv.org/abs/2406.01304) | Chen et al. | 2024 | Multi-agent approach with task decomposition graphs. Shows when multi-agent coordination helps (complex cross-file tasks) and when it hurts (simple fixes). |
| [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) | Yao et al. | 2022 | The foundational paper behind thought-action-observation loops. Almost every agent loop today is a variant of ReAct. |

## Company Engineering Blogs

| Post | Company | Topic |
|------|---------|-------|
| [Claude Code: Best Practices for Agentic Coding](https://www.anthropic.com/engineering/claude-code-best-practices) | Anthropic | Official guide to getting the most out of Claude Code's harness: CLAUDE.md files, context management, multi-agent patterns. |
| [Aider: How It Works](https://aider.chat/docs/repomap.html) | Aider | Deep dive on repo maps — tree-sitter-generated codebase summaries that give the LLM a bird's-eye view without reading every file. |
| [Devin: Our Approach to Software Engineering](https://www.cognition.ai/blog) | Cognition | Long-running autonomous agents with DeepWiki for codebase understanding and full cloud VM sandboxing. |
| [Goose: Extensible AI Developer Agent](https://block.github.io/goose/) | Block (Square) | MCP-first architecture where all capabilities come through Model Context Protocol plugins. |

## Official Repositories

| Harness | Repo | License |
|---------|------|---------|
| Claude Code | [anthropics/claude-code](https://github.com/anthropics/claude-code) | Proprietary (source-available) |
| Aider | [Aider-AI/aider](https://github.com/Aider-AI/aider) | Apache 2.0 |
| OpenHands | [All-Hands-AI/OpenHands](https://github.com/All-Hands-AI/OpenHands) | MIT |
| SWE-agent | [princeton-nlp/SWE-agent](https://github.com/princeton-nlp/SWE-agent) | MIT |
| Goose | [block/goose](https://github.com/block/goose) | Apache 2.0 |
| Cline | [cline/cline](https://github.com/cline/cline) | Apache 2.0 |
| Codex CLI | [openai/codex](https://github.com/openai/codex) | Apache 2.0 |
| Continue | [continuedev/continue](https://github.com/continuedev/continue) | Apache 2.0 |

## Benchmarks & Leaderboards

| Resource | What It Measures |
|----------|-----------------|
| [SWE-bench Leaderboard](https://www.swebench.com/) | Standard coding agent benchmark — resolved GitHub issues |
| [SWE-bench Verified](https://www.swebench.com/) | Curated 500-task subset with human-verified solutions |
| [Aider Polyglot Benchmark](https://aider.chat/docs/leaderboards/) | Multi-language code editing benchmark across Python, JS, C++, etc. |
| [Terminal Bench](https://terminalbench.com/) | Terminal-based agent evaluation for real-world coding tasks |

---

*Know an article or paper that should be here? See [CONTRIBUTING.md](../CONTRIBUTING.md).*
