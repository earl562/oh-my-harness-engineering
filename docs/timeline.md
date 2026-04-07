# Timeline: The Evolution of Agentic Harnesses

How we got from ChatGPT wrappers to production agent systems in three years.

---

## 2022: The Foundations

**Oct 2022** — **ReAct paper published** (Yao et al.). Introduces the thought-action-observation loop that becomes the backbone of nearly every agent architecture. The paper shows that interleaving reasoning with actions outperforms either alone.

**Nov 2022** — **ChatGPT launches.** Not an agent, but demonstrates that LLMs can follow complex instructions. Developers immediately start building wrappers — the first proto-harnesses.

**Dec 2022** — **LangChain launches.** First popular framework for chaining LLM calls with tools. Introduces the concept of "agents" with tool access to a wide developer audience. Early versions are fragile but prove the concept.

## 2023: First Generation Agents

**Mar 2023** — **GPT-4 launches** with dramatically improved instruction following and tool use. Makes agentic patterns viable for real tasks rather than demos.

**Apr 2023** — **Auto-GPT goes viral.** Autonomous agent that spawns tasks, writes code, and browses the web. Extremely unreliable but captures public imagination. Proves demand for autonomous agents. Spawns dozens of clones (BabyAGI, AgentGPT, SuperAGI).

**Jun 2023** — **Aider launches.** First serious coding agent for terminal use. Introduces the repo map concept — tree-sitter-generated codebase summaries. Shows that coding agents need codebase awareness, not just file editing.

**Jul 2023** — **Claude 2 launches** with 100K context window. Massive jump in context size makes longer agent sessions practical without constant compaction.

**Oct 2023** — **SWE-bench paper published** (Jimenez et al.). Creates the standard benchmark for coding agents — 2,294 real GitHub issues. For the first time, harnesses can be objectively compared. Early agents solve ~3% of tasks.

**Nov 2023** — **OpenAI introduces GPT-4 Turbo** with 128K context and improved function calling. The function calling API standardizes how tools are defined for LLMs.

## 2024: The Architecture Race

**Jan 2024** — **Devin announced** (Cognition). First "AI software engineer" — a fully autonomous agent with its own cloud VM, browser, terminal, and editor. Solves 13.86% of SWE-bench (up from ~3%). Proves long-running autonomous agents are viable.

**Feb 2024** — **Cline launches** (as Claude Dev, later renamed). VS Code extension with the best permission UX in the space — shows diffs before applying, tiered approvals. Demonstrates that trust UX is as important as capability.

**Mar 2024** — **Claude 3 family launches** (Haiku, Sonnet, Opus). Introduces model tiers that make routing strategies practical — use haiku for cheap tasks, opus for hard ones.

**Apr 2024** — **SWE-agent paper published** (Yang et al., Princeton). Introduces the Agent-Computer Interface concept. Shows that tool design matters more than agent complexity — a simple agent with well-designed tools beats complex multi-agent systems. Breakthrough insight for the field.

**May 2024** — **OpenHands (formerly OpenDevin) launches.** Open-source platform with Docker-based sandboxing. Introduces the CodeAct agent pattern. Reaches 69% on SWE-bench Verified.

**Jun 2024** — **Claude 3.5 Sonnet launches.** Step change in coding capability. Makes tool use reliable enough for production harnesses. Most harnesses see their SWE-bench scores jump just from the model upgrade.

**Jul 2024** — **Cursor 0.40+ with agent mode.** IDE-integrated agent with codebase indexing, multi-file editing, and background agents. Shows that IDE integration provides context advantages terminal agents lack.

**Sep 2024** — **Continue gains traction.** Open-source IDE extension with the "context providers" pattern — modular ways to pull information into agent context (@-mentions, docs, codebase search).

**Nov 2024** — **MCP (Model Context Protocol) announced** by Anthropic. Open protocol standardizing how LLMs connect to tools and data. Goose (Block) becomes first MCP-native harness. Begins the shift toward plugin ecosystems.

**Dec 2024** — **Claude Code launches** in research preview. Anthropic's official terminal agent with the most sophisticated agent loop in the space. Introduces the Agent tool (sub-agents), auto-compaction, and the deny/ask/allow permission model.

## 2025: Production Maturity

**Jan 2025** — **Codex CLI launches** (OpenAI). First harness with OS-native sandboxing (Seatbelt on macOS, Landlock on Linux). Proves kernel-level isolation is practical for coding agents.

