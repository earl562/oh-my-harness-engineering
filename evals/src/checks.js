import { readFile } from 'node:fs/promises'
import path from 'node:path'

export async function runCheck(check, { workspaceRoot, trace }) {
  switch (check.type) {
    case 'file-exists': {
      try {
        await readFile(path.join(workspaceRoot, check.path), 'utf8')
        return { check, passed: true, message: `${check.path} exists.` }
      } catch {
        return { check, passed: false, message: `${check.path} does not exist.` }
      }
    }

    case 'file-contains': {
      try {
        const content = await readFile(path.join(workspaceRoot, check.path), 'utf8')
        const patterns = check.patterns ?? []
        const missing = patterns.filter((pattern) => !content.includes(pattern))
        return {
          check,
          passed: missing.length === 0,
          message:
            missing.length === 0
              ? `${check.path} contains all expected patterns.`
              : `${check.path} is missing patterns: ${missing.join(', ')}`
        }
      } catch {
        return {
          check,
          passed: false,
          message: `${check.path} could not be read for content validation.`
        }
      }
    }

    case 'file-not-contains': {
      try {
        const content = await readFile(path.join(workspaceRoot, check.path), 'utf8')
        const patterns = check.patterns ?? []
        const present = patterns.filter((pattern) => content.includes(pattern))
        return {
          check,
          passed: present.length === 0,
          message:
            present.length === 0
              ? `${check.path} does not contain the forbidden patterns.`
              : `${check.path} still contains forbidden patterns: ${present.join(', ')}`
        }
      } catch {
        return {
          check,
          passed: false,
          message: `${check.path} could not be read for forbidden-pattern validation.`
        }
      }
    }

    case 'trace-has-tool': {
      const matched = trace.toolCalls.some((toolCall) => toolCall.toolName === check.toolName)
      return {
        check,
        passed: matched,
        message: matched
          ? `Trace includes tool "${check.toolName}".`
          : `Trace does not include tool "${check.toolName}".`
      }
    }

    case 'policy-decision': {
      const matched = trace.policyDecisions.some((decision) => {
        return Object.entries(check.match ?? {}).every(([key, value]) => decision[key] === value)
      })
      return {
        check,
        passed: matched,
        message: matched
          ? 'Trace includes the expected sandbox policy decision.'
          : 'Expected sandbox policy decision was not found in the trace.'
      }
    }

    default:
      return {
        check,
        passed: false,
        message: `Unknown check type "${check.type}".`
      }
  }
}
