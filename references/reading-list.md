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
| [Harness Design for Long-Running Application Development](https://www.anthropic.com/engineering/harness-design-for-long-running-application-development) | Anthropic (Prithvi Rajasekaran) | **Essential reading.** GAN-inspired generator/evaluator multi-agent harness. Shows how separating generation from evaluation produces dramatically better output. Three-agent architecture (planner→generator→evaluator) produces full-stack apps over multi-hour autonomous sessions. Demonstrates that harness complexity should scale down as models improve. |
| [Harness Engineering: Leveraging Codex in an Agent-First World](https://openai.com/index/harness-engineering/) | OpenAI | **The blog post that named the discipline.** Formalizes "harness engineering" — context delivery, tool design, verification loops, and loop detection — as the primary determinant of benchmark scores. |
| [Claude Code Architecture: A Blueprint from the Source](https://x.com/rohit4verse/status/1909257973578944960) | Rohit (@rohit4verse) | Deepest public teardown of Claude Code's 55-directory, 331-module architecture. Covers the 5-phase loop, streaming tool executor, 4 compaction strategies, 7-stage permission pipeline, and argues for a 4th layer (Infrastructure) beyond Weights/Context/Harness. |
| [awesome-harness-engineering](https://github.com/walkinglabs/awesome-harness-engineering) | Walking Labs | Curated list of harness engineering resources, tools, and patterns. |
| [The Harness Engineer's Handbook](https://harness-books.agentway.dev/en/) | AgentWay | Online book covering harness design from basics to production patterns. |

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

### Harness Architecture (2026 — the field now has its own papers)
| Paper | Authors | Year | Key Contribution |
|-------|---------|------|-----------------|
| [Building Effective AI Coding Agents for the Terminal](https://arxiv.org/abs/2603.05344) | Bui | 2026 | Introduces OpenDev and formalizes the harness as 7 subsystems around a ReAct core: pre-check, compaction, thinking, self-critique, action, tool execution, and post-processing. The first paper to treat the harness as a first-class research object. |
| [Natural-Language Agent Harnesses](https://arxiv.org/abs/2603.25723) | Pan et al. (Tsinghua) | 2026 | Proposes NLAHs — expressing harness behavior in editable natural language instead of code, with Intelligent Harness Runtime (IHR) executing through explicit contracts. Shows harness structure now dominates agent performance. |
| [Meta-Harness: End-to-End Optimization of Model Harnesses](https://arxiv.org/abs/2603.28052) | — | 2026 | An agentic outer-loop that autonomously searches for and rewrites harness infrastructure: retrieval logic, memory management, and prompt assembly. The harness optimizing itself. |
| [Agentic Design Patterns: A System-Theoretic Framework](https://arxiv.org/abs/2601.19752) | — | 2026 | Deconstructs agentic systems into 5 functional subsystems, presents 12 design patterns across 4 categories: Foundational, Cognitive/Decisional, Execution/Interaction, and Adaptive/Learning. |
| [Architecting Agentic Communities using Design Patterns](https://arxiv.org/abs/2601.03624) | — | 2026 | Three-tier pattern classification: LLM Agents → Agentic AI → Agentic Communities. Bridges enterprise distributed systems patterns with agent design. |
| [Agentic AI: A Comprehensive Survey](https://arxiv.org/abs/2510.25445) | — | 2025 | Broad survey of agent architectures, applications, and future directions. Good overview for newcomers to the field. |
| [FeatureBench: Agentic Coding for Complex Features](https://arxiv.org/abs/2602.10975) | — | 2026 | ICLR 2026. Shows Claude Opus 4.5 (74% SWE-bench) only solves 11% of FeatureBench — proves benchmark saturation is real. |
| [SWE Context Bench: Context Learning in Coding](https://arxiv.org/abs/2602.08316) | — | 2026 | First benchmark for cross-task context accumulation and reuse. Tests what harness memory systems actually provide. |
| [On the Impact of AGENTS.md Files](https://arxiv.org/abs/2601.20404) | — | 2026 | Measures how context files (AGENTS.md, CLAUDE.md) affect agent efficiency. Adopted by 60K+ open-source projects. |
| [SWE-EVO: Long-Horizon Software Evolution](https://arxiv.org/abs/2512.18470) | — | 2025 | Benchmarks agents on maintaining/evolving legacy code — the 80% of real SE that SWE-bench ignores. |
| [SWE-bench Pro: Long-Horizon Enterprise Tasks](https://arxiv.org/abs/2509.16941) | Scale Labs | 2025 | 1,865 harder problems from 41 repos. Augment's Auggie hit 51.8% (top score). The post-SWE-bench-Verified benchmark. |
| [Context Engineering for AI Agents](https://arxiv.org/abs/2510.21413) | — | 2025 | How context delivery, tool design, and verification loops determine agent quality more than model choice. |

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
| [Introducing Gemini CLI](https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemini-cli-open-source-ai-agent/) | Google | Open-source terminal agent with Gemini, ReAct loop, MCP support |
| [Qwen3-Coder: Agentic Coding in the World](https://qwenlm.github.io/blog/qwen3-coder/) | Alibaba/Qwen | Open-source 480B MoE coding model + CLI agent harness |
| [The Rise of AI Harness Engineering](https://cobusgreyling.medium.com/the-rise-of-ai-harness-engineering-5f5220de393e) | Cobus Greyling | Analysis of harness engineering as a new discipline |
| [The Anatomy of an Agent Harness](https://blog.dailydoseofds.com/p/the-anatomy-of-an-agent-harness) | Avi Chawla | Visual breakdown of harness components |
| [Anthropic's Harness Engineering](https://medium.com/@richardhightower/anthropics-harness-engineering-two-agents-one-feature-list-zero-context-overflow-7c26eb02c807) | Rick Hightower | Two-agent "Ralph Loop" pattern for long-running tasks |
| [Harness Engineering: Leveraging Codex in an Agent-First World](https://openai.com/index/harness-engineering/) | OpenAI | Formalizes "harness engineering" as a discipline — the blog post that named the field |
| [Introducing Kiro](https://kiro.dev/) | AWS | Spec-driven development: specs → code, not prompts → code |
| [Cursor 3](https://cursor.com/blog/cursor-3) | Anysphere | Complete rewrite around agent orchestration, 8 parallel background agents |
| [Devin 2.0](https://cognition.ai/blog/devin-2) | Cognition | Interactive planning, Devin Search, Devin Wiki, compound AI architecture |
| [OpenHands Index](https://openhands.dev/blog/openhands-index) | All-Hands-AI | First broad continual leaderboard for coding agents across 5 task types |

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
| OpenCode | [opencode-ai/opencode](https://github.com/opencode-ai/opencode) | MIT |
| Gemini CLI | [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) | Apache 2.0 |
| Qwen Code | [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) | Apache 2.0 |
| Trae Agent | [bytedance/trae-agent](https://github.com/bytedance/trae-agent) | Apache 2.0 |
| Claw Code | [ultraworkers/claw-code](https://github.com/ultraworkers/claw-code) | MIT |
| Plandex | [plandex-ai/plandex](https://github.com/plandex-ai/plandex) | Apache 2.0 |
| OpenDev | [opendev-to/opendev](https://github.com/opendev-to/opendev) | MIT |
| mini-SWE-agent | [SWE-agent/mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) | MIT |
| Open-SWE | [langchain-ai/open-swe](https://github.com/langchain-ai/open-swe) | MIT |
| Pi Agent | [badlogic/pi-mono](https://github.com/badlogic/pi-mono) | MIT |
| Junie | [JetBrains/junie](https://github.com/JetBrains/junie) | Apache 2.0 |
| Kiro | [kirodotdev/Kiro](https://github.com/kirodotdev/Kiro) | Apache 2.0 |
| Live-SWE-agent | [OpenAutoCoder/live-swe-agent](https://github.com/OpenAutoCoder/live-swe-agent) | MIT |

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
| [SWE-bench Pro](https://www.swebench.com/) | 1,865 harder enterprise-level problems from 41 repos — the post-SWE-bench-Verified benchmark |
| [FeatureBench](https://arxiv.org/abs/2602.10975) | Complex feature development — exposes benchmark saturation (74% SWE-bench → 11% FeatureBench) |
| [OpenHands Index](https://openhands.dev/blog/openhands-index) | Continual multi-task leaderboard: issue resolution, greenfield, frontend, testing, info gathering |
| [SWE-EVO](https://arxiv.org/abs/2512.18470) | Long-horizon software evolution and maintenance |
| [LiveCodeBench](https://livecodebench.github.io/) | Contamination-free benchmark using new competitive programming problems |

## Protocols & Standards

The agent protocol stack is solidifying under the [Agentic AI Foundation (AAIF)](https://www.linuxfoundation.org/), founded Dec 2025 by Anthropic, OpenAI, Google, Microsoft, AWS, and Block.

| Protocol | Purpose | Governed By | Adoption |
|----------|---------|-------------|----------|
| [**MCP** (Model Context Protocol)](https://modelcontextprotocol.io/) | Standardizes how agents connect to tools and data sources | AAIF | 97M monthly SDK downloads, every major AI provider |
| [**A2A** (Agent-to-Agent Protocol)](https://a2aprotocol.ai/) | Agent discovery and delegation between agents | AAIF | 50+ partner organizations, Google-led |
| [**ACP** (Agent Client Protocol)](https://zed.dev/ai) | IDE-agnostic agent integration — bring any agent to any editor | Zed + JetBrains | Jan 2026, emerging |
| [**AGENTS.md**](https://agents.md/) | Cross-agent context file standard (like CLAUDE.md but universal) | AAIF | 60K+ open-source projects |

## Community Resources

| Resource | Type | Description |
|----------|------|-------------|
| [Latent Space Podcast](https://www.latent.space/) | Podcast/Newsletter | Deep dives on AI engineering, frequent agent architecture episodes |
| [AI Engineer World's Fair](https://www.ai.engineer/) | Conference | Annual conference focused on AI engineering (not research) |
| [r/ClaudeAI](https://reddit.com/r/ClaudeAI) | Community | Active discussion of Claude Code workflows and harness patterns |
| [SWE-agent Discord](https://discord.gg/swe-agent) | Community | Research community around agent-computer interfaces |
| [Aider Discord](https://discord.gg/aider) | Community | Coding agent workflow discussion and troubleshooting |
| [MCP Servers Registry](https://github.com/modelcontextprotocol/servers) | Registry | 200+ community MCP server implementations |
| [awesome-cli-coding-agents](https://github.com/bradAGI/awesome-cli-coding-agents) | Awesome List | Curated directory of terminal-native AI coding agents |
| [awesome-ai-agents-2026](https://github.com/caramaschiHG/awesome-ai-agents-2026) | Awesome List | 340+ AI agent resources across 20+ categories |
| [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | Awesome List | Skills, hooks, plugins for Claude Code |
| [Daily Dose of DS](https://blog.dailydoseofds.com/) | Newsletter | Regular coverage of agent architecture patterns |
| [OpenCode Docs](https://opencode.ai/docs/) | Documentation | OpenCode architecture, providers, LSP integration |
| [Kiro Dev](https://kiro.dev/) | Documentation | AWS's spec-driven agentic IDE |

---

*Know an article, paper, or resource that should be here? Open a PR.*
