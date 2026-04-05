# Security and Permissions

## What It Is

The permission system controls what an agent is allowed to do. At minimum: which tools it can use. At best: sandboxed execution where the agent literally cannot cause harm beyond its allowed scope.

## Why It Matters

An unsandboxed agent with bash access can: delete your files, exfiltrate secrets, install malware, send emails, make API calls, run up cloud bills. Permissions are not optional in production.

## Permission Models

### Model 1: Tool Allowlists
Simplest. Specify which tools the agent can use.

```typescript
const options = {
  allowedTools: ['Read', 'Glob', 'Grep'],  // Read-only agent
  // Edit, Write, Bash are NOT available
}
```

### Model 2: Deny/Ask/Allow Rules (Claude Code)
Three-tier system per tool:
- **Allow** — auto-execute without asking
- **Ask** — prompt user for approval before executing
- **Deny** — never execute

```json
{
  "permissions": {
    "Read": "allow",
    "Edit": "ask",
    "Bash": "ask",
    "Write": "deny"
  }
}
```

### Model 3: Hooks (Agent SDK)
Programmatic interception of tool calls. Run custom logic before/after each tool use.

```typescript
hooks: {
  PreToolUse: [{
    matcher: 'Bash',
    hooks: [async (input) => {
      if (input.tool_input.command.includes('rm -rf')) {
        return { decision: 'block', reason: 'Destructive command blocked' }
      }
      return {}  // Allow
    }]
  }]
}
```

## Sandboxing

### OS-Native (Codex CLI)
- **macOS:** Seatbelt profiles restrict file system and network access
- **Linux:** Landlock restricts file paths, seccomp limits syscalls
- Agent cannot escape — kernel-level enforcement

### Container (OpenHands)
- Docker container with restricted capabilities
- Network access controlled
- File system mapped from host with limited permissions
- Heavier but more portable

### Diff Review (Cline)
- Shows proposed changes as diffs before applying
- User approves or rejects each change
- Not true sandboxing but effective for interactive use

## Common Pitfalls

- **No permissions at all** — agent has full system access
- **bypassPermissions in production** — fine for local dev, dangerous in shared environments
- **Trusting tool names** — an agent could craft arguments that do unexpected things within an allowed tool
- **No secret scanning** — agent might output API keys in logs

## Checklist

- [ ] Tool allowlist (minimum viable)
- [ ] Deny/Ask/Allow rules for interactive use
- [ ] Pre-tool hooks for custom validation
- [ ] No secrets in tool output or logs
- [ ] bypassPermissions only for trusted local use
- [ ] Consider OS-level sandboxing for untrusted code
