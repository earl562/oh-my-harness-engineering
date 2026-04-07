# Claude Code: Sub-Agent Patterns

## The Problem

Complex tasks benefit from parallelism — running a security review while writing tests while exploring the codebase. But giving a sub-agent the same capabilities as the parent creates problems:

- **Context pollution** — sub-agent actions appear in the parent's conversation
- **Resource conflicts** — two agents editing the same file
- **Scope creep** — a sub-agent meant to "search for X" starts refactoring Y
- **Cost explosion** — each sub-agent uses its own context window

How do you get the benefits of delegation without these risks?

## The Approach

Claude Code solves this with **bounded sub-agents** via the Agent tool. Each sub-agent:

1. **Gets a fresh context** — no conversation history from the parent
2. **Has restricted tools** — the parent specifies which tools the sub-agent can use
3. **Returns a single result** — only the final output reaches the parent, not the full transcript
4. **Runs in isolation** — optionally in a git worktree for file-level isolation

### Key Design Decisions

**Tool restriction per sub-agent:**
```
# Read-only exploration agent
Agent(tools=['Read', 'Glob', 'Grep'])

# Code implementation agent
Agent(tools=['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'])

# Research agent (no file writes)
Agent(tools=['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch'])
```

The parent decides what each child can do. An exploration agent that can't write files is safe to run without supervision. A coding agent that can edit files might need the user's attention.

**Model routing per sub-agent:**
```
# Cheap model for search/exploration
Agent(model='haiku', ...)

# Standard model for implementation
Agent(model='sonnet', ...)

# Powerful model for architecture decisions
Agent(model='opus', ...)
```

Not every sub-task needs the most expensive model. Search and file reading work fine on haiku at 1/5th the cost.

**Worktree isolation:**
```
Agent(isolation='worktree', ...)
```

The sub-agent gets a complete copy of the repo in a temporary git worktree. It can make any changes without affecting the parent's working directory. If the changes are good, they're merged back. If not, the worktree is discarded.

## Why It Works

1. **Bounded context** — each sub-agent only sees what it needs. A grep agent doesn't need the full conversation about feature requirements.

2. **Parallel execution** — independent sub-agents run concurrently. The parent can launch a security reviewer, a test writer, and a documentation updater simultaneously.

3. **Clean result aggregation** — the parent sees one summary from each sub-agent, not hundreds of tool calls. This keeps the parent's context clean for decision-making.

4. **Fail isolation** — if a sub-agent gets stuck or produces bad output, it doesn't corrupt the parent's state. The parent can retry with a different approach.

## Trade-offs

**No shared state:** Sub-agents can't see each other's work. If agent A creates a file that agent B needs, the parent must coordinate explicitly.

**Context loss:** The fresh context means sub-agents don't know the "why" behind a task unless the parent explains it in the prompt. Terse delegation prompts produce shallow work.

**Cost overhead:** Each sub-agent pays for its own system prompt and tool definitions. For very quick tasks, the overhead may exceed the task cost.

**Coordination complexity:** The parent must synthesize results from multiple sub-agents. With many parallel agents, this synthesis becomes the bottleneck.

## Lessons for Your Harness

1. **Default to read-only sub-agents.** Most delegation is research — finding files, searching code, reading docs. Read-only agents are safe to run unsupervised.

2. **Route models by task complexity.** Exploration and search tasks don't need your most expensive model. Save the powerful model for synthesis and decision-making in the parent.

3. **Return summaries, not transcripts.** The parent needs conclusions, not the full chain of tool calls that produced them. This keeps the parent's context budget for its own reasoning.

4. **Use worktrees for write-heavy sub-agents.** File-level isolation prevents conflicts when multiple agents need to edit code.

5. **Brief sub-agents thoroughly.** "Search for X" produces worse results than "We're implementing feature Y because of requirement Z. Search for X in the codebase to determine if there's an existing implementation we should extend."
