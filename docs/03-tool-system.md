# Tool System

## What It Is

Tools are how agents interact with the world. A tool is a function the LLM can call — read a file, run a command, search the web. The tool system defines how tools are described to the LLM, how calls are executed, and how results are returned.

## Why It Matters

SWE-agent's research on Agent-Computer Interfaces (ACI) showed that **tool interface design matters more than tool quantity**. The same model with better-designed tools solves 2x more tasks. mini-SWE-agent proves this dramatically: a single `bash` tool with a well-crafted system prompt achieves 74%+ on SWE-bench Verified. This is the highest-leverage component after the model itself.

## The Tool Interface

Every tool in a production harness implements this contract:

```typescript
type Tool = {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, JsonSchema>
    required?: string[]
  }

  call(input: Record<string, unknown>, ctx: ToolContext): Promise<string>

  // Optional capabilities
  checkPermission?(input: Record<string, unknown>, ctx: ToolContext): Promise<PermissionResult>
  stream?(input: Record<string, unknown>, ctx: ToolContext): AsyncGenerator<string>
  isReadOnly: boolean
}

type ToolContext = {
  cwd: string
  sessionId: string
  signal: AbortSignal
  model: string
  debug: boolean
  operations?: ToolOperations  // pluggable I/O for testing
}

type PermissionResult =
  | { denied: false }
  | { denied: true; reason: string }
```

Three design decisions matter here:

1. **Tools return strings, not objects.** The LLM consumes the result as text. Returning structured objects just adds a serialization step — return the text the LLM should see directly.

2. **ToolContext provides environment.** Tools don't access globals — they receive their working directory, abort signal, and session ID through context. This makes them testable and composable.

3. **Permission checks are separate from execution.** The harness can check permissions before running any tool code, and present the check to the user for approval.

## Tool Schema Conversion

The harness converts its internal tool definitions into the format the LLM provider expects:

```typescript
function toolsToSchemas(tools: readonly Tool[]): ToolSchema[] {
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.inputSchema.properties,
        required: tool.inputSchema.required ?? [],
      },
    },
  }))
}
```

The OpenAI format (above) is the de facto standard. Anthropic uses a slightly different structure (top-level `input_schema` instead of nested `parameters`), but most harnesses normalize to one format internally and convert at the provider boundary.

## Tool Design Principles

### 1. Descriptions Are Prompts

The tool `description` field is the most undervalued part of agent development. The LLM decides which tool to call based **entirely** on the description. Clear, specific descriptions with usage hints outperform vague ones dramatically.

```typescript
// Bad — vague, no guidance
{
  name: 'read',
  description: 'Read a file',
}

// Good — specific, with usage hints
{
  name: 'ReadFile',
  description: 'Read the contents of a file at the given path. Returns file content as numbered lines. Use this to understand existing code before making changes. For large files (>500 lines), consider reading a specific line range.',
}
```

### 2. Bound All Output

Never return unbounded text. A `grep` matching 10,000 lines wastes the entire context window on one tool result.

```typescript
execute: ({ path }) => {
  const content = readFileSync(path, 'utf-8')
  const lines = content.split('\n')

  if (lines.length > 200) {
    return lines
      .slice(0, 200)
      .map((line, i) => `${i + 1}\t${line}`)
      .join('\n')
      + `\n\n... (${lines.length - 200} more lines — use offset parameter to read further)`
  }

  return lines.map((line, i) => `${i + 1}\t${line}`).join('\n')
}
```

SWE-agent's windowed file viewing (100 lines at a time with a cursor) is the gold standard. The agent "scrolls" through files like a human would.

### 3. Return Structured Feedback

Every tool result should tell the LLM: **what happened, what changed, and whether it was successful.**

```typescript
// Bad — no feedback
return 'OK'

// Good — structured feedback
return `File written: src/config.ts (245 lines, 3 lines changed)
Lint: PASS (no errors)
Diff:
- const timeout = 5000
+ const timeout = config.timeout ?? 5000`
```

### 4. Error Messages as Guidance

Tool errors are prompts. "File not found" wastes a turn. A guided error message saves one:

```typescript
try {
  return readFileSync(path, 'utf-8')
} catch (err) {
  if (err.code === 'ENOENT') {
    // Find similar files to suggest
    const similar = findSimilarFiles(path, cwd)
    return `File not found: ${path}\nDid you mean: ${similar.join(', ')}?\nUse Glob to search for files.`
  }
  return `Error reading ${path}: ${err.message}`
}
```

### 5. Keep Tool Count Under 20

More than 15-20 tools degrades model performance — the LLM struggles to choose the right one. Claude Code uses ~19 tools. SWE-agent uses 7-10. mini-SWE-agent uses 1.

If you need more capabilities, use tool categories or MCP servers that are loaded dynamically based on the task.

## Tool Categories

