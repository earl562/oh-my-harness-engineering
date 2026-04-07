# Case Studies

Deep dives into specific architectural decisions made by production harnesses. Each case study focuses on one key design choice, why it was made, and what we can learn from it.

## Available Case Studies

| Case Study | Harness | Focus Area |
|------------|---------|------------|
| [Sub-Agent Patterns](claude-code-sub-agent-patterns.md) | Claude Code | How bounded child agents with restricted tool access enable parallel, safe task delegation |
| [ACI Design](swe-agent-aci-design.md) | SWE-agent | Why a simple agent with well-designed tool interfaces beats complex orchestration |
| [OS-Native Sandboxing](openai-codex-sandboxing.md) | Codex CLI | Kernel-level isolation vs Docker vs permission systems — trade-offs and implementation |

## Template

Want to contribute a case study? Follow this structure:

```markdown
# [Harness Name]: [Specific Design Decision]

## The Problem
What challenge does this design address?

## The Approach
How does this harness solve it? Include architecture, code examples, or diagrams.

## Why It Works
What makes this approach effective? Reference benchmarks or real-world results.

## Trade-offs
What does this approach sacrifice? When would you choose differently?

## Lessons for Your Harness
Actionable takeaways you can apply to your own system.
```

See [CONTRIBUTING.md](../CONTRIBUTING.md) for submission guidelines.
