# Case Studies

Deep dives into specific architectural decisions made by production harnesses. Each case study focuses on one key design choice, why it was made, and what we can learn from it.

## Available Case Studies

| Case Study | Harness | Focus Area |
|------------|---------|------------|
| [Sub-Agent Patterns](claude-code-sub-agent-patterns.md) | Claude Code | How bounded child agents with restricted tool access enable parallel, safe task delegation |
| [ACI Design](swe-agent-aci-design.md) | SWE-agent | Why a simple agent with well-designed tool interfaces beats complex orchestration |
| [OS-Native Sandboxing](openai-codex-sandboxing.md) | Codex CLI | Kernel-level isolation vs Docker vs permission systems — trade-offs and implementation |
| [Repo Map](aider-repo-map.md) | Aider | Tree-sitter-generated codebase summaries for token-efficient context |
| [Codebase Indexing](cursor-codebase-indexing.md) | Cursor | Embedding + structural indexing for zero-shot codebase understanding |

## What Makes a Good Case Study

A good case study focuses on **one specific design decision** — not "everything about Cursor" but "how Cursor indexes codebases for agent context."

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

## Wanted Case Studies

These harnesses have interesting architectural decisions worth documenting:

- **Devin** — the fully autonomous agent model: DeepWiki, cloud VMs, 500-turn sessions
- **Goose** — MCP-first architecture where all capabilities are plugins
- **Bolt.new** — WebContainer-based sandboxing in the browser
- **LangGraph** — graph-based agent orchestration with explicit state machines
- **Replit Agent** — full app generation and deployment from a single prompt

See [CONTRIBUTING.md](../CONTRIBUTING.md) for submission guidelines.
