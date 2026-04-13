import test from 'node:test'
import assert from 'node:assert/strict'

import { CodexCoreHarness, createStaticPlanDriver } from '../../packages/codex-core/src/index.js'
import { runEvalTask } from '../src/index.js'
import { TASK_CATALOG } from '../src/task-catalog.js'

test('eval runner executes a canonical task and validates file checks', async () => {
  const task = TASK_CATALOG.find((candidate) => candidate.id === 'single-file-debug-flag')

  const harness = new CodexCoreHarness({
    driver: createStaticPlanDriver([
      {
        message: 'Read the relevant files first.',
        toolCalls: [
          {
            name: 'read_file',
            input: { path: 'src/types.js' }
          },
          {
            name: 'read_file',
            input: { path: 'src/config.js' }
          }
        ]
      },
      {
        message: 'Apply the debug flag changes.',
        toolCalls: [
          {
            name: 'edit_file',
            input: {
              path: 'src/types.js',
              before: " * @property {number} port\n */\n",
              after: " * @property {number} port\n * @property {boolean} debug\n */\n"
            }
          },
          {
            name: 'edit_file',
            input: {
              path: 'src/types.js',
              before: "    appName: 'sample-app',\n    port: 3000,\n",
              after: "    appName: 'sample-app',\n    port: 3000,\n    debug: false,\n"
            }
          },
          {
            name: 'edit_file',
            input: {
              path: 'src/config.js',
              before: 'export function applyEnvOverrides(config, env = process.env) {\n  return {\n    ...config,\n    port: env.PORT ? Number(env.PORT) : config.port\n  }\n}\n',
              after: "export function applyEnvOverrides(config, env = process.env) {\n  return {\n    ...config,\n    port: env.PORT ? Number(env.PORT) : config.port,\n    debug: env.DEBUG ? env.DEBUG === 'true' : config.debug\n  }\n}\n"
            }
          }
        ]
      },
      {
        message: 'The debug flag task is complete.',
        complete: true,
        toolCalls: []
      }
    ])
  })

  const result = await runEvalTask({ harness, task })

  assert.equal(result.passed, true)
  assert.equal(result.trace.status, 'completed')
  assert.equal(result.trace.metrics.toolCallCount >= 4, true)
})
