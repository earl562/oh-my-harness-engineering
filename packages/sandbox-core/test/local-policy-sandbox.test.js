import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { LocalPolicySandbox, SandboxPolicyError } from '../src/index.js'

test('LocalPolicySandbox blocks writes outside the workspace root', async () => {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'sandbox-root-'))
  const sandbox = new LocalPolicySandbox({ workspaceRoot })
  const { sessionId } = await sandbox.createSession()

  await assert.rejects(
    () => sandbox.writeFile(sessionId, '../escape.txt', 'nope'),
    SandboxPolicyError
  )

  await sandbox.teardownSession(sessionId)
  await rm(workspaceRoot, { recursive: true, force: true })
})

test('LocalPolicySandbox denies curl by default', async () => {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'sandbox-net-'))
  const sandbox = new LocalPolicySandbox({ workspaceRoot })
  const { sessionId } = await sandbox.createSession()

  await assert.rejects(
    () => sandbox.executeCommand(sessionId, 'curl https://example.com'),
    (error) => {
      assert.equal(error instanceof SandboxPolicyError, true)
      assert.equal(error.details.policy.decision, 'deny')
      return true
    }
  )

  await sandbox.teardownSession(sessionId)
  await rm(workspaceRoot, { recursive: true, force: true })
})
