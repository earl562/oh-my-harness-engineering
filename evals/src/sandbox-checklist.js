export const SANDBOX_CHECKLIST = [
  {
    key: 'write_scope',
    prompt: 'Are writes restricted to the workspace or another explicit allowlist?'
  },
  {
    key: 'read_scope',
    prompt: 'Are reads bounded, or can the harness inspect arbitrary host paths?'
  },
  {
    key: 'network_policy',
    prompt: 'Is outbound network access denied by default with explicit escape hatches?'
  },
  {
    key: 'subprocess_inheritance',
    prompt: 'Do subprocesses inherit the same sandbox policy and working-directory boundaries?'
  },
  {
    key: 'secret_exposure',
    prompt: 'Does the runtime avoid leaking credentials or operator secrets into the agent workspace?'
  },
  {
    key: 'auditability',
    prompt: 'Are policy decisions, blocked actions, and escape hatches recorded in the trace?'
  },
  {
    key: 'resume_model',
    prompt: 'Can sessions be resumed or snapshotted without weakening the trust boundary?'
  }
]
