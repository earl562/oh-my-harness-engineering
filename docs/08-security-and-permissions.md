# Security and Permissions

## What It Is

The permission system controls what an agent is allowed to do. At minimum: which tools it can use. At best: sandboxed execution where the agent literally cannot cause harm beyond its allowed scope.

The Poly harness research identified this as a **HIGH priority gap** — any production agent that executes shell commands needs sandboxing. Claude Code's source revealed a 7-stage permission pipeline with glob-based matching. Codex CLI pioneered OS-native kernel-level sandboxing.

## Why It Matters

An unsandboxed agent with bash access can: delete your files, exfiltrate secrets, install malware, send emails, make API calls, run up cloud bills. The [InjectAgent paper](https://arxiv.org/abs/2403.02691) showed systematic prompt injection attacks against tool-using agents. Permissions are not optional in production.

## The Permission Spectrum

Production harnesses implement permissions at different levels of trust. Here's every approach, from simplest to most robust:

### Level 1: Tool Allowlists (Simplest)

Specify which tools the agent can use. Everything else is blocked.

```typescript
const options = {
  allowedTools: ['Read', 'Glob', 'Grep'],  // Read-only agent
  // Edit, Write, Bash are NOT available
}
```

**Who uses it:** Sub-agents in Claude Code, worker agents in multi-agent systems.
**Strength:** Simple, prevents entire categories of harm.
**Weakness:** No granularity within a tool — "Bash" is either on or off.

### Level 2: Per-Category Auto-Approve (Cline)

The most granular permission model among IDE agents. Each category has its own approval toggle:

- **Read files:** can auto-approve
- **Edit files:** separate approval
- **Safe commands** (ls, cat, git status): separate from destructive commands
- **Browser actions:** separate approval
- **MCP tools:** per-tool approval

Plus `.clineignore` — a gitignore-style file that blocks agent access to specific paths entirely:

```
# .clineignore
.env
secrets/
*.pem
config/production.json
```

**Strength:** Users can progressively trust the agent per category.
**Weakness:** No programmatic enforcement — user discipline is the enforcement mechanism.

### Level 3: Deny/Ask/Allow Rules (Claude Code)

A 7-stage pipeline evaluated in order for every tool call:

```
Tool call requested
    ↓
1. Enterprise deny rules     (MDM-enforced, cannot override)
    ↓
2. Project deny rules        (.claude/settings.json)
    ↓
3. User deny rules           (~/.claude/settings.json)
    ↓
4. Session deny rules        (runtime state)
    ↓
5. Pre-tool hooks            (shell scripts, LLM eval, HTTP)
    ↓
6. Permission mode check     (default → acceptEdits → bypassPermissions)
    ↓
7. User approval prompt      (if required by mode)
```

Rules use glob-like pattern matching on tool names and arguments:

```json
{
  "permissions": {
    "allow": ["bash(git *)", "bash(npm test)", "read(*)", "glob(*)"],
    "deny": ["bash(rm *)", "bash(curl *)", "bash(wget *)"]
  }
}
```

"Allow all bash" is too coarse — nobody wants `rm -rf /`. "Deny all bash" makes the agent useless. "Allow git commands and npm test, prompt for everything else" is the sweet spot.

**Permission modes create progressive trust:**
- **default:** Every write operation requires explicit user confirmation
- **acceptEdits:** Auto-approve file operations, prompt for bash
- **bypassPermissions:** Auto-approve everything (hooks still execute)
- **`--dangerously-skip-permissions`:** Bypasses all gates (CI/headless use only)

**Strength:** Full RBAC with hierarchical overrides (enterprise → project → user → session).
**Weakness:** Complex to configure correctly. Rule ordering matters.

### Level 4: Programmatic Hooks

Run custom code before/after each tool call. Six hook types in Claude Code:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": { "tool": "bash", "action": ".*rm.*" },
      "commands": [{ "cmd": "/path/to/safety-check.sh" }]
    }],
    "PostToolUse": [{
      "matcher": { "tool": "edit" },
      "commands": [{ "cmd": "npx eslint --fix ${file}" }]
    }]
  }
}
```

Hook types: shell commands, LLM evaluation, agentic verification, HTTP endpoints, TypeScript callbacks, in-memory functions.

**Use cases:**
- Block destructive operations
- Post to Slack on completion
- Run linters after every file edit
- Enforce code style automatically
- Log all tool calls for audit

**Strength:** Infinite flexibility, zero source modifications.
**Weakness:** Hook failures can block the agent; debugging hook chains is hard.

### Level 5: OS-Native Sandboxing (Codex CLI)

**The strongest sandboxing among CLI agents.** Kernel-level enforcement — the agent literally cannot escape.

**macOS — Seatbelt:**
```scheme
(deny default)
(allow file-read* (subpath "/Users/me/project"))
(allow file-write* (subpath "/Users/me/project"))
(deny network-outbound)
(allow process-exec (literal "/usr/bin/node"))
```

**Linux — Landlock + seccomp:**
```c
struct landlock_path_beneath_attr path = {
    .allowed_access = LANDLOCK_ACCESS_FS_READ_FILE | LANDLOCK_ACCESS_FS_WRITE_FILE,
    .parent_fd = open("/home/me/project", O_PATH),
};
landlock_add_rule(ruleset_fd, LANDLOCK_RULE_PATH_BENEATH, &path, 0);
```

**Windows — Restricted Tokens.**

Three sandbox modes:
- **Read-only:** Agent can only read, not write
- **Workspace-write:** Read anywhere, write only within workspace (default)
- **Full access:** No restrictions

Spawned commands (git, npm, test runners) inherit sandbox boundaries. The agent cannot circumvent restrictions by running a subprocess.

**Strength:** Zero trust. Kernel-enforced. Near-zero performance overhead.
**Weakness:** OS-specific implementation (3 codepaths). Cannot restrict semantic actions (can't distinguish "write a test" from "overwrite production config" — both are file writes).

### Level 6: Container Sandboxing (OpenHands)

**The most flexible isolation system.** OpenHands supports 5 sandbox backends:

| Backend | How It Works | Overhead | Use Case |
|---------|-------------|----------|----------|
| **Docker** | Full container with restricted capabilities | Medium (startup time) | Standard isolation |
| **SSH** | Remote machine execution | Low | Remote environments |
| **Singularity** | HPC-compatible containers | Low | Academic/research clusters |
| **Modal** | Serverless cloud containers | Medium | Cloud deployment |
| **Bubblewrap** | Lightweight Linux sandboxing | Very low | Quick local isolation |

Each agent runs in its own container, torn down post-session. Network access controlled. File system mapped from host with limited permissions.

**Strength:** Full isolation, portable across OS, network control.
**Weakness:** Container startup latency, Docker required, file permission complexity.

### Level 7: Cloud VM Sandboxing (Devin, Bolt)

Devin runs each agent in a dedicated Ubuntu VM with full internet access, browser, terminal, and editor. The VM is the sandbox — agents cannot affect the host or other agents.

Bolt.new uses StackBlitz's WebContainer — a Node.js runtime running entirely in the browser via WebAssembly. The browser sandbox is the security boundary.

**Strength:** Maximum isolation. Full development environment per agent.
**Weakness:** Cost (per-VM compute), latency (VM startup), limited to cloud deployment.

## Complete Sandboxing Comparison

| Harness | Sandboxing | Approach | Network Control | Performance |
|---------|-----------|----------|-----------------|-------------|
| **Codex CLI** | OS-native (Seatbelt/Landlock) | Kernel restrictions | Yes (deny outbound) | Near-zero overhead |
| **OpenHands** | Multi-backend (Docker/SSH/Singularity/Modal/Bubblewrap) | Container per agent | Yes | Medium |
| **Devin** | Cloud VM | Dedicated Ubuntu VM | Full control | High (per-VM cost) |
| **Bolt.new** | WebContainer (browser WASM) | Node.js in browser | Browser sandbox | None (all in-browser) |
| **Cursor** | Git worktree isolation | File-level isolation per agent | None | Low |
| **Claude Code** | None (hooks + permissions) | Trust pipeline, not sandbox | None (hooks can block) | None |
| **Aider** | None (git undo) | Git history as safety net | None | None |
| **Cline** | None (diff review) | User approves each change | None | None |
| **SWE-agent** | Docker (eval only) | Research environment | Container-level | Medium |
| **Goose** | None | No user-facing approval flow | None | None |

## MCP Security Considerations

MCP introduces a new attack surface documented in the [MCP specification](https://modelcontextprotocol.io/specification):

**Prompt injection via tool results:** A malicious MCP server could return tool results that hijack the agent's behavior — instructing it to exfiltrate data or execute dangerous commands.

**Server impersonation:** Without verification, a compromised server claims to be a trusted one.

**Capability creep:** Users install MCP servers without understanding their full tool surface.

**Mitigations in well-designed hosts:**
- Per-server tool approval on first use
- Tool allowlists at the host level
- Server provenance checking (signed manifests, in emerging standards)
- Sandboxed server processes

## Agent-Specific Security Patterns

### Secret Management
- **Never hardcode secrets.** Environment variables or secret managers.
- **Tool result budgeting** prevents agents from dumping secrets in context. Claude Code's `maxResultSizeChars` + disk persistence keeps large outputs out of the conversation.
- **Instruction file security:** CLAUDE.md and AGENTS.md files checked into repos are visible to all contributors. Don't put secrets in instruction files.

### Sub-Agent Restriction
When spawning sub-agents, restrict their capabilities:
```typescript
// Research agent: read-only, no bash
Agent({ tools: ['Read', 'Glob', 'Grep', 'WebSearch'], model: 'haiku' })

