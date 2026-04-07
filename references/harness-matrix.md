# Harness Comparison Matrix

## Terminal & CLI Agents

| Feature | Claude Code | Aider | Codex CLI | Goose | Gemini CLI | OpenCode | Qwen Code |
|---------|------------|-------|-----------|-------|------------|----------|-----------|
| **Org** | Anthropic | Independent | OpenAI | Block | Google | Community (SST) | Alibaba/Qwen |
| **Stars** | — | 30K+ | 66K+ | 15K+ | 98K+ | 95K+ | 10K+ |
| **Agent Loop** | Async generator | ReAct-style | Two-phase | Turn-based | ReAct | ReAct | ReAct |
| **Tool System** | Built-in (Read/Write/Edit/Bash/Glob/Grep) | Git-diff edits | Patch-based | MCP-based | Built-in + MCP | Built-in + MCP | Built-in + MCP |
| **Context Mgmt** | Auto compaction | Repo map (tree-sitter) | Auto-prune | Token counting | 1M context (Gemini) | Session + SQLite | 256K-1M context |
| **Model Support** | Claude (native) | 20+ models | OpenAI (native) | Multi-provider | Gemini (native) | 75+ providers | Qwen (native) + OpenAI-compat |
| **MCP Support** | Yes (native) | No | No | Yes (first-class) | Yes | Yes | Yes |
| **Error Recovery** | Errors as context | Git revert | Patch validation | Basic retry | Errors as context | Errors as context | Errors as context |
| **Permissions** | Deny/Ask/Allow + hooks | Auto-accept | OS sandbox tiers | Per-tool | Per-tool | Per-tool | Per-tool |
| **Sandboxing** | None (hooks available) | None | Seatbelt/Landlock | None | None | None | None |
| **Memory** | CLAUDE.md + sessions | Git history | AGENTS.md | Session state | Session state | SQLite sessions | Session state |
| **Multi-agent** | Sub-agents (Agent tool) | No | No | MCP profiles | No | No | No |
| **LSP Integration** | No | No | No | No | No | Yes (native) | No |
| **Language** | TypeScript | Python | Rust/TypeScript | Rust | TypeScript | Go | TypeScript |
| **License** | Source-available | Apache 2.0 | Apache 2.0 | Apache 2.0 | Apache 2.0 | MIT | Apache 2.0 |
| **Free Tier** | Max subscription | — | API key | API key | 1K req/day (Google account) | API key | 1K req/day (Qwen OAuth) |
| **Unique Feature** | Agent SDK as library | Repo map | OS-native sandbox | MCP-first | Google Search grounding | 75+ providers + LSP | Open-weight 480B model |

## IDE-Integrated Agents

| Feature | Cursor | Cline | Continue | Windsurf | Trae | Kiro | Roo Code | PearAI | Zed AI |
|---------|--------|-------|----------|----------|------|------|----------|--------|--------|
| **Org** | Anysphere | Independent | Independent | Codeium | ByteDance | AWS | Community | PearAI | Zed |
| **Users/Stars** | $2B+ ARR | 30K+ stars | 20K+ stars | — | 6M users, 1.6M MAU | GA Nov 2025 | 20K+ stars | 5K+ stars | — |
| **IDE** | Cursor (VS Code fork) | VS Code extension | VS Code + JetBrains | Windsurf IDE | Trae IDE (VS Code fork) | Kiro IDE (VS Code fork) | VS Code extension | VS Code fork | Zed editor |
| **Agent Loop** | Multi-model | Stream+apply | Step-based | Cascade (multi-step) | Builder Mode (autonomous) | Spec-driven (plan→code) | Stream+apply | Stream+apply | Inline |
| **Tool System** | IDE-native + MCP | VS Code API + MCP | Context providers + MCP | IDE-native | MCP + built-in | Agent hooks + powers | VS Code API + MCP | IDE-native | Editor-native |
| **Context Mgmt** | Codebase index (embeddings + tree-sitter) | LLM summary at 60% | @-mentions + providers | Codebase-aware | Codebase-aware | Spec-based context | LLM summary | Basic history | Editor context |
| **Model Support** | Multi-provider | Multi-provider | Multi-provider | Codeium models | Claude + DeepSeek + o3 (free) | Amazon Bedrock (Nova) | Multi-provider | Multi-provider | Multi-provider |
| **Background Agents** | Yes (cloud VM) | No | No | Planned | Builder Mode | Autonomous agent (preview) | No | No | No |
| **MCP Support** | Yes | Yes (native) | Yes (native) | Partial | Yes | Yes | Yes (native) | Partial | No |
| **License** | Proprietary | Apache 2.0 | Apache 2.0 | Proprietary | Free (proprietary) | Proprietary | Apache 2.0 | Apache 2.0 | GPL 3.0 |
| **Unique Feature** | Codebase indexing | Best permission UX | Context providers | Cascade planner | Free Claude/DeepSeek | Spec-driven development | Custom modes | Open-source IDE | Native performance |

