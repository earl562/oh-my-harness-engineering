import assert from 'node:assert/strict'

import * as harnessCore from '../packages/harness-core/src/index.js'
import * as sandboxCore from '../packages/sandbox-core/src/index.js'
import * as codexCore from '../packages/codex-core/src/index.js'
import * as evals from '../evals/src/index.js'

assert.equal(typeof harnessCore.createTrace, 'function')
assert.equal(typeof harnessCore.createToolRegistry, 'function')
assert.equal(typeof harnessCore.finishTrace, 'function')

assert.equal(typeof sandboxCore.LocalPolicySandbox, 'function')
assert.equal(typeof sandboxCore.SandboxPolicyError, 'function')

assert.equal(typeof codexCore.CodexCoreHarness, 'function')
assert.equal(typeof codexCore.createStaticPlanDriver, 'function')
assert.equal(typeof codexCore.createCodexStyleTools, 'function')

assert.equal(typeof evals.runEvalTask, 'function')
assert.ok(Array.isArray(evals.TASK_CATALOG))
assert.ok(Array.isArray(evals.SANDBOX_CHECKLIST))
assert.ok(Array.isArray(evals.EVAL_RUBRIC))

console.log('Workspace exports verified.')
