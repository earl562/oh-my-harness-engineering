# Reading List

Curated articles, papers, and resources for understanding agentic harnesses. Organized by category, with key takeaways for each entry.

---

## Foundational Articles

| Title | Author | Key Insight |
|-------|--------|-------------|
| [Components of a Coding Agent](https://magazine.sebastianraschka.com/p/components-of-a-coding-agent) | Sebastian Raschka | Six components that make coding agents work: live repo context, prompt cache reuse, tool access, context bloat minimization, structured session memory, and bounded subagents. Includes a minimal open-source Python implementation. |
| [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) | Anthropic | The definitive patterns guide: augmented LLMs, prompt chaining, routing, parallelization, orchestrator-workers, and evaluator-optimizer loops. Argues most tasks don't need complex frameworks — just well-composed LLM calls. |
| [How We Built Codex](https://openai.com/index/building-codex/) | OpenAI | Architecture of Codex CLI: cloud sandboxes, microVM isolation, tool design, and the two-phase agent loop. Shows how OS-level sandboxing enables full autonomy. |
| [The Agent-Computer Interface](https://princeton-nlp.github.io/SWE-agent/) | Princeton NLP | Tool interface design matters more than tool quantity. Structured observations, guardrails, and windowed file viewing dramatically improve task completion. |
| [What Makes a Good Agent Loop?](https://blog.langchain.dev/what-is-an-agent/) | LangChain | Breaks down the observe-think-act cycle and different loop architectures: ReAct, plan-and-execute, and reflection patterns. |
| [Claude Code: Best Practices for Agentic Coding](https://www.anthropic.com/engineering/claude-code-best-practices) | Anthropic | Official guide to Claude Code's harness: CLAUDE.md files, context management, multi-agent patterns, and how to write effective prompts for agents. |
| [The Anatomy of Autonomy](https://www.latent.space/p/anatomy-of-autonomy) | Latent Space | Deep analysis of what makes agents autonomous versus tool-assisted. Introduces the autonomy spectrum from copilot to fully autonomous. |
| [Why Agents Fail](https://www.anthropic.com/engineering/why-agents-fail) | Anthropic | Empirical analysis of agent failure modes: context overflow, tool misuse, goal drift, and cascading errors. Essential reading for harness designers. |
| [Aider: How Repo Maps Work](https://aider.chat/docs/repomap.html) | Aider | Deep dive on repo maps — tree-sitter-generated codebase summaries that give the LLM a bird's-eye view without reading every file. |
| [The Shift from Models to Systems](https://simonwillison.net/2024/Dec/19/the-shift-from-models-to-systems/) | Simon Willison | Influential argument that the competitive advantage is shifting from model quality to system design — the harness thesis in essay form. |

## ArXiv Papers

### Core Agent Architecture
| Paper | Authors | Year | Key Contribution |
|-------|---------|------|-----------------|
| [ReAct: Synergizing Reasoning and Acting](https://arxiv.org/abs/2210.03629) | Yao et al. | 2022 | The foundational paper behind thought-action-observation loops. Almost every agent loop today is a variant of ReAct. |
| [Toolformer: Language Models Can Teach Themselves to Use Tools](https://arxiv.org/abs/2302.04761) | Schick et al. (Meta) | 2023 | Shows LLMs can learn to decide when and how to call tools, not just follow schemas. Foundational for tool-use in agents. |
| [Gorilla: Large Language Model Connected with Massive APIs](https://arxiv.org/abs/2305.15334) | Patil et al. (UC Berkeley) | 2023 | Trained LLMs to generate accurate API calls. Introduced API Bench for evaluating tool use accuracy. |

### Coding Agents
| Paper | Authors | Year | Key Contribution |
|-------|---------|------|-----------------|
| [SWE-bench: Can Language Models Resolve Real-World GitHub Issues?](https://arxiv.org/abs/2310.06770) | Jimenez et al. (Princeton) | 2023 | The standard benchmark for coding agents. 2,294 real GitHub issues, now the primary way harnesses are evaluated. |
| [SWE-agent: Agent-Computer Interfaces Enable Automated SE](https://arxiv.org/abs/2405.15793) | Yang et al. (Princeton) | 2024 | Introduced ACI design principles. Simple agents with well-designed tool interfaces outperform complex multi-agent systems. |
| [OpenHands: An Open Platform for AI Software Developers](https://arxiv.org/abs/2407.16741) | Wang et al. (All-Hands-AI) | 2024 | Architecture for sandboxed agent execution. Docker-based isolation, event streams, and the CodeAct agent pattern. |
| [Agentless: Demystifying LLM-based SE Agents](https://arxiv.org/abs/2407.01489) | Xia et al. | 2024 | Argues against complex agent architectures. Localization + repair without an agent loop achieves competitive results. A counterpoint to harness complexity. |
| [AutoCodeRover: Autonomous Program Improvement](https://arxiv.org/abs/2404.05427) | Zhang et al. | 2024 | Uses program structure (AST) for context retrieval instead of file-level search. Structured code understanding improves patching. |
| [CodeR: Issue Resolving with Multi-Agent and Task Graphs](https://arxiv.org/abs/2406.01304) | Chen et al. | 2024 | Multi-agent with task decomposition graphs. Shows when multi-agent helps (complex cross-file) and when it hurts (simple fixes). |
| [Moatless Tools: Agent-Optimized Code Editing](https://arxiv.org/abs/2408.09496) | Orwall | 2024 | Open-source agent tools designed for code navigation and editing. Competitive SWE-bench results with focused tool design. |
| [SWE-bench Multimodal](https://arxiv.org/abs/2410.03859) | Yang et al. | 2024 | Extends SWE-bench to visual tasks — fixing UI rendering bugs, matching screenshot specifications. Tests agent visual reasoning. |

### Multi-Agent Systems
| Paper | Authors | Year | Key Contribution |
|-------|---------|------|-----------------|
| [AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation](https://arxiv.org/abs/2308.08155) | Wu et al. (Microsoft) | 2023 | Conversation-based multi-agent framework. Agents communicate by messaging each other, with human-in-the-loop support. |
| [ChatDev: Communicative Agents for Software Development](https://arxiv.org/abs/2307.07924) | Qian et al. | 2023 | Software development as multi-agent role-play (CEO, CTO, programmer, tester). Explores the limits of persona-based agent coordination. |
| [MetaGPT: Meta Programming for Multi-Agent Collaborative Framework](https://arxiv.org/abs/2308.00352) | Hong et al. | 2023 | Structures multi-agent collaboration as software processes — agents follow SOPs (standard operating procedures) for coordination. |
| [CAMEL: Communicative Agents for "Mind" Exploration](https://arxiv.org/abs/2303.17760) | Li et al. | 2023 | Two agents role-play as task giver and solver. Shows emergent collaborative behaviors in multi-agent systems. |

### Agent Evaluation & Safety
| Paper | Authors | Year | Key Contribution |
|-------|---------|------|-----------------|
| [AgentBench: Evaluating LLMs as Agents](https://arxiv.org/abs/2308.03688) | Liu et al. | 2023 | Benchmark suite testing agents across 8 environments (OS, DB, web, games). Broader than coding-only benchmarks. |
| [GAIA: A Benchmark for General AI Assistants](https://arxiv.org/abs/2311.12983) | Mialon et al. (Meta) | 2023 | Tests agent ability to solve real-world tasks requiring multi-step reasoning, tool use, and web browsing. |
| [R2E: Turning any GitHub Repository into a Programming Agent Environment](https://arxiv.org/abs/2404.14545) | Jain et al. (MIT) | 2024 | Framework for generating benchmarks from any repo (not just Python), using repo-specific test suites. |
| [Injectagent: Benchmarking Indirect Prompt Injections in Tool-Integrated LLM Agents](https://arxiv.org/abs/2403.02691) | Zhan et al. | 2024 | Systematic evaluation of prompt injection attacks against tool-using agents. Essential for harness security design. |

### Context & Memory
| Paper | Authors | Year | Key Contribution |
|-------|---------|------|-----------------|
| [MemGPT: Towards LLMs as Operating Systems](https://arxiv.org/abs/2310.08560) | Packer et al. | 2023 | OS-inspired memory management for LLMs — virtual context with paging between main context and external storage. |
| [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) | Liu et al. | 2023 | LLMs attend to the beginning and end of long contexts but miss information in the middle. Critical for context management design. |

## Company Engineering Blogs

| Post | Company | Topic |
|------|---------|-------|
| [Claude Code: Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices) | Anthropic | CLAUDE.md files, context management, multi-agent patterns |
| [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) | Anthropic | Agent patterns: routing, parallelization, orchestrator-workers |
| [Why Agents Fail](https://www.anthropic.com/engineering/why-agents-fail) | Anthropic | Failure modes and mitigations |
| [Introducing MCP](https://www.anthropic.com/news/model-context-protocol) | Anthropic | Model Context Protocol announcement and architecture |
| [How We Built Codex](https://openai.com/index/building-codex/) | OpenAI | Codex CLI architecture, sandboxing, tool design |
| [Aider: How It Works](https://aider.chat/docs/repomap.html) | Aider | Repo maps and tree-sitter codebase summaries |
| [Devin: Our Approach](https://www.cognition.ai/blog) | Cognition | Autonomous agents with DeepWiki and cloud VMs |
| [Goose: Extensible AI Developer Agent](https://block.github.io/goose/) | Block (Square) | MCP-first architecture, toolkit pattern |
| [Cursor Agent: How It Works](https://www.cursor.com/blog) | Anysphere | Codebase indexing, background agents, multi-model routing |
| [Windsurf Cascade Architecture](https://codeium.com/blog) | Codeium | Multi-step planning agent in an IDE |
| [Continue: Context Providers](https://docs.continue.dev/customization/context-providers) | Continue | Modular context injection via @-mentions |
| [Amp: Agentic Coding Platform](https://amp.dev/blog) | Sourcegraph | Code intelligence integrated agent platform |

## Agent Frameworks

| Framework | Type | Key Feature | Link |
|-----------|------|-------------|------|
| **LangGraph** | Orchestration | Graph-based agent DAGs with state machines | [Docs](https://langchain-ai.github.io/langgraph/) |
| **CrewAI** | Multi-agent | Role-based agent teams with personas | [Docs](https://docs.crewai.com/) |
| **AutoGen / AG2** | Multi-agent | Conversation-based agent coordination | [Docs](https://ag2.ai/) |
| **Semantic Kernel** | SDK | Microsoft's AI orchestration layer for .NET/Python | [Docs](https://learn.microsoft.com/semantic-kernel/) |
| **DSPy** | Optimization | Programmatic prompt optimization for multi-step pipelines | [Docs](https://dspy-docs.vercel.app/) |
| **Vercel AI SDK** | SDK | Streaming tool-use for web-based agents | [Docs](https://sdk.vercel.ai/) |
| **Anthropic Agent SDK** | Runtime | Claude Code's engine as a library | [Docs](https://docs.anthropic.com/en/docs/agents) |
| **OpenAI Agents SDK** | Runtime | Tool use, handoffs, guardrails | [Docs](https://openai.github.io/openai-agents-python/) |
| **Pipecat** | Voice | Pipeline-based voice agent composition | [Docs](https://www.pipecat.ai/) |
| **LiveKit Agents** | Voice | WebRTC voice agent infrastructure | [Docs](https://docs.livekit.io/agents/) |

## Official Repositories

| Harness | Repo | License |
|---------|------|---------|
| Claude Code | [anthropics/claude-code](https://github.com/anthropics/claude-code) | Source-available |
| Aider | [Aider-AI/aider](https://github.com/Aider-AI/aider) | Apache 2.0 |
| OpenHands | [All-Hands-AI/OpenHands](https://github.com/All-Hands-AI/OpenHands) | MIT |
| SWE-agent | [princeton-nlp/SWE-agent](https://github.com/princeton-nlp/SWE-agent) | MIT |
| Goose | [block/goose](https://github.com/block/goose) | Apache 2.0 |
| Cline | [cline/cline](https://github.com/cline/cline) | Apache 2.0 |
| Codex CLI | [openai/codex](https://github.com/openai/codex) | Apache 2.0 |
| Continue | [continuedev/continue](https://github.com/continuedev/continue) | Apache 2.0 |
| Roo Code | [RooVetGit/Roo-Code](https://github.com/RooVetGit/Roo-Code) | Apache 2.0 |
| Amp | [anthropics/claude-code](https://amp.dev) | Proprietary |
| Bolt | [stackblitz/bolt.new](https://github.com/stackblitz/bolt.new) | MIT |
| Mentat | [AbanteAI/mentat](https://github.com/AbanteAI/mentat) | Apache 2.0 |

## Benchmarks & Leaderboards

| Resource | What It Measures |
|----------|-----------------|
| [SWE-bench Leaderboard](https://www.swebench.com/) | Standard coding agent benchmark — resolved GitHub issues |
| [SWE-bench Verified](https://www.swebench.com/) | Curated 500-task subset with human-verified solutions |
| [Aider Polyglot Benchmark](https://aider.chat/docs/leaderboards/) | Multi-language code editing: Python, JS, C++, Java, etc. |
| [Terminal Bench](https://terminalbench.com/) | Terminal-based agent evaluation for real-world coding tasks |
| [AgentBench](https://llmbench.ai/agent) | Multi-environment agent evaluation (OS, DB, web, games) |
| [GAIA Benchmark](https://huggingface.co/spaces/gaia-benchmark/leaderboard) | General AI assistant tasks requiring multi-step reasoning |
| [HumanEval+](https://github.com/evalplus/evalplus) | Code generation correctness with enhanced test suites |
| [BigCodeBench](https://bigcode-bench.github.io/) | Practical coding tasks using real-world libraries and APIs |

## Community Resources

| Resource | Type | Description |
|----------|------|-------------|
| [Latent Space Podcast](https://www.latent.space/) | Podcast/Newsletter | Deep dives on AI engineering, frequent agent architecture episodes |
| [AI Engineer World's Fair](https://www.ai.engineer/) | Conference | Annual conference focused on AI engineering (not research) |
| [r/ClaudeAI](https://reddit.com/r/ClaudeAI) | Community | Active discussion of Claude Code workflows and harness patterns |
| [SWE-agent Discord](https://discord.gg/swe-agent) | Community | Research community around agent-computer interfaces |
| [Aider Discord](https://discord.gg/aider) | Community | Coding agent workflow discussion and troubleshooting |
| [MCP Servers Registry](https://github.com/modelcontextprotocol/servers) | Registry | 200+ community MCP server implementations |

---

*Know an article, paper, or resource that should be here? See [CONTRIBUTING.md](../CONTRIBUTING.md).*
