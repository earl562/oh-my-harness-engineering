export const TASK_CATALOG = [
  {
    id: 'explanation-mutex',
    title: 'Simple Q&A',
    tier: 'explanation',
    fixture: null,
    prompt: 'Explain what a mutex is and when you would use one.',
    description: 'A no-tool baseline task for explanation quality.',
    checks: []
  },
  {
    id: 'single-file-debug-flag',
    title: 'Single-file edit',
    tier: 'single-file-edit',
    fixture: 'sample-app',
    prompt:
      "Read src/config.js and src/types.js, then add a 'debug' boolean field with default false and support DEBUG env overrides. Update the code without touching unrelated behavior.",
    checks: [
      {
        type: 'file-contains',
        path: 'src/types.js',
        patterns: ['@property {boolean} debug', 'debug: false']
      },
      {
        type: 'file-contains',
        path: 'src/config.js',
        patterns: ['env.DEBUG', 'debug:']
      }
    ]
  },
  {
    id: 'multi-file-refactor-app-config',
    title: 'Multi-file refactor',
    tier: 'multi-file-edit',
    fixture: 'sample-app',
    prompt:
      'Rename PolyConfig to AppConfig across the fixture repo and update imports, docs, and helper names consistently.',
    checks: [
      {
        type: 'file-contains',
        path: 'src/types.js',
        patterns: ['AppConfig']
      },
      {
        type: 'file-not-contains',
        path: 'src/types.js',
        patterns: ['PolyConfig']
      }
    ]
  },
  {
    id: 'diagnose-streaming-tool-call-loss',
    title: 'Diagnosis report',
    tier: 'diagnosis',
    fixture: 'sample-app',
    prompt:
      'Inspect src/openai-compat.js and write a concise diagnosis report to reports/tool-call-loss.md describing why the final tool call can be dropped.',
    checks: [
      { type: 'file-exists', path: 'reports/tool-call-loss.md' },
      {
        type: 'file-contains',
        path: 'reports/tool-call-loss.md',
        patterns: ['pending', 'final tool call', 'stream ends']
      }
    ]
  },
  {
    id: 'plan-and-execute-health-endpoint',
    title: 'Plan + execution',
    tier: 'plan-execute',
    fixture: 'sample-app',
    prompt:
      "Create src/health.js exporting a function that returns { status: 'ok', uptime: process.uptime(), timestamp: Date.now() }, then add a basic test in tests/health.test.js.",
    checks: [
      { type: 'file-exists', path: 'src/health.js' },
      {
        type: 'file-contains',
        path: 'src/health.js',
        patterns: ["status: 'ok'", 'process.uptime()', 'Date.now()']
      },
      { type: 'file-exists', path: 'tests/health.test.js' }
    ]
  },
  {
    id: 'error-recovery-missing-file',
    title: 'Error recovery',
    tier: 'error-recovery',
    fixture: 'sample-app',
    prompt:
      'Attempt to inspect src/nonexistent/fake-module.js, then write reports/missing-file.md explaining that the file is absent and no summary can be produced.',
    checks: [
      { type: 'file-exists', path: 'reports/missing-file.md' },
      {
        type: 'file-contains',
        path: 'reports/missing-file.md',
        patterns: ['does not exist', 'cannot summarize']
      }
    ]
  },
  {
    id: 'context-flow-report',
    title: 'Context-heavy synthesis',
    tier: 'context-heavy',
    fixture: 'sample-app',
    prompt:
      'Read src/types.js, src/registry.js, src/router.js, src/openai-compat.js, and src/query.js. Write reports/chat-flow.md explaining how a message moves through this mini harness.',
    checks: [
      { type: 'file-exists', path: 'reports/chat-flow.md' },
      {
        type: 'file-contains',
        path: 'reports/chat-flow.md',
        patterns: ['registry', 'router', 'tool call', 'query']
      }
    ]
  },
  {
    id: 'sandbox-network-policy',
    title: 'Sandbox-sensitive task',
    tier: 'sandbox-sensitive',
    fixture: 'sample-app',
    prompt:
      'Try to run curl https://example.com through the shell tool, then write reports/network-policy.md describing what the sandbox allowed or blocked.',
    checks: [
      {
        type: 'policy-decision',
        match: {
          decision: 'deny',
          type: 'command'
        }
      },
      { type: 'file-exists', path: 'reports/network-policy.md' }
    ]
  }
]
