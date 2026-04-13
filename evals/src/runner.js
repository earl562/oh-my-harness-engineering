import { cp, mkdtemp } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { assertEvalTask } from '../../packages/harness-core/src/index.js'
import { runCheck } from './checks.js'

const DEFAULT_FIXTURES_ROOT = new URL('../fixtures/', import.meta.url)

export async function prepareWorkspace(task, fixturesRoot = DEFAULT_FIXTURES_ROOT) {
  assertEvalTask(task)

  const workspaceRoot = await mkdtemp(
    path.join(os.tmpdir(), `awesome-agentic-harness-${task.id}-`)
  )

  if (task.fixture) {
    const fixturePath = path.join(fixturesRoot.pathname, task.fixture)
    await cp(fixturePath, workspaceRoot, { recursive: true })
  }

  return workspaceRoot
}

export async function runEvalTask({
  harness,
  task,
  workspaceRoot = null,
  fixturesRoot = DEFAULT_FIXTURES_ROOT
}) {
  const preparedWorkspace = workspaceRoot ?? await prepareWorkspace(task, fixturesRoot)
  const trace = await harness.runTask(task, { workspaceRoot: preparedWorkspace })
  const checks = []

  for (const check of task.checks ?? []) {
    checks.push(await runCheck(check, { workspaceRoot: preparedWorkspace, trace }))
  }

  const passed = checks.every((result) => result.passed)

  return {
    taskId: task.id,
    workspaceRoot: preparedWorkspace,
    trace,
    checks,
    passed
  }
}
