# Error Recovery

## What It Is

Error recovery is how the harness handles failures: tool errors, model hallucinations, broken edits, test failures, rate limits, context overflow, and network issues. A good harness detects problems and attempts recovery before escalating to the user.

## Why It Matters

Agents fail constantly. Files don't exist, commands return errors, edits break syntax, tests fail, APIs rate-limit. Without recovery, every error requires human intervention. With it, agents self-correct 60-80% of the time.

The Poly harness research found that **error recovery is the third most critical gap** (after context management and sandboxing). Most harnesses return errors as text and hope the model adapts. Production harnesses implement error recovery as a first-class state machine inside the loop.

## Error Recovery as a State Machine

The tutorial approach wraps the entire loop in try-catch. Claude Code's approach treats each error type as a state in the loop's state machine, with a specific recovery path:

```typescript
// Tutorial approach — collapses in production
try {
  const result = await tool.call(input)
} catch (err) {
  console.error(err)  // Lost forever
}

// Production approach — error is a first-class state
for (let turn = 0; turn < maxTurns; turn++) {
  const response = await callModelWithRetry(provider, messages)

  switch (response.error?.type) {
    case 'prompt_too_long':
      messages = await compact(messages)
      continue  // Retry with compacted context

    case 'max_output_tokens':
      maxOutputTokens = Math.min(maxOutputTokens * 2, 64000)
      continue  // Retry with higher budget

    case 'rate_limited':
      await handleRateLimit(response.error)
      continue  // Retry after backoff

    case 'auth_error':
      await refreshCredentials()
      continue  // Retry with fresh auth

    case null:
      break  // No error, proceed to tool execution
  }

  // ... tool execution with its own error handling
}
```

## The Six Recovery Patterns

### Pattern 1: Errors as Context (Baseline)

Return tool errors as text to the LLM. The model sees the error and adapts. This is the minimum viable approach — every harness does at least this.

```typescript
try {
  const result = await tool.call(input)
  messages.push({ role: 'tool', content: result })
} catch (err) {
  messages.push({ role: 'tool', content: `Error: ${err.message}` })
  // LLM sees this and adapts its approach
}
```

**Who uses it:** Every harness as the baseline. Claude Code, Codex CLI, SWE-agent, Aider, Cline, OpenHands.

### Pattern 2: Lint-Gated Edits (SWE-agent)

After every file edit, run a syntax check. If the edit introduces errors, **revert immediately** and tell the agent what went wrong. This prevents cascading errors where one bad edit breaks subsequent tool calls.

```typescript
async function editWithLintGate(file: string, newContent: string): Promise<string> {
  const backup = await readFile(file)
  await writeFile(file, newContent)

  const lint = await runLinter(file)
  if (lint.errors.length > 0) {
    await writeFile(file, backup)  // Revert
    return `Edit REVERTED — syntax errors:\n${lint.errors.join('\n')}\nFile restored to previous state.`
  }

  return `Edit applied: ${file} (${countLines(newContent)} lines, lint passed)`
}
```

SWE-agent's research showed this is the highest-ROI error recovery pattern. It prevents the most common failure mode: the agent makes a syntactically invalid edit, subsequent tool calls operate on broken code, and the agent spirals.

**Who uses it:** SWE-agent (core to ACI design), Aider (lint-and-fix loop).

### Pattern 3: Test-and-Fix Loop (Aider)

After code changes, run the test suite. If tests fail, feed the failure output back to the agent for a second attempt. Aider's polyglot benchmark uses a two-attempt protocol: first attempt, then test results + retry.

```typescript
// After applying edits:
const testResult = await runTests()

if (!testResult.passed) {
  messages.push({
    role: 'user',
    content: `Tests failed after your changes:\n${testResult.output}\n\nPlease fix the failing tests.`
  })
  // Agent gets one more attempt
}
```

Aider found that the two-attempt model significantly improves benchmark scores — many failures are simple oversights the model corrects immediately when shown test output.

**Who uses it:** Aider (two-attempt polyglot benchmark), OpenHands (critic model pattern).

### Pattern 4: Critic Model (OpenHands, Devin)

A separate model evaluates the agent's output before accepting it. The generator produces, the critic reviews, and only approved work continues.

Devin's compound AI system implements this with dedicated models:
- **The Planner** — outlines strategy
- **The Coder** — writes code
- **The Critic** — adversarial review for security vulnerabilities and logic errors

OpenHands implements a similar pattern where the critic model evaluates solutions at inference time. The agent generates a solution, the critic scores it, and if rejected, the agent retries with the critic's feedback.

**Who uses it:** Devin (compound AI with dedicated Critic model), OpenHands (critic model for SWE-bench SOTA).

### Pattern 5: Configurable Retry with Backoff (Claude Code)

Claude Code's 823-line retry system handles 10+ error classes with specific recovery per type:

