# Build Your First Harness

A step-by-step guide to building a minimal agentic harness from scratch. By the end, you'll have a working agent that reads files, runs commands, and iterates until tasks are done.

**Time:** ~30 minutes
**Language:** TypeScript
**Prerequisites:** Node.js 20+, an API key from Anthropic or OpenAI

---

## What We're Building

A 200-line harness with:
- An agent loop (observe-choose-act)
- Three tools (ReadFile, WriteFile, RunCommand)
- Streaming output
- Error recovery
- A max turns limit

This is intentionally minimal. Production harnesses add compaction, routing, permissions, and UX — but this core loop is what every harness is built on.

## Step 1: The Tool Interface

Every tool is a name, description, input schema, and an execution function.

```typescript
// tools.ts
import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

type Tool = {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
  execute: (input: Record<string, unknown>) => string
}

export const tools: Tool[] = [
  {
    name: 'ReadFile',
    description: 'Read the contents of a file. Returns the file content as text. Use this to understand existing code before making changes.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute or relative path to the file' }
      },
      required: ['path']
    },
    execute: ({ path }) => {
      try {
        const content = readFileSync(path as string, 'utf-8')
        const lines = content.split('\n')
        if (lines.length > 200) {
          return `${lines.slice(0, 200).join('\n')}\n\n... (${lines.length - 200} more lines, use ReadFile with a specific range)`
        }
        return content
      } catch (err: any) {
        return `Error reading file: ${err.message}`
      }
    }
  },
  {
    name: 'WriteFile',
    description: 'Write content to a file. Creates the file if it does not exist, overwrites if it does.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to write to' },
        content: { type: 'string', description: 'Content to write' }
      },
      required: ['path', 'content']
    },
    execute: ({ path, content }) => {
      try {
        writeFileSync(path as string, content as string)
        return `File written: ${path} (${(content as string).split('\n').length} lines)`
      } catch (err: any) {
        return `Error writing file: ${err.message}`
      }
    }
  },
  {
    name: 'RunCommand',
    description: 'Run a shell command and return its output. Use for running tests, installing packages, checking git status, etc.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The shell command to execute' }
      },
      required: ['command']
    },
    execute: ({ command }) => {
      try {
        const output = execSync(command as string, {
          encoding: 'utf-8',
          timeout: 30_000,
          maxBuffer: 1024 * 1024
        })
        // Bound output to prevent context bloat
        const lines = output.split('\n')
        if (lines.length > 100) {
          return `${lines.slice(0, 100).join('\n')}\n\n... (${lines.length - 100} more lines truncated)`
        }
        return output || '(no output)'
      } catch (err: any) {
        return `Command failed (exit ${err.status}):\n${err.stderr || err.message}`
      }
    }
  }
]
```

**Key design choices:**
- Tool descriptions are written for the LLM, not humans — clear, specific, with usage hints
- Output is bounded (200 lines for files, 100 for commands) to prevent context bloat
- Errors are returned as text, not thrown — the LLM needs to see errors to adapt

## Step 2: The Agent Loop

The core loop: send messages to the LLM, collect the response, execute tool calls, repeat.

