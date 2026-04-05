# Harness Comparison Matrix

| Feature | Claude Code | Aider | OpenHands | SWE-agent | Goose | Cline | Codex CLI | Continue | Cursor | Devin |
|---------|------------|-------|-----------|-----------|-------|-------|-----------|----------|--------|-------|
| **Agent Loop** | Async generator | ReAct-style | CodeAct | Thought-Action-Obs | Turn-based | Stream+apply | Two-phase | Step-based | Multi-model | Autonomous |
| **Tool System** | Built-in (Read/Write/Edit/Bash/Glob/Grep) | Git-diff edits | CodeAct (bash+python) | Custom ACI tools | MCP-based | VSCode API | Patch-based | Context providers | IDE-native | Full environment |
| **Context Mgmt** | Auto compaction | Repo map (tree-sitter) | Condensed history | Windowed file view | Token counting | LLM summary at 60% | Auto-prune | @-mentions | Codebase index | DeepWiki |
| **Model Routing** | Single model | Single model | Single model | Single model | Single model | Single model | Single model | Single model | Multi-model | Single model |
| **Error Recovery** | Errors as context | Git revert | Retry with context | Lint-gated edits | Basic retry | Retry+revert | Patch validation | Basic retry | Unknown | Full recovery |
| **Permissions** | Deny/Ask/Allow | Auto-accept | Sandboxed (Docker) | Sandboxed (Docker) | Per-tool | Auto-approve tiers | OS sandbox | Per-tool | IDE-managed | Full sandbox |
| **Sandboxing** | None (hooks) | None | Docker | Docker | None | None (diff review) | Seatbelt/Landlock | None | None | Cloud VM |
| **Eval** | SWE-bench (72.7%) | Polyglot benchmark | SWE-bench (69.1%) | SWE-bench (pioneer) | Internal | Community | Internal | Internal | Internal | SWE-bench (72.1%) |
| **Memory** | CLAUDE.md + sessions | Git history | Event stream | Episode memory | Session | Task history | AGENTS.md | @-docs | Codebase index | DeepWiki |
| **Streaming** | Yes (SSE) | Token-by-token | Event stream | Observation logs | Yes | Yes | SSE chunks | Yes | Yes | Web UI |
| **Language** | TypeScript | Python | Python | Python | Rust | TypeScript | Rust/TS | TypeScript | Unknown | Unknown |
| **License** | Proprietary | Apache 2.0 | MIT | MIT | Apache 2.0 | Apache 2.0 | Apache 2.0 | Apache 2.0 | Proprietary | Proprietary |
| **Multi-agent** | Subagents (Agent tool) | No | Micro-agents | No | Profiles | No | No | No | Background agents | Agent pool |
| **IDE Integration** | VSCode + JetBrains | Terminal | Web UI | Terminal | Terminal | VSCode | Terminal | VSCode + JetBrains | Native IDE | Web IDE |
| **Unique Feature** | Agent SDK as library | Repo map | Docker sandbox | ACI research | MCP-first | Permission UX | OS sandbox | Context providers | Codebase index | Full autonomy |
