# Tool System

## What It Is

Tools are how agents interact with the world. A tool is a function the LLM can call — read a file, run a command, search the web. The tool system defines how tools are described to the LLM, how calls are executed, and how results are returned.

## Why It Matters

SWE-agent's research on Agent-Computer Interfaces (ACI) showed that **tool interface design matters more than tool quantity**. The same model with better-designed tools solves 2x more tasks. This is the highest-leverage component after the model itself.

## Tool Schema Design

Tools are described to the LLM as JSON schemas:

```typescript
type Tool = {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
  call(input: Record<string, unknown>): Promise<string>
}
```

### Good Tool Design
- **Clear names** — `FileRead` not `readFileFromDisk`
- **Focused scope** — one tool does one thing
- **Structured output** — return JSON or formatted text, not raw dumps
- **Bounded output** — truncate large results (SWE-agent windows file output to 100 lines)
- **Error messages as guidance** — "File not found. Did you mean src/utils/config.ts?" not just "ENOENT"

### SWE-agent's ACI Findings
- Tools should provide **feedback** about what happened (line numbers shown, cursor position)
- **Guardrails** prevent common mistakes (linting after edits)
- **Structured observations** help the LLM reason better than raw terminal output
- Window-based file viewing (show 100 lines at a time) outperforms dumping entire files

## Tool Categories

| Category | Tools | Examples |
|----------|-------|---------|
| **File ops** | Read, Write, Edit, Glob, Grep | Core of any coding agent |
| **Shell** | Bash, terminal execution | Running commands, tests, builds |
| **Web** | WebSearch, WebFetch | Research, API calls |
| **Agent** | Spawn subagent, delegate task | Parallel subtask execution |
| **Domain** | CRM, Calendar, Email, Notes | Agent-specific capabilities |

## Execution Patterns

### Synchronous (Simple)
```typescript
async function executeTool(call: ToolCall): Promise<string> {
  const tool = tools.find(t => t.name === call.name)
  if (!tool) return `Error: unknown tool "${call.name}"`
  try {
    return await tool.call(call.input)
  } catch (err) {
    return `Error: ${err.message}`
  }
}
```

### With Permission Check
```typescript
async function executeTool(call: ToolCall): Promise<string> {
  const tool = tools.find(t => t.name === call.name)
  if (!tool) return `Error: unknown tool "${call.name}"`

  const permission = await checkPermission(tool, call.input)
  if (permission.denied) return `Denied: ${permission.reason}`

  return await tool.call(call.input)
}
```

## Sandboxing

### Codex CLI (OS-native)
Uses macOS Seatbelt and Linux Landlock to restrict file system access and network calls at the OS level. The agent literally cannot write outside allowed directories.

### OpenHands (Docker)
Runs all tool execution inside a Docker container. Full isolation — the agent can't affect the host. Heavier but more portable.

### Cline (Diff-based)
Shows proposed file changes as diffs before applying. User approves or rejects. Not true sandboxing, but effective for interactive use.

## Common Pitfalls

- **Too many tools** — more than 15-20 tools degrades model performance
- **Unbounded output** — a `grep` returning 10,000 lines wastes context
- **No error handling** — tool crashes kill the agent loop
- **Raw terminal output** — ANSI codes, progress bars confuse the LLM
- **Missing tools** — agent can't do its job, hallucinates workarounds

## Checklist

- [ ] JSON Schema tool definitions
- [ ] Bounded output (truncate at reasonable limits)
- [ ] Error messages that guide the LLM
- [ ] Permission check before execution
- [ ] Sequential execution for write tools
- [ ] Tool count under 20 per agent
