# Benchmark Task Suite

8 tasks of increasing difficulty for evaluating agentic harnesses.

## Tasks

### Task 1: Simple Q&A
**Prompt:** "What is a mutex and when would you use one?"
**Expected:** Clear, accurate explanation without tool use.
**Metrics:** accuracy, latency, token efficiency

### Task 2: Single File Edit
**Prompt:** "Read src/utils/config.ts and add a 'debug' boolean field to PolyConfig with default false. Update deepMerge and applyEnvOverrides to handle it."
**Expected:** Reads file, makes precise edit, no regressions.
**Metrics:** correctness, diff precision, turns

### Task 3: Multi-File Refactor
**Prompt:** "Rename the PolyConfig type to AppConfig across the entire codebase. Update all imports and references."
**Expected:** Finds all references, updates consistently, no broken imports.
**Metrics:** completeness, consistency, turns, tool calls

### Task 4: Bug Diagnosis
**Prompt:** "The openAICompatChat function sometimes drops the last tool call when streaming. Diagnose the issue and suggest a fix."
**Expected:** Reads file, identifies buffering edge case, proposes targeted fix.
**Metrics:** root cause accuracy, fix quality, turns

### Task 5: Multi-Tool Workflow
**Prompt:** "Find all TypeScript files in src/agents/ that export an AgentDefinition, list their names and descriptions, then save a summary note."
**Expected:** Uses Glob, Read, then QuickNote in sequence.
**Metrics:** tool selection, sequencing, result synthesis

### Task 6: Planning + Execution
**Prompt:** "Create src/health.ts exporting a function returning { status: 'ok', uptime: process.uptime(), timestamp: Date.now() }. Write a test."
**Expected:** Plans, creates file, writes test, verifies.
**Metrics:** plan quality, execution fidelity, test coverage, turns

### Task 7: Error Recovery
**Prompt:** "Read the file at src/nonexistent/fake-module.ts and summarize what it does."
**Expected:** Attempts read, gets error, reports gracefully without hallucinating.
**Metrics:** error handling, recovery quality, honesty

### Task 8: Context-Heavy Task
**Prompt:** "Read types.ts, registry.ts, router.ts, openai-compat.ts, and query.ts. Explain how a chat message flows end-to-end including tool call handling."
**Expected:** Reads all files, synthesizes accurate explanation.
**Metrics:** comprehension, synthesis quality, accuracy, token usage

## Metrics Reference

| Metric | How to Measure |
|--------|---------------|
| Success | Pass/fail — did the task complete correctly? |
| Turns | Count of LLM calls in the agent loop |
| Tool calls | Total tool invocations |
| Token usage | Input + output tokens from usage events |
| Latency | Wall clock time start to finish |
| Quality | 1-5 subjective rating |
