# Eval Lab

The eval lab is the comparison layer for every future harness reconstruction.

## What lives here

- canonical task catalog
- fixture repos
- shared scoring rubric
- sandbox checklist
- trace-aware checks and runner utilities

## Current scope

- 8 canonical task tiers
- 1 shared fixture repo for code-agent tasks
- pass/fail checks for file edits, reports, trace behavior, and sandbox policy outcomes

The lab is intentionally harness-agnostic. Each future reconstruction should plug into the same task and trace contracts rather than inventing custom benchmarks.
