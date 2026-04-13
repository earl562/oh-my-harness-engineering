import { boundTextByLines } from '../../harness-core/src/index.js'

export function createCodexStyleTools({
  sandbox,
  sessionId,
  maxFileLines = 200,
  maxCommandLines = 120
}) {
  return [
    {
      name: 'read_file',
      description: 'Read a workspace file with bounded output.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' }
        },
        required: ['path']
      },
      async execute({ path }) {
        const result = await sandbox.readFile(sessionId, path)
        const bounded = boundTextByLines(result.content, maxFileLines)

        return {
          content: bounded.text,
          metadata: {
            path,
            truncated: bounded.truncated,
            omittedLineCount: bounded.omittedLineCount
          }
        }
      }
    },
    {
      name: 'write_file',
      description: 'Write a full file within the workspace boundary.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          content: { type: 'string' }
        },
        required: ['path', 'content']
      },
      async execute({ path, content }) {
        const result = await sandbox.writeFile(sessionId, path, content)
        return {
          content: `Wrote ${result.path} (${result.bytesWritten} bytes).`,
          metadata: result
        }
      }
    },
    {
      name: 'edit_file',
      description: 'Replace an existing snippet in a file.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          before: { type: 'string' },
          after: { type: 'string' },
          all: { type: 'boolean' }
        },
        required: ['path', 'before', 'after']
      },
      async execute({ path, before, after, all = false }) {
        const result = await sandbox.replaceInFile(sessionId, path, before, after, {
          all
        })
        return {
          content: `Edited ${result.path} (${result.replacements} replacement${result.replacements === 1 ? '' : 's'}).`,
          metadata: result
        }
      }
    },
    {
      name: 'run_command',
      description: 'Run a bounded shell command through the sandbox policy layer.',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string' },
          cwd: { type: 'string' },
          allowNetworkEscapeHatch: { type: 'boolean' }
        },
        required: ['command']
      },
      async execute({ command, cwd = '.', allowNetworkEscapeHatch = false }) {
        const result = await sandbox.executeCommand(sessionId, command, {
          cwd,
          allowNetworkEscapeHatch
        })

        const rawOutput = result.stdout.trim() || result.stderr.trim() || '(no output)'
        const bounded = boundTextByLines(rawOutput, maxCommandLines)

        return {
          content: bounded.text,
          metadata: {
            command,
            cwd,
            exitCode: result.exitCode,
            policy: result.policy,
            timedOut: result.timedOut
          }
        }
      }
    }
  ]
}