**Feb 2025** — **Windsurf launches** (Codeium). IDE with "Cascade" — a multi-step agent that plans and executes across files. Competes directly with Cursor's agent mode.

**Mar 2025** — **Claude Code GA.** Goes from research preview to general availability. Adds hooks (programmatic tool interception), sessions, and the Agent SDK. The SDK lets developers build custom harnesses using Claude Code's engine.

**Apr 2025** — **GitHub Copilot Workspace** reaches wide availability. Background agents that create PRs from issue descriptions. Integrates directly into GitHub's workflow.

**May 2025** — **Goose 1.0** (Block). Fully MCP-native agent — all capabilities come through MCP plugins. Demonstrates the plugin-first architecture pattern.

**Jun 2025** — **SWE-bench Verified scores exceed 70%.** Claude Code + Sonnet hits 72.7%. The benchmark that started at 3% is now dominated by production harnesses. Prompts discussion about whether SWE-bench still differentiates.

**Mid 2025** — **Multi-agent patterns mature.** Harnesses adopt sub-agents (Claude Code), background agents (Cursor), and agent pools (Devin). Single-agent architectures are no longer the default for complex tasks.

**Late 2025** — **Amp, Augment, and specialized harnesses emerge.** The market segments: general-purpose coding agents (Claude Code, Cursor), autonomous agents (Devin), open-source research platforms (OpenHands, SWE-agent), and domain-specific agents.

## 2026: Explosion

**Jan 2026** — **"Agentic Design Patterns" paper** (arxiv 2601.19752). System-theoretic framework identifies 12 design patterns across 4 categories. Harness engineering becomes a recognized discipline with formal foundations.

**Feb 2026** — **Trae surpasses 6 million users.** ByteDance's free IDE with Claude and DeepSeek access gains massive adoption. Builder Mode autonomous agent generates full projects from prompts.

**Mar 2026** — **Three landmark harness papers in one month:**
- "Building Effective AI Coding Agents for the Terminal" (2603.05344) — formalizes the harness as 7 subsystems, introduces OpenDev
- "Natural-Language Agent Harnesses" (2603.25723) — proposes expressing harness behavior in editable natural language
- "Meta-Harness" (2603.28052) — autonomous harness optimization, where the harness rewrites itself

**Mar 2026** — **Cursor hits $2B+ ARR.** Fastest-growing developer tool in history proves the IDE agent model is commercially viable at scale.

**Apr 2026** — **Claude Code source leak spawns Claw Code.** Clean-room Rust rewrite reaches 100K+ GitHub stars in days — fastest-growing repo in GitHub's history. Demonstrates massive demand for open-source harness implementations.

**Apr 2026** — **OpenCode reaches 95K+ stars.** Go-based terminal agent with 75+ provider support and native LSP integration becomes the leading open-source alternative.

**Current landscape** — the harness ecosystem has exploded:

| Category | Examples | Defining Trait |
|----------|----------|---------------|
| **Terminal agents** | Claude Code, Aider, Codex CLI, Gemini CLI, OpenCode, Qwen Code | Full autonomy in the terminal |
| **IDE agents** | Cursor, Windsurf, Trae, Kiro, Cline, Continue, Roo Code | Deep editor integration |
| **Autonomous agents** | Devin, Copilot Workspace | Background execution, async results |
| **Research platforms** | SWE-agent, OpenHands, OpenDev | Reproducible evaluation, open research |
| **Plugin-native agents** | Goose | MCP-first, extensible by design |
| **No-code agents** | Bolt, Replit Agent, v0, Lovable | Generate full apps from descriptions |
| **Derivative/fork agents** | Claw Code, Roo Code, PearAI | Open-source rebuilds of proprietary tools |

**Key trends:**
- **Harness engineering as a discipline** — academic papers, formal pattern languages, and dedicated conferences
- **Open-source parity** — OpenCode, Gemini CLI, and Qwen Code match proprietary tools in capability
- **Free tier wars** — Google (Gemini CLI), Alibaba (Qwen Code), and ByteDance (Trae) offer free agent access
- **SDK-native harnesses** — building on Agent SDK / Codex SDK rather than from scratch
- **Natural-language harnesses** — expressing control flow in prose, not code (NLAH research)
- **Agentic AI market reaches $7-8B** — projected to hit $40-93B by 2030

---

*The space is evolving weekly. If a milestone is missing, open a PR.*
