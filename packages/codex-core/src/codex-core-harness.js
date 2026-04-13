import {
  assertEvalTask,
  createToolRegistry,
  createTrace,
  finishTrace,
  pushFailure,
  pushPolicyDecision,
  pushToolCall,
  pushTurn
} from '../../harness-core/src/index.js'
import { LocalPolicySandbox, SandboxPolicyError } from '../../sandbox-core/src/index.js'
import { createCodexStyleTools } from './default-tools.js'

export class CodexCoreHarness {
  constructor({
    harnessId = 'codex-core',
    driver,
    maxTurns = 8,
    sandboxFactory = (options) => new LocalPolicySandbox(options),
    toolFactory = createCodexStyleTools
  }) {
    if (!driver || typeof driver.nextTurn !== 'function') {
      throw new TypeError('CodexCoreHarness requires a driver with a nextTurn() method.')
    }

    this.harnessId = harnessId
    this.driver = driver
    this.maxTurns = maxTurns
    this.sandboxFactory = sandboxFactory
    this.toolFactory = toolFactory
  }

  async runTask(task, { workspaceRoot }) {
    assertEvalTask(task)

    const sandbox = this.sandboxFactory({ workspaceRoot })
    const { sessionId } = await sandbox.createSession({
      taskId: task.id,
      harnessId: this.harnessId
    })

    const tools = this.toolFactory({
      sandbox,
      sessionId
    })
    const registry = createToolRegistry(tools)

    const trace = createTrace({
      harnessId: this.harnessId,
      taskId: task.id,
      workspaceRoot,
      metadata: {
        mode: 'codex-style-terminal-core',
        toolNames: tools.map((tool) => tool.name)
      }
    })

    const messages = [
      {
        role: 'user',
        content: task.prompt
      }
    ]

    try {
      for (let turnNumber = 1; turnNumber <= this.maxTurns; turnNumber += 1) {
        const decision = await this.driver.nextTurn({
          task,
          messages,
          trace,
          tools: tools.map(({ name, description, inputSchema }) => ({
            name,
            description,
            inputSchema
          }))
        })

        pushTurn(trace, {
          turnNumber,
          assistantMessage: decision.message ?? '',
          requestedToolCalls: (decision.toolCalls ?? []).map((toolCall) => ({
            name: toolCall.name
          })),
          complete: Boolean(decision.complete)
        })

        messages.push({
          role: 'assistant',
          content: decision.message ?? ''
        })

        if (!decision.toolCalls?.length) {
          finishTrace(trace, {
            status: 'completed',
            summary: decision.message || 'Task completed without tool use.'
          })
          return trace
        }

        const toolResults = []

        for (const toolCall of decision.toolCalls) {
          const tool = registry.get(toolCall.name)

          if (!tool) {
            const error = new Error(`Unknown tool "${toolCall.name}".`)
            pushFailure(trace, {
              turnNumber,
              toolName: toolCall.name,
              error: error.message
            })
            throw error
          }

          try {
            const result = await tool.execute(toolCall.input ?? {})

            pushToolCall(trace, {
              turnNumber,
              toolName: toolCall.name,
              input: toolCall.input ?? {},
              outputPreview: result.content.slice(0, 160)
            })

            if (result.metadata?.policy) {
              pushPolicyDecision(trace, {
                turnNumber,
                toolName: toolCall.name,
                ...result.metadata.policy
              })
            }

            toolResults.push({
              toolName: toolCall.name,
              content: result.content
            })
          } catch (error) {
            pushFailure(trace, {
              turnNumber,
              toolName: toolCall.name,
              error: error.message
            })

            if (error instanceof SandboxPolicyError && error.details?.policy) {
              pushPolicyDecision(trace, {
                turnNumber,
                toolName: toolCall.name,
                ...error.details.policy
              })
            }

            throw error
          }
        }

        messages.push({
          role: 'tool',
          content: toolResults
        })

        if (decision.complete) {
          finishTrace(trace, {
            status: 'completed',
            summary: decision.message || 'Task completed after tool execution.'
          })
          return trace
        }
      }

      throw new Error(`Max turns exceeded (${this.maxTurns}).`)
    } catch (error) {
      finishTrace(trace, {
        status: 'failed',
        summary: 'Task failed during codex-core execution.',
        error
      })
      return trace
    } finally {
      await sandbox.teardownSession(sessionId)
    }
  }
}
