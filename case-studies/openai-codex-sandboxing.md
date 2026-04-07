# Codex CLI: OS-Native Sandboxing

## The Problem

Coding agents need to run commands — install packages, run tests, execute scripts. But giving an agent unrestricted shell access means it can:

- Delete files (`rm -rf /`)
- Exfiltrate data (curl secrets to external servers)
- Install malware
- Make network calls to unknown endpoints
- Modify system configuration
- Run up cloud bills

The question isn't whether agents should have shell access — they need it to be useful. The question is how to constrain it so mistakes and misbehavior can't cause real harm.

## Three Approaches Compared

### Approach 1: Permission Systems (Claude Code, Cline)

Ask the user before executing risky operations:

```
> Agent wants to run: rm -rf node_modules && npm install
> Allow? [y/n/always]
```

**Pros:** Zero overhead, works everywhere, user stays in control
**Cons:** Interrupts flow, user fatigue leads to auto-accepting, no protection against novel attacks the user doesn't recognize

Cline adds diff-based review for file edits — showing proposed changes before applying them. This is effective for interactive use but doesn't scale to autonomous operation.

### Approach 2: Docker Containers (OpenHands)

Run all agent actions inside a Docker container:

```dockerfile
FROM ubuntu:22.04
# Install dev tools
RUN apt-get update && apt-get install -y python3 nodejs git
# Map workspace from host
VOLUME /workspace
# Restrict network (optional)
```

**Pros:** Full isolation, portable across OS, network control, easy cleanup
**Cons:** Heavy (container startup time), limited host access, file permission issues, Docker required on all environments

### Approach 3: OS-Native Sandboxing (Codex CLI)

Use kernel-level security features to restrict the agent process directly:

**macOS — Seatbelt:**
```scheme
(deny default)
(allow file-read* (subpath "/Users/me/project"))
(allow file-write* (subpath "/Users/me/project"))
(deny network-outbound)
(allow process-exec (literal "/usr/bin/node"))
```

**Linux — Landlock:**
```c
struct landlock_path_beneath_attr path = {
    .allowed_access = LANDLOCK_ACCESS_FS_READ_FILE | LANDLOCK_ACCESS_FS_WRITE_FILE,
    .parent_fd = open("/home/me/project", O_PATH),
};
landlock_add_rule(ruleset_fd, LANDLOCK_RULE_PATH_BENEATH, &path, 0);
```

**Pros:** Near-zero overhead, kernel-enforced (agent literally cannot escape), no container needed, fine-grained control
**Cons:** OS-specific implementation, complex setup, limited to file/network restrictions, requires understanding of kernel security

## How Codex CLI Does It

Codex CLI implements a three-tier permission model:

### Tier 1: Suggest (read-only)
Agent can read files and suggest changes. All writes require explicit approval. Sandboxing restricts file writes system-wide.

### Tier 2: Auto-Edit (write to project)
Agent can read anything and write to the project directory. Network access blocked. Can run tests and build commands.

### Tier 3: Full Auto (unrestricted project access)
Agent can read, write, and execute within the project. Network still restricted by default. User can selectively allow specific network endpoints.

The sandbox is enforced at the kernel level. Even if the agent crafts a malicious command, the OS prevents it from executing outside the allowed scope. This is fundamentally different from permission prompts, where the user is the enforcement mechanism.

## Why It Works

1. **Zero trust architecture.** The agent is treated as untrusted code. It doesn't matter if the LLM was tricked by a prompt injection or hallucinated a dangerous command — the kernel blocks it.

2. **No performance penalty.** Unlike Docker, Seatbelt/Landlock adds negligible overhead. The agent runs at native speed.

3. **Invisible to the agent.** The sandbox is transparent — the agent doesn't know it's sandboxed. It tries to write outside the project, gets a permission error, and adapts. No special handling needed.

4. **Escalation path.** Users can progressively relax restrictions as they build trust. Start at Tier 1, move to Tier 2 after watching the agent work correctly.

## Trade-offs

**Platform complexity:** Supporting both macOS (Seatbelt) and Linux (Landlock) requires two separate implementations. Windows has no equivalent (yet).

**Limited scope:** OS-level sandboxing controls files and network. It can't restrict CPU time, memory usage, or prevent the agent from running long-lived processes.

**No semantic restrictions:** The sandbox can't distinguish between "write a test file" and "overwrite the production config" — both are writes to the project directory. Permission systems can make this distinction.

**Debugging difficulty:** When a sandboxed command fails, the error message is a generic "permission denied" rather than "the sandbox blocked this because..." This can confuse both the agent and the user.

## Lessons for Your Harness

1. **Layer your defenses.** Permission prompts + sandboxing is better than either alone. The sandbox catches what the user misses. The permission system provides semantic control the sandbox can't.

2. **Default to restrictive.** Start with read-only, let users opt into more access. The cost of inconvenience is lower than the cost of data loss.

3. **Network isolation matters most.** An agent that can't make network calls can't exfiltrate data, download malware, or call external APIs. Even without file sandboxing, network restriction prevents the worst outcomes.

4. **Make sandbox errors informative.** If you implement sandboxing, catch the generic "permission denied" errors and translate them: "Command blocked: writing outside project directory is not allowed in this permission tier."

5. **Consider your deployment context.** Interactive terminal use → permission prompts are fine. CI/CD or autonomous agents → kernel-level sandboxing is necessary. Cloud deployment → Docker or VM isolation.