| Category | Tools | When to Include |
|----------|-------|----------------|
| **File ops** | Read, Write, Edit, Glob, Grep | Always — core of any coding agent |
| **Shell** | Bash/RunCommand | Always — running tests, builds, git |
| **Navigation** | LSP, tree-sitter queries | For IDE agents with indexing |
| **Web** | WebSearch, WebFetch | When research is needed |
| **Agent** | SpawnSubagent | For parallel task delegation |
| **Domain** | Email, Calendar, CRM, API calls | Domain-specific agents only |

## The Edit Tool: Diff-Based vs Full Rewrite

The most important tool design decision for a coding agent is how file editing works.

**Full rewrite** (`WriteFile`) — the agent outputs the entire file content. Simple but wasteful: for a 500-line file where 3 lines change, the agent generates 500 lines of tokens.

**Diff-based** (`Edit`) — the agent specifies `old_string` and `new_string` for search-and-replace. Token-efficient and less error-prone:

```typescript
{
  name: 'Edit',
  description: 'Replace an exact string in a file with new content. The old_string must be unique in the file. For new files, use Write instead.',
  inputSchema: {
    properties: {
      file_path: { type: 'string' },
      old_string: { type: 'string', description: 'Exact text to find (must be unique in file)' },
      new_string: { type: 'string', description: 'Text to replace it with' },
    },
    required: ['file_path', 'old_string', 'new_string'],
  },
}
```

Claude Code, Aider, and Cline all use diff-based editing. Codex CLI uses patch-based editing (unified diff format). Full rewrite is only appropriate for creating new files.

## MCP: Dynamic Tool Registration

With [Model Context Protocol](12-mcp-model-context-protocol.md), tools are no longer static. The harness discovers tools at runtime from MCP servers:

```typescript
// Before MCP: static registration
const tools: Tool[] = [readTool, writeTool, editTool, bashTool, grepTool]

// With MCP: dynamic registration from servers
const mcpTools = await Promise.all(
  mcpServers.map(server => server.listTools())
)
const allTools = [...builtinTools, ...mcpTools.flat()]
```

This means your tool dispatch layer must support dynamic registration. Static tool arrays don't cut it when MCP servers can add or remove tools between sessions.

## Sandboxed Execution

For tools that execute arbitrary code (Bash, RunCommand), sandboxing determines what the agent can do at the OS level:

| Approach | Harness | How It Works | Overhead |
|----------|---------|-------------|----------|
| **OS-native** | Codex CLI | Seatbelt (macOS) / Landlock (Linux) kernel restrictions | Near-zero |
| **Container** | OpenHands, SWE-agent | Docker with restricted capabilities | Medium (container startup) |
| **WebContainer** | Bolt.new | Node.js in WebAssembly in the browser | Zero (browser sandbox) |
| **Permission prompt** | Claude Code, Cline | Ask user before executing | None (user is the sandbox) |
| **None** | Aider, Goose | Full system access | None (trust the user) |

See [Security & Permissions](08-security-and-permissions.md) and [Case Study: OS-Native Sandboxing](../case-studies/openai-codex-sandboxing.md) for deep dives.

## Testing Tools

The `ToolContext.operations` field enables testable tools without mocking the filesystem:

```typescript
type ToolOperations = {
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, content: string) => Promise<void>
  exec: (command: string) => Promise<{ stdout: string; stderr: string; exitCode: number }>
}

// In production: operations = real fs/exec
// In tests: operations = in-memory implementations
```

This is worth implementing early — debugging tools that hit the real filesystem is painful.

## Common Pitfalls

- **Too many tools** — more than 15-20 tools degrades model performance
- **Unbounded output** — a `grep` returning 10,000 lines wastes context
- **No error handling** — tool crashes kill the agent loop
- **Raw terminal output** — ANSI codes, progress bars, escape sequences confuse the LLM
- **Missing tools** — agent can't do its job, hallucinates workarounds
- **Vague descriptions** — LLM picks wrong tool because description doesn't distinguish it
- **No permission layer** — agent runs `rm -rf` without asking

## Checklist

- [ ] JSON Schema tool definitions with clear descriptions
- [ ] Bounded output (truncate at reasonable limits)
- [ ] Error messages that guide the LLM to next steps
- [ ] Permission check before execution
- [ ] Sequential execution for write tools (parallel OK for read-only)
- [ ] Tool count under 20 per agent
- [ ] Diff-based editing (not full file rewrites)
- [ ] ToolContext for testability
- [ ] Line numbers in file output
- [ ] Structured feedback (what happened, what changed, success/failure)

## Further Reading

- [Case Study: SWE-agent ACI Design](../case-studies/swe-agent-aci-design.md) — why tool interfaces beat tool quantity
- [MCP: Model Context Protocol](12-mcp-model-context-protocol.md) — dynamic tool registration
- [Security & Permissions](08-security-and-permissions.md) — tool execution safety
- [Build Your First Harness](build-your-first-harness.md) — implement 3 tools from scratch
- [arxiv 2405.15793](https://arxiv.org/abs/2405.15793) — SWE-agent ACI paper
