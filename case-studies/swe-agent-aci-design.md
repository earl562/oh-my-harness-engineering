# SWE-agent: Agent-Computer Interface Design

## The Problem

Early coding agents had access to raw shell commands — `cat`, `sed`, `grep`, `find`. They could technically do anything, but in practice they:

- Dumped entire 5,000-line files into context, wasting tokens
- Used `sed` with wrong line numbers, breaking files silently
- Got confused by ANSI escape codes in terminal output
- Had no feedback about what happened after an action
- Made the same mistakes repeatedly with no guardrails

The tool interface — the Agent-Computer Interface (ACI) — was the bottleneck, not the model.

## The Approach

Princeton's SWE-agent team redesigned how tools present themselves to the LLM. The principles:

### 1. Windowed File Viewing

Instead of dumping an entire file, show 100 lines at a time with a cursor position:

```
[File: src/utils/config.ts (245 lines total)]
(showing lines 50-150 of 245)
50: export function loadConfig(): PolyConfig {
51:   const raw = readFileSync(configPath, 'utf-8')
52:   const parsed = JSON.parse(raw)
...
150:   return merged
```

The agent "scrolls" through files like a human would. This prevents context pollution from large files and forces the agent to navigate intentionally.

### 2. Structured Observations

Every tool call returns structured feedback, not raw output:

```
[Edit successful]
File: src/config.ts
Lines changed: 42-56
Diff:
- const timeout = 5000
+ const timeout = config.timeout ?? 5000
Lint: PASS (no errors)
```

The agent knows exactly what happened: which file, which lines, whether the edit was clean. Compare this to raw `sed` output, which gives no confirmation at all.

### 3. Lint-Gated Edits

After every file edit, the system automatically runs a linter. If the edit introduces syntax errors, it's **reverted** and the agent is told what went wrong:

```
[Edit REVERTED - syntax error]
File: src/config.ts
Error: Unexpected token at line 45
The file has been restored to its previous state.
```

This prevents cascading errors where one bad edit breaks subsequent tool calls. The agent gets a clear signal to try a different approach.

### 4. Error Messages as Guidance

Instead of cryptic system errors, tools return actionable messages:

```
# Bad: raw error
FileNotFoundError: [Errno 2] No such file or directory: 'src/utlis/config.ts'

# Good: guided error
File not found: src/utlis/config.ts
Did you mean: src/utils/config.ts ?
(Use `find_file config.ts` to search the repository)
```

The error doesn't just say what went wrong — it suggests what to do next.

## Why It Works

SWE-agent's research showed that these ACI improvements produced a **2x increase in task completion** on SWE-bench compared to raw shell access — using the same model.

The key insight: **the model's capability is constant; the interface determines how much of that capability is usable.** A model that "knows" how to fix a bug will still fail if the tool interface makes it hard to navigate files, understand edits, and recover from errors.

This is the same principle behind good API design for humans. Developers using well-documented APIs with clear error messages write better code faster. LLMs are no different.

## Trade-offs

**Reduced flexibility:** Custom ACI tools can't do everything raw shell access can. Edge cases that require unusual commands need escape hatches.

**Maintenance burden:** Every tool needs careful design — descriptions, error messages, output formatting. This is more work than wrapping `subprocess.run()`.

**Agent-specific optimization:** Tools designed for one LLM may not work as well for another. OpenAI models and Claude have different strengths in tool use.

**Overhead per action:** Linting after every edit adds latency. For rapid fire edits, this can slow the agent down.

## Lessons for Your Harness

1. **Bound all tool output.** Never return unbounded text. If a grep matches 10,000 lines, return the first 50 with a count of total matches. The agent can refine its search.

2. **Return structured feedback.** Every tool call should tell the agent: what happened, what changed, and whether it was successful. "File written" is not enough — "File written: src/config.ts (245 lines, 3 lines changed, lint passed)" is.

3. **Add guardrails, not restrictions.** Lint-gated edits don't prevent the agent from editing — they prevent it from making broken edits stick. The agent retains full capability while being protected from cascading failures.

4. **Design error messages for the LLM.** Your error messages are prompts. "File not found" wastes a turn. "File not found. Similar files: [list]. Use find_file to search." saves a turn.

5. **Invest in tool descriptions.** The JSON schema description field is the most undervalued part of agent development. Clear, specific descriptions with examples outperform vague ones dramatically.