## Autonomous & Background Agents

| Feature | Devin | Copilot Workspace | Bolt.new | Replit Agent | v0 | Lovable |
|---------|-------|-------------------|----------|--------------|----|---------| 
| **Org** | Cognition | GitHub | StackBlitz | Replit | Vercel | Lovable |
| **Mode** | Fully autonomous | Plan → execute | Prompt → app | Prompt → app | Prompt → UI | Prompt → app |
| **Execution** | Cloud VM (Ubuntu) | Cloud sandbox | WebContainer | Cloud container | Serverless | Cloud container |
| **Loop Style** | Autonomous (50-500 turns) | Plan-first, then execute | Generate-preview-iterate | Generate-deploy-iterate | Generate-preview | Generate-deploy |
| **Scope** | Full software engineering | Issue → PR | Full-stack web apps | Full-stack apps | UI components | Full-stack web apps |
| **Interaction** | Slack bot / web UI | GitHub UI | Web browser | Web IDE | Web browser | Web browser |
| **Sandboxing** | Full VM isolation | GitHub cloud | WebContainer (browser) | Container | Serverless | Container |
| **Memory** | DeepWiki | GitHub context | Session | Replit context | Session | Session |
| **Target User** | Teams (async delegation) | Developers (issue triage) | Non-developers | Non-developers | Designers/devs | Non-developers |
| **License** | Proprietary | Proprietary | MIT (open source) | Proprietary | Proprietary | Proprietary |
| **Unique Feature** | Full autonomy | Plan review before code | Browser-based sandbox | Full deployment | Design-first | Supabase integration |

## Research Platforms

| Feature | SWE-agent | OpenHands | AutoCodeRover | Agentless |
|---------|-----------|-----------|---------------|-----------|
| **Org** | Princeton NLP | All-Hands-AI | NUS | UIUC |
| **Purpose** | Agent-Computer Interface research | Open platform for AI developers | AST-based code navigation | Minimal agent-free approach |
| **Agent Loop** | Thought-Action-Observation | CodeAct | Search-navigate-edit | Localize → repair (no loop) |
| **Tool System** | Custom ACI tools (windowed file view) | CodeAct (bash + python) | AST traversal tools | Standard LLM calls |
| **Sandboxing** | Docker | Docker | None | None |
| **Eval** | SWE-bench (pioneer) | SWE-bench (69.1%) | SWE-bench | SWE-bench |
| **Key Insight** | Tool interface design > tool count | Open-source sandboxed platform | AST > file-level search | You may not need an agent loop |
| **Language** | Python | Python | Python | Python |
| **License** | MIT | MIT | GPL 3.0 | MIT |

## Specialized & Emerging

| Harness | Org | Category | Stars | Key Differentiator |
|---------|-----|----------|-------|-------------------|
| **Claw Code** | Community | Terminal | 110K+ | Clean-room Rust rewrite of Claude Code architecture. Fastest-growing GitHub repo in history. |
| **Amp** | Sourcegraph | Terminal + IDE | — | Code intelligence (code graph) integrated into agent context |
| **Augment Code** | Augment | IDE | — | Enterprise-focused with deep codebase understanding |
| **Amazon Q Developer** | AWS | IDE + CLI | — | AWS service integration, security scanning, IAM policy generation |
| **Tabnine** | Tabnine | IDE | — | On-premise / private cloud deployment for enterprise |
| **Sourcegraph Cody** | Sourcegraph | IDE | 5K+ | Code search + codebase context from code graph |
| **Aide** | CodeStory | IDE (VS Code fork) | 5K+ | Proactive agent that suggests changes as you code |
| **Void** | Void | IDE (VS Code fork) | 15K+ | Fully open-source, local-first, privacy-focused |
| **Warp AI** | Warp | Terminal | — | AI integrated directly into the terminal emulator |
| **OpenDev** | Research | Terminal | — | Academic harness from the "Building Effective AI Coding Agents" paper (2603.05344) |

## Market Context (April 2026)

| Metric | Value | Source |
|--------|-------|--------|
| Agentic AI market size | $7-8B (2026) | Industry estimates |
| Projected market (2030) | $40-93B | Industry projections |
| Enterprise adoption | 25% deploying agent pilots | Gartner |
| Cursor ARR | $2B+ | March 2026 |
| Trae registered users | 6M+ | Alibaba |
| Fastest-growing GitHub repo | Claw Code (100K+ stars in days) | GitHub |
| SWE-bench Verified SOTA | ~75%+ | SWE-bench leaderboard |

---

*Harness not listed? See [CONTRIBUTING.md](../CONTRIBUTING.md) to add it.*