// Code agent: can edit but no network
Agent({ tools: ['Read', 'Write', 'Edit', 'Bash'], model: 'sonnet' })
```

### Git Worktree Isolation
For parallel agents editing code, each agent gets its own worktree (git branch + working copy). Changes merge only when verified. See [Case Study: Sub-Agent Patterns](../case-studies/claude-code-sub-agent-patterns.md).

## Common Pitfalls

- **No permissions at all** — agent has full system access
- **bypassPermissions in production** — fine for local dev, dangerous in shared environments
- **Trusting tool names** — an agent could craft arguments that do unexpected things within an allowed tool
- **No secret scanning** — agent might output API keys in logs
- **MCP servers without vetting** — installing untrusted MCP servers expands the attack surface
- **Shared state between parallel agents** — without worktree isolation, two agents editing the same file corrupt it
- **Network access by default** — an agent that can make outbound network calls can exfiltrate data

## Checklist

- [ ] Tool allowlist at minimum (specify what the agent CAN do, not what it can't)
- [ ] Deny/Ask/Allow rules for interactive use
- [ ] Pre-tool hooks for custom validation (block destructive commands)
- [ ] No secrets in tool output or conversation logs
- [ ] `bypassPermissions` only for trusted local development
- [ ] OS-level sandboxing for agents that execute bash (Seatbelt/Landlock for CLI, Docker for cloud)
- [ ] Network isolation for untrusted agents (deny outbound by default)
- [ ] Sub-agent tool restriction (read-only agents for research tasks)
- [ ] Git worktree isolation for parallel agents
- [ ] MCP server vetting before installation
- [ ] `.clineignore` / file exclusion for sensitive paths
- [ ] RBAC hierarchy if multi-user (enterprise → project → user → session)

## Further Reading

- [Case Study: Codex CLI Sandboxing](../case-studies/openai-codex-sandboxing.md) — OS-native isolation deep dive
- [Case Study: Claude Code Architecture](../case-studies/claude-code-architecture-deep-dive.md) — 7-stage permission pipeline
- [Case Study: Sub-Agent Patterns](../case-studies/claude-code-sub-agent-patterns.md) — tool restriction for sub-agents
- [MCP: Model Context Protocol](12-mcp-model-context-protocol.md) — MCP security considerations
- [InjectAgent](https://arxiv.org/abs/2403.02691) — prompt injection attacks against tool-using agents
- [Codex Sandboxing Docs](https://developers.openai.com/codex/concepts/sandboxing) — official Codex CLI sandboxing reference
