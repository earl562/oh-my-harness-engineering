# Eval and Benchmarks

## What It Is

Evaluation measures how well your harness performs on real tasks. It separates model quality from harness quality — the same model produces different results in different harnesses.

## Why It Matters

Without eval, you're flying blind. Every change to the harness (new tool, different prompt, context management update) might improve or regress quality. Benchmarks catch regressions before users do.

## SWE-bench

The standard benchmark for coding agents. 2,294 real GitHub issues from 12 Python repos. Each task: given an issue description, produce a patch that resolves it. Tests verify correctness.

**SWE-bench Verified:** A curated subset of 500 tasks with human-verified solutions. More reliable than the full set.

Current leaderboard leaders: Claude Code + Sonnet (72.7%), Devin (72.1%), OpenHands (69.1%).

## Custom Task Suites

SWE-bench tests Python repos specifically. For your harness, define tasks that match your use cases:

| # | Task | Tests |
|---|------|-------|
| 1 | Simple Q&A | Accuracy, no tool use |
| 2 | Single file edit | Correct diff |
| 3 | Multi-file refactor | Cross-file consistency |
| 4 | Bug diagnosis | Root cause accuracy |
| 5 | Multi-tool workflow | Tool selection, sequencing |
| 6 | Planning + execution | Plan quality, fidelity |
| 7 | Error recovery | Graceful handling of failures |
| 8 | Context-heavy task | Synthesis across many files |

## Metrics

| Metric | What It Measures |
|--------|-----------------|
| **Success rate** | Did the task complete correctly? |
| **Turns** | How many LLM calls were needed? |
| **Tool calls** | Total, unnecessary, failed |
| **Token usage** | Input + output tokens consumed |
| **Latency** | Wall clock time to completion |
| **Quality score** | Subjective 1-5 rating of output |

## Measuring Harness vs Model

Run the same tasks with:
1. Your harness + model A
2. Your harness + model B
3. Different harness + model A

Comparing 1 vs 2 measures **model quality**. Comparing 1 vs 3 measures **harness quality**.

## Common Pitfalls

- **No baseline** — measure before and after every change
- **Only testing happy paths** — include error recovery and edge cases
- **Optimizing for benchmarks** — overfitting to SWE-bench doesn't help real users
- **Not measuring cost** — a harness that uses 10x tokens for 5% better accuracy is worse

## Checklist

- [ ] Define 5-8 representative tasks
- [ ] Run before and after every harness change
- [ ] Track: success, turns, tools, tokens, latency
- [ ] Compare across models (same harness)
- [ ] Compare across harnesses (same model)
- [ ] Include error recovery tasks
