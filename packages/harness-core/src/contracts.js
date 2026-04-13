import { randomUUID } from 'node:crypto'

export const TRACE_VERSION = '1.0.0'

/**
 * @typedef {object} EvalTask
 * @property {string} id
 * @property {string} title
 * @property {string} tier
 * @property {string} prompt
 * @property {string} [fixture]
 * @property {string} [description]
 * @property {Array<object>} [checks]
 */

/**
 * @typedef {object} ToolDefinition
 * @property {string} name
 * @property {string} description
 * @property {object} inputSchema
 * @property {(input: object) => Promise<{content: string, metadata?: object}>} execute
 */

/**
 * @typedef {object} HarnessTrace
 * @property {string} version
 * @property {string} traceId
 * @property {string} harnessId
 * @property {string} taskId
 * @property {string} workspaceRoot
 * @property {string} startedAt
 * @property {string | null} finishedAt
 * @property {"running" | "completed" | "failed"} status
 * @property {Array<object>} turns
 * @property {Array<object>} toolCalls
 * @property {Array<object>} failures
 * @property {Array<object>} policyDecisions
 * @property {object} metrics
 * @property {object} metadata
 */

export function assertEvalTask(task) {
  if (!task || typeof task !== 'object') {
    throw new TypeError('Eval task must be an object.')
  }

  for (const key of ['id', 'title', 'tier', 'prompt']) {
    if (!task[key] || typeof task[key] !== 'string') {
      throw new TypeError(`Eval task is missing required string field "${key}".`)
    }
  }

  return task
}

export function createTrace({ harnessId, taskId, workspaceRoot, metadata = {} }) {
  return {
    version: TRACE_VERSION,
    traceId: randomUUID(),
    harnessId,
    taskId,
    workspaceRoot,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    status: 'running',
    turns: [],
    toolCalls: [],
    failures: [],
    policyDecisions: [],
    metrics: {
      turnCount: 0,
      toolCallCount: 0,
      failureCount: 0
    },
    metadata
  }
}

export function pushTurn(trace, turn) {
  const nextTurn = {
    timestamp: new Date().toISOString(),
    ...turn
  }

  trace.turns.push(nextTurn)
  trace.metrics.turnCount = trace.turns.length
  return nextTurn
}

export function pushToolCall(trace, toolCall) {
  const nextToolCall = {
    timestamp: new Date().toISOString(),
    ...toolCall
  }

  trace.toolCalls.push(nextToolCall)
  trace.metrics.toolCallCount = trace.toolCalls.length
  return nextToolCall
}

export function pushFailure(trace, failure) {
  const nextFailure = {
    timestamp: new Date().toISOString(),
    ...failure
  }

  trace.failures.push(nextFailure)
  trace.metrics.failureCount = trace.failures.length
  return nextFailure
}

export function pushPolicyDecision(trace, decision) {
  const nextDecision = {
    timestamp: new Date().toISOString(),
    ...decision
  }

  trace.policyDecisions.push(nextDecision)
  return nextDecision
}

export function finishTrace(trace, { status = 'completed', summary = '', error = null } = {}) {
  trace.status = status
  trace.finishedAt = new Date().toISOString()
  trace.metadata.summary = summary

  if (error) {
    trace.metadata.error = {
      name: error.name,
      message: error.message
    }
  }

  return trace
}

export function createToolRegistry(tools) {
  const registry = new Map()

  for (const tool of tools) {
    registry.set(tool.name, tool)
  }

  return registry
}

export function boundTextByLines(text, maxLines) {
  const lines = `${text}`.split('\n')

  if (lines.length <= maxLines) {
    return {
      text: `${text}`,
      truncated: false,
      omittedLineCount: 0
    }
  }

  return {
    text: `${lines.slice(0, maxLines).join('\n')}\n\n... (${lines.length - maxLines} more lines truncated)`,
    truncated: true,
    omittedLineCount: lines.length - maxLines
  }
}
