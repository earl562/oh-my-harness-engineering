# Error Recovery

## What It Is

Error recovery is how the harness handles failures: tool errors, model hallucinations, broken edits, test failures. A good harness detects problems and attempts recovery before escalating to the user.

## Why It Matters

Agents fail constantly. Files don't exist, commands return errors, edits break syntax, tests fail. Without recovery, every error requires human intervention. With it, agents self-correct 60-80% of the time.

## Recovery Patterns

### Pattern 1: Error as Context
The simplest pattern — return tool errors as text to the LLM. The model sees the error and adjusts.

```typescript
try {
  result = await tool.call(input)
} catch (err) {
  result = `Error: ${err.message}`  // LLM sees this and adapts
}
messages.push({ role: 'tool', content: result })
```

### Pattern 2: Lint-Gated Edits (SWE-agent)
After every file edit, run a linter. If the edit breaks syntax, revert and tell the agent.

```typescript
async function editWithLintGate(file, newContent) {
  const backup = await readFile(file)
  await writeFile(file, newContent)
  const lintResult = await runLinter(file)
  if (lintResult.errors.length > 0) {
    await writeFile(file, backup)  // Revert
    return `Edit reverted — lint errors:\n${lintResult.errors.join('\n')}`
  }
  return 'Edit applied successfully'
}
```

### Pattern 3: Test-and-Fix Loop
After implementing a change, run tests. If they fail, feed the failure back and let the agent fix it. Limit retries.

### Pattern 4: Configurable Retry
```typescript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i <= maxRetries; i++) {
    try { return await fn() }
    catch (err) {
      if (i === maxRetries) throw err
      await sleep(1000 * Math.pow(2, i))  // Exponential backoff
    }
  }
}
```

## How Top Harnesses Do It

**Claude Code:** Errors returned as text to the LLM. The agent loop lets Claude see what went wrong and try again. The Agent SDK handles this internally with built-in retry logic.

**SWE-agent:** Lint-gated edits are core to their ACI design. Every edit is validated. They also implement a `scroll` system for file viewing — if the agent asks for line 500 but the file only has 200 lines, it gets a helpful error.

**Aider:** Runs tests after edits and feeds failures back. Uses git to track changes — if an edit series goes wrong, it can revert to the last good commit.

## Common Pitfalls

- **Infinite retry loops** — always limit retries (3-5 max)
- **Swallowing errors** — errors should reach the LLM so it can adapt
- **Not reverting bad edits** — broken files cascade into more errors
- **No escalation path** — some errors need human intervention

## Checklist

- [ ] Tool errors returned as text (not swallowed)
- [ ] Max retry limits on all retry loops
- [ ] Lint gate after file edits (optional but recommended)
- [ ] Test-and-fix loop for code changes
- [ ] Exponential backoff on retries
- [ ] Escalation to user when retries exhausted
