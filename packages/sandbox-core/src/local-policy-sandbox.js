import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

const DEFAULT_ALLOWED_COMMAND_PREFIXES = [
  'cat',
  'echo',
  'find',
  'git branch --show-current',
  'git diff',
  'git rev-parse',
  'git status',
  'ls',
  'node --test',
  'node -v',
  'npm run test',
  'npm test',
  'pwd',
  'rg',
  'sed -n',
  'true'
]

const DEFAULT_DENY_PATTERNS = [
  /\bcurl\b/,
  /\bwget\b/,
  /\bnc\b/,
  /\bnetcat\b/,
  /\bping\b/,
  /\bscp\b/,
  /\bssh\b/
]

export class SandboxPolicyError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'SandboxPolicyError'
    this.details = details
  }
}

export class LocalPolicySandbox {
  constructor({
    workspaceRoot,
    readRoots = [workspaceRoot],
    writeRoots = [workspaceRoot],
    allowedCommandPrefixes = DEFAULT_ALLOWED_COMMAND_PREFIXES,
    denyPatterns = DEFAULT_DENY_PATTERNS
  }) {
    if (!workspaceRoot) {
      throw new TypeError('workspaceRoot is required for LocalPolicySandbox.')
    }

    this.workspaceRoot = path.resolve(workspaceRoot)
    this.readRoots = readRoots.map((root) => path.resolve(root))
    this.writeRoots = writeRoots.map((root) => path.resolve(root))
    this.allowedCommandPrefixes = allowedCommandPrefixes
    this.denyPatterns = denyPatterns
    this.sessions = new Map()
  }

  async createSession(metadata = {}) {
    const sessionId = randomUUID()
    this.sessions.set(sessionId, {
      sessionId,
      metadata,
      createdAt: new Date().toISOString()
    })
    return {
      sessionId,
      metadata
    }
  }

  async teardownSession(sessionId) {
    this.requireSession(sessionId)
    this.sessions.delete(sessionId)
  }

  requireSession(sessionId) {
    const session = this.sessions.get(sessionId)

    if (!session) {
      throw new SandboxPolicyError(`Unknown sandbox session "${sessionId}".`)
    }

    return session
  }

  resolvePath(targetPath, access = 'read') {
    const absolutePath = path.resolve(this.workspaceRoot, targetPath)
    const allowedRoots = access === 'write' ? this.writeRoots : this.readRoots

    if (!allowedRoots.some((root) => this.isWithinRoot(absolutePath, root))) {
      throw new SandboxPolicyError(
        `Path "${targetPath}" is outside the sandbox ${access} scope.`,
        {
          policy: {
            decision: 'deny',
            type: 'path',
            access,
            targetPath,
            absolutePath
          }
        }
      )
    }

    return absolutePath
  }

  isWithinRoot(targetPath, root) {
    return targetPath === root || targetPath.startsWith(`${root}${path.sep}`)
  }

  async readFile(sessionId, targetPath) {
    this.requireSession(sessionId)
    const absolutePath = this.resolvePath(targetPath, 'read')
    const content = await readFile(absolutePath, 'utf8')
    return {
      path: targetPath,
      content
    }
  }

  async writeFile(sessionId, targetPath, content) {
    this.requireSession(sessionId)
    const absolutePath = this.resolvePath(targetPath, 'write')
    await mkdir(path.dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
    return {
      path: targetPath,
      bytesWritten: Buffer.byteLength(content, 'utf8')
    }
  }

  async replaceInFile(sessionId, targetPath, before, after, { all = false } = {}) {
    this.requireSession(sessionId)
    const absolutePath = this.resolvePath(targetPath, 'write')
    const currentContent = await readFile(absolutePath, 'utf8')

    if (!currentContent.includes(before)) {
      throw new SandboxPolicyError(
        `Unable to edit "${targetPath}" because the target snippet was not found.`
      )
    }

    const replacementCount = all
      ? currentContent.split(before).length - 1
      : 1

    const nextContent = all
      ? currentContent.split(before).join(after)
      : currentContent.replace(before, after)

    await writeFile(absolutePath, nextContent, 'utf8')

    return {
      path: targetPath,
      replacements: replacementCount
    }
  }

  async executeCommand(
    sessionId,
    command,
    {
      cwd = '.',
      timeoutMs = 30_000,
      allowNetworkEscapeHatch = false
    } = {}
  ) {
    this.requireSession(sessionId)
    const absoluteCwd = this.resolvePath(cwd, 'read')

    const matchedDeny = this.denyPatterns.find((pattern) => pattern.test(command))
    const matchedAllow = this.allowedCommandPrefixes.find(
      (prefix) => command === prefix || command.startsWith(`${prefix} `)
    )

    if (matchedDeny && !allowNetworkEscapeHatch) {
      throw new SandboxPolicyError(
        `Command blocked by default-deny network policy: ${command}`,
        {
          policy: {
            decision: 'deny',
            type: 'command',
            command,
            cwd,
            matchedDenyRule: matchedDeny.source
          }
        }
      )
    }

    if (!matchedAllow && !allowNetworkEscapeHatch) {
      throw new SandboxPolicyError(
        `Command blocked because it is outside the default allowlist: ${command}`,
        {
          policy: {
            decision: 'deny',
            type: 'command',
            command,
            cwd,
            matchedAllowRule: null
          }
        }
      )
    }

    return await new Promise((resolve, reject) => {
      const child = spawn('/bin/sh', ['-lc', command], {
        cwd: absoluteCwd,
        env: {
          HOME: process.env.HOME,
          PATH: process.env.PATH
        },
        stdio: ['ignore', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''
      let timedOut = false

      const timer = setTimeout(() => {
        timedOut = true
        child.kill('SIGTERM')
      }, timeoutMs)

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString()
      })

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString()
      })

      child.on('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })

      child.on('close', (code) => {
        clearTimeout(timer)

        resolve({
          command,
          cwd,
          stdout,
          stderr,
          exitCode: code ?? 0,
          timedOut,
          policy: {
            decision: allowNetworkEscapeHatch ? 'escape-hatch' : 'allow',
            type: 'command',
            command,
            cwd,
            matchedAllowRule: matchedAllow ?? null,
            matchedDenyRule: matchedDeny?.source ?? null
          }
        })
      })
    })
  }
}
