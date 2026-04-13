import test from 'node:test'
import assert from 'node:assert/strict'

import { CodexCoreHarness, createStaticPlanDriver } from '../src/index.js'

test('CodexCoreHarness emits traces and policy decisions for blocked commands', async () => {
  const harness = new CodexCoreHarness({
    driver: createStaticPlanDriver([
      {
        message: 'Attempting a blocked network command.',
        toolCalls: [
          {
            name: 'run_command',
            input: {
              command: 'curl https://example.com'
            }
          }
        ]
      }
    ])
  })

  const task = {
    id: 'sandbox-network-policy',
    title: 'Sandbox-sensitive task',
    tier: 'sandbox-sensitive',
    prompt: 'Try a blocked command.',
    checks: []
  }

  const trace = await harness.runTask(task, { workspaceRoot: process.cwd() })

  assert.equal(trace.status, 'failed')
  assert.ok(
    trace.policyDecisions.some((decision) => decision.decision === 'deny')
  )
  assert.ok(
    trace.failures.some((failure) => failure.toolName === 'run_command')
  )
})
