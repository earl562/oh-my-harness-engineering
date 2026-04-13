import assert from 'node:assert/strict'

import { TASK_CATALOG } from '../evals/src/task-catalog.js'
import { SANDBOX_CHECKLIST } from '../evals/src/sandbox-checklist.js'
import { EVAL_RUBRIC } from '../evals/src/rubric.js'

assert.ok(
  TASK_CATALOG.length >= 8,
  `Expected at least 8 canonical tasks, found ${TASK_CATALOG.length}.`
)

assert.ok(
  TASK_CATALOG.some((task) => task.tier === 'sandbox-sensitive'),
  'Expected at least one sandbox-sensitive task.'
)

assert.ok(
  SANDBOX_CHECKLIST.length >= 6,
  `Expected at least 6 sandbox checklist items, found ${SANDBOX_CHECKLIST.length}.`
)

assert.ok(
  EVAL_RUBRIC.length >= 8,
  `Expected at least 8 rubric dimensions, found ${EVAL_RUBRIC.length}.`
)

console.log('Eval lab catalog and rubric checks passed.')