```typescript
// agent.ts
import Anthropic from '@anthropic-ai/sdk'
import { tools } from './tools'

const client = new Anthropic()
const MAX_TURNS = 25

type Message = Anthropic.MessageParam

export async function runAgent(userPrompt: string): Promise<void> {
  const messages: Message[] = [
    { role: 'user', content: userPrompt }
  ]

  const toolSchemas = tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema
  }))

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    // 1. Send to LLM (streaming)
    process.stdout.write(`\n--- Turn ${turn + 1} ---\n`)

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'You are a coding agent. Use tools to read files, write code, and run commands. Work step by step until the task is complete.',
      messages,
      tools: toolSchemas
    })

    // 2. Process response content
    const assistantContent: Anthropic.ContentBlock[] = []
    const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = []

    for (const block of response.content) {
      assistantContent.push(block)

      if (block.type === 'text') {
        process.stdout.write(block.text)
      }

      if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>
        })
      }
    }

    // 3. Append assistant message to history
    messages.push({ role: 'assistant', content: assistantContent })

    // 4. No tool calls = task complete
    if (toolCalls.length === 0) {
      process.stdout.write('\n\n[Task complete]\n')
      return
    }

    // 5. Execute tools, collect results
    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const call of toolCalls) {
      const tool = tools.find(t => t.name === call.name)

      process.stdout.write(`\n> ${call.name}(${JSON.stringify(call.input).slice(0, 80)}...)\n`)

      if (!tool) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: call.id,
          content: `Error: unknown tool "${call.name}"`
        })
        continue
      }

      const result = tool.execute(call.input)
      process.stdout.write(`  ${result.split('\n')[0]}\n`) // Show first line of result

      toolResults.push({
        type: 'tool_result',
        tool_use_id: call.id,
        content: result
      })
    }

    // 6. Append tool results to history and loop
    messages.push({ role: 'user', content: toolResults })
  }

  process.stdout.write('\n[Max turns exceeded]\n')
}
```

## Step 3: The Entry Point

```typescript
// main.ts
import { runAgent } from './agent'

const prompt = process.argv.slice(2).join(' ')

if (!prompt) {
  console.log('Usage: npx tsx main.ts "your task here"')
  process.exit(1)
}

runAgent(prompt).catch(console.error)
```

## Step 4: Run It

```bash
npm init -y
npm install @anthropic-ai/sdk tsx typescript
export ANTHROPIC_API_KEY=sk-ant-...

npx tsx main.ts "Read package.json and tell me what this project does"
npx tsx main.ts "Create a hello.ts file that exports a greet function, then write a test for it"
```

## What This Harness Does Well

- **Clean loop** — observe, choose, act, repeat
- **Error recovery** — tool errors are returned as text, LLM adapts
- **Bounded output** — no context bloat from large files or command output
- **Visible progress** — tool calls and results are printed

## What's Missing (and Where to Add It)

| Missing Feature | Why It Matters | Where to Learn |
|----------------|---------------|----------------|
| **Streaming** | Users see nothing until each turn completes | [TUI & UX](09-tui-and-ux.md) |
| **Context compaction** | Dies after ~15 tool-heavy turns | [Context Management](04-context-management.md) |
| **Model routing** | Uses sonnet for everything including simple tasks | [Model Routing](05-model-routing.md) |
| **Permissions** | Agent can run any command including `rm -rf` | [Security & Permissions](08-security-and-permissions.md) |
| **Edit tool** | WriteFile overwrites entire files; need search-and-replace | [Tool System](03-tool-system.md) |
| **Sub-agents** | Can't parallelize work | [Case Study: Sub-Agent Patterns](../case-studies/claude-code-sub-agent-patterns.md) |
| **Lint gate** | Bad edits cascade into more errors | [Error Recovery](07-error-recovery.md) |
| **Memory** | Forgets everything between sessions | [Context Management](04-context-management.md) |

Each missing feature is covered in depth in the linked docs. The minimal harness above is the foundation — production harnesses layer these capabilities on top.

## Next Steps

1. **Add streaming** — switch from `messages.create()` to `messages.stream()` and yield tokens as they arrive
2. **Add an Edit tool** — search-and-replace is more reliable than full file rewrites
3. **Add compaction** — when message token count exceeds 60% of context window, summarize older turns
4. **Add permissions** — at minimum, prompt before running destructive commands
5. **Try the Agent SDK** — if you're building on Claude, the Agent SDK gives you all of the above out of the box

---

*This tutorial uses the Anthropic API. For OpenAI, the structure is identical — swap `client.messages.create()` for `openai.chat.completions.create()` and adjust the message format.*