| Error | Recovery Strategy |
|-------|-------------------|
| **429 (Rate Limited)** | Check `Retry-After` header. Under 20s → retry, keep fast mode. Over 20s → 30-min cooldown. `overage-disabled` header → permanently disable fast mode. |
| **529 (Overloaded)** | Track consecutive 529 count. Three in a row with fallback model → switch models. Background task → bail to prevent cascade. |
| **400 (Context Overflow)** | Parse error for actual/limit token counts. Recalculate: `available = limit - input - 1000`. Enforce minimum 3,000 output tokens. Retry with adjusted budget. |
| **401/403 (Auth)** | Clear API key cache. Force-refresh OAuth tokens. Retry with new credentials. |
| **Network (ECONNRESET, EPIPE)** | Disable keep-alive socket pooling. Retry with new connection. |

Backoff formula:
```typescript
const delay = Math.min(500 * Math.pow(2, attempt), 32000)
  + Math.random() * 0.25 * delay  // Jitter
```

For unattended sessions (CI/CD, background agents): persistent retry mode retries 429/529 **indefinitely** with 5-minute max backoff and 6-hour reset cap. 30-second heartbeat emissions prevent idle kills.

The streaming layer adds its own reliability:
- **90-second idle timeout** watchdog (warning at 45s)
- **30-second stall detection** between consecutive chunks
- **Streaming → non-streaming fallback** if streaming fails entirely

### Pattern 6: Self-Verification Loop (Open-SWE / LangChain)

After each edit, the agent verifies its own work is correct. Combined with loop detection (detecting when the agent is repeating the same failing actions), this improved LangChain's Terminal-Bench score from 52.8% → 66.5%.

```typescript
// After tool execution
const verification = await verifyChange(messages, lastToolResult)

if (!verification.correct) {
  messages.push({
    role: 'user',
    content: `Self-verification failed: ${verification.reason}. Try a different approach.`
  })
  continue
}

// Loop detection
if (isRepeatingPattern(recentActions, 3)) {
  messages.push({
    role: 'user',
    content: 'You appear to be repeating the same approach. Try a fundamentally different strategy.'
  })
}
```

## How Top Harnesses Compare

| Harness | Error as Context | Lint Gate | Test Loop | Critic Model | Retry System | Self-Verify |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Claude Code** | Yes | No | No | No | 823-line state machine | No |
| **SWE-agent** | Yes | **Yes** (core) | No | No | No | No |
| **Aider** | Yes | **Yes** | **Yes** (2-attempt) | No | No | No |
| **OpenHands** | Yes | No | No | **Yes** (critic) | Event replay | No |
| **Devin** | Yes | No | **Yes** | **Yes** (compound AI) | Internal | No |
| **Codex CLI** | Yes | No | No | No | Sandbox error handling | No |
| **Open-SWE** | Yes | No | No | No | No | **Yes** + loop detection |
| **Cline** | Yes | No | No | No | No | No |
| **Goose** | Yes | No | No | No | RetryConfig per recipe | No |
| **Continue** | Yes | No | No | No | No | No |

## Implementing Error Recovery: Priority Order

Based on ROI from the Poly harness research:

1. **Errors as context** (immediate, free) — return all errors as text to the LLM
2. **Lint-gated edits** (high ROI) — reject syntactically invalid edits before they enter history
3. **Test-and-fix loop** (high ROI) — run tests after changes, feed failures back for retry
4. **Configurable retry** (medium ROI) — specific recovery per API error type
5. **Self-verification** (medium ROI) — agent checks its own work after each step
6. **Critic model** (expensive but powerful) — separate model evaluates before accepting

## Common Pitfalls

- **Infinite retry loops** — always limit retries (3-5 max per error type)
- **Swallowing errors** — errors should reach the LLM so it can adapt
- **Not reverting bad edits** — broken files cascade into more errors
- **No escalation path** — some errors need human intervention; detect them
- **Generic retry for all errors** — 429 needs backoff, 400 needs budget adjustment, 401 needs credential refresh
- **No loop detection** — agent repeats same failing action 10 times
- **Retrying on non-retryable errors** — auth failures or invalid schemas won't succeed on retry

## Checklist

- [ ] Tool errors returned as text to LLM (not swallowed)
- [ ] Lint gate after file edits (reject invalid syntax, revert to backup)
- [ ] Max retry limits on all retry loops (3-5 per error type)
- [ ] Specific recovery per error class (rate limit, context overflow, auth, network)
- [ ] Exponential backoff with jitter on retries
- [ ] Test-and-fix loop for code changes (optional but recommended)
- [ ] Self-verification after edits (optional, high ROI on benchmarks)
- [ ] Loop detection (detect repeating patterns, force strategy change)
- [ ] Escalation to user when retries exhausted
- [ ] Streaming reliability (idle timeout, stall detection, fallback)

## Further Reading

- [Case Study: SWE-agent ACI Design](../case-studies/swe-agent-aci-design.md) — lint-gated edits as a core pattern
- [Case Study: Claude Code Architecture](../case-studies/claude-code-architecture-deep-dive.md) — the 823-line retry system
- [LangChain: Improving Deep Agents with Harness Engineering](https://blog.langchain.com/improving-deep-agents-with-harness-engineering/) — self-verification + loop detection = +14 points
- [Anthropic: Harness Design for Long-Running Development](https://www.anthropic.com/engineering/harness-design-for-long-running-application-development) — generator/evaluator pattern as error recovery
