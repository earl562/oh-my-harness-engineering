# Harness Comparison Matrix

## Terminal & CLI Agents

| Feature | Claude Code | Aider | Codex CLI | Goose | Mentat |
|---------|------------|-------|-----------|-------|--------|
| **Org** | Anthropic | Independent | OpenAI | Block | AbanteAI |
| **Agent Loop** | Async generator | ReAct-style | Two-phase | Turn-based | Edit-apply |
| **Tool System** | Built-in (Read/Write/Edit/Bash/Glob/Grep) | Git-diff edits | Patch-based | MCP-based | File-focused |
| **Context Mgmt** | Auto compaction | Repo map (tree-sitter) | Auto-prune | Token counting | Codebase context |
| **Model Support** | Claude (native) | 20+ models | OpenAI (native) | Multi-provider | Multi-provider |
| **Error Recovery** | Errors as context | Git revert | Patch validation | Basic retry | Revert on failure |
| **Permissions** | Deny/Ask/Allow + hooks | Auto-accept | OS sandbox tiers | Per-tool | Per-tool |
| **Sandboxing** | None (hooks available) | None | Seatbelt/Landlock | None | None |
| **Memory** | CLAUDE.md + sessions | Git history | AGENTS.md | Session state | Session state |
| **Multi-agent** | Sub-agents (Agent tool) | No | No | MCP profiles | No |
| **Language** | TypeScript | Python | Rust/TypeScript | Rust | Python |
| **License** | Source-available | Apache 2.0 | Apache 2.0 | Apache 2.0 | Apache 2.0 |
| **Unique Feature** | Agent SDK as library | Repo map | OS-native sandbox | MCP-first | Codebase embedding |

## IDE-Integrated Agents

| Feature | Cursor | Cline | Continue | Windsurf | Roo Code | PearAI | Zed AI |
|---------|--------|-------|----------|----------|----------|--------|--------|
| **Org** | Anysphere | Independent | Independent | Codeium | Community | PearAI | Zed |
| **IDE** | Cursor (VS Code fork) | VS Code extension | VS Code + JetBrains | Windsurf IDE | VS Code extension | VS Code fork | Zed editor |
| **Agent Loop** | Multi-model | Stream+apply | Step-based | Cascade (multi-step) | Stream+apply | Stream+apply | Inline |
| **Tool System** | IDE-native + MCP | VS Code API + MCP | Context providers + MCP | IDE-native | VS Code API + MCP | IDE-native | Editor-native |
| **Context Mgmt** | Codebase index (embeddings + tree-sitter) | LLM summary at 60% | @-mentions + providers | Codebase-aware | LLM summary | Basic history | Editor context |
| **Model Support** | Multi-provider | Multi-provider | Multi-provider | Codeium models | Multi-provider | Multi-provider | Multi-provider |
| **Background Agents** | Yes (cloud VM) | No | No | Planned | No | No | No |
| **MCP Support** | Yes | Yes (native) | Yes (native) | Partial | Yes (native) | Partial | No |
| **License** | Proprietary | Apache 2.0 | Apache 2.0 | Proprietary | Apache 2.0 | Apache 2.0 | GPL 3.0 |
| **Unique Feature** | Codebase indexing | Best permission UX | Context providers | Cascade planner | Custom modes | Open-source IDE | Native performance |

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

| Harness | Org | Category | Key Differentiator |
|---------|-----|----------|-------------------|
| **Amp** | Sourcegraph | Terminal + IDE | Code intelligence (code graph) integrated into agent context |
| **Augment Code** | Augment | IDE | Enterprise-focused with deep codebase understanding |
| **Amazon Q Developer** | AWS | IDE + CLI | AWS service integration, security scanning |
| **Tabnine** | Tabnine | IDE | On-premise / private cloud deployment for enterprise |
| **Sourcegraph Cody** | Sourcegraph | IDE | Code search + codebase context from code graph |
| **Aide** | CodeStory | IDE (VS Code fork) | Proactive agent that suggests changes as you code |
| **Void** | Void | IDE (VS Code fork) | Fully open-source, local-first, privacy-focused |
| **OpenCode** | Open source | Terminal | Go-based terminal agent, inspired by Claude Code |

---

*Harness not listed? See [CONTRIBUTING.md](../CONTRIBUTING.md) to add it.*
