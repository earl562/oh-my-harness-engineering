# Background and Async Agents

## What It Is

A background agent runs a long task without the user watching. The user fires off the task, gets a ticket or link, does other work, and checks back when it's done. This is fundamentally different from interactive agents that require the user to approve each step or stay engaged for the full session.

The archetype: Devin accepts a GitHub issue, spins up a cloud VM, works autonomously for 20-30 minutes, then opens a PR. The human never touches a keyboard during that time.

## Why It Changes Everything

Interactive agents are limited by human patience. If a user has to watch a terminal, they'll abort anything taking more than 5 minutes. Background agents can:
- Run for hours on complex tasks
- Work in parallel across multiple tasks
- Integrate into CI/CD pipelines
- Operate on a schedule without human initiation

The architectural constraints change completely. The harness must now handle: checkpointing, notifications, async task management, long-running session state, and failure recovery without a human in the loop.

## Current Implementations

### Cursor Background Agents
Cursor launched background agents in 2024. The agent runs in a cloud sandbox (not the user's machine), works on a task defined by a prompt, and pushes results back. Key architectural details:
- **Isolated cloud VM** — the agent has its own environment, not the user's
- **Git-based state** — work is committed incrementally; the user can inspect progress via branch history
- **Async handoff** — user triggers via the Cursor UI, result arrives as a PR or diff notification
- **Checkpoint-and-resume** — if the cloud task fails midway, it can be retried from the last checkpoint

Cursor's background agents are still interactive in that they can pause and ask the user a question when genuinely stuck. They're not fully autonomous — they have a "needs input" state.

### Devin's Async Model
Devin (Cognition) is the most fully autonomous background agent in production:
- **Cloud sandbox** — dedicated Ubuntu VM with full internet access, browser, terminal
- **Session persistence** — the entire VM state persists for the life of the task
- **Communication channel** — Devin communicates via Slack bot or web UI; sends updates, asks questions when blocked
- **Parallel task handling** — users can queue multiple tasks; Devin maintains separate VM instances
- **DeepWiki** — Devin builds a deep understanding of the codebase at task start (more in the Memory section)

Devin's async model means it can accept a task at 5pm and deliver results the next morning. The tradeoff: less human control during execution, higher risk of going off-track without correction.

### GitHub Copilot Workspace
GitHub's approach (launched 2024) is task-centric rather than session-centric:
- User opens a GitHub issue or defines a task in plain English
- Copilot Workspace generates a **plan** (changeset specification) before writing any code
- User reviews and edits the plan (not the code)
- Once plan is approved, the implementation runs in a cloud sandbox
- Result arrives as a draft PR

The key architectural insight: separating planning from execution gives humans a natural checkpoint without requiring them to watch code being written. The plan is the handoff point.

## Architectural Patterns for Background Agents

### Pattern 1: Task Queue + Worker Pool
```
[User] → [Task Queue] → [Worker Agent 1]
                      → [Worker Agent 2]
                      → [Worker Agent N]
         ↓
     [Result Store] → [Notification] → [User]
```
Each worker is an independent agent loop running in its own process/container. The harness manages scheduling, assignment, and cleanup.

### Pattern 2: Checkpoint-Resume State Machine
```
QUEUED → PLANNING → EXECUTING → WAITING_FOR_INPUT → EXECUTING → DONE
                                     ↑ user provides input
             ↓ failure at any point
          FAILED → [optional: retry from last checkpoint]
```
Each state transition is persisted. If the worker dies, the task can be resumed from the last saved state.

### Pattern 3: Scratchpad + Commit Trail
Agents maintain a scratchpad (notes, plans, intermediate work) that is committed to git alongside code changes. This gives humans a way to audit what the agent was thinking and when decisions were made. Devin uses this pattern.

## Critical Differences from Interactive Agents

| Dimension | Interactive | Background/Async |
|-----------|------------|-----------------|
| Loop lifetime | 5-25 turns (user watching) | 50-500+ turns |
| Failure handling | User sees and corrects | Agent must self-recover |
| Context window | Single session | Must survive restarts |
| Compute | User's machine | Cloud VM or container |
| State management | In-memory | Persisted (DB or git) |
| User feedback | Synchronous (each turn) | Async (notifications) |
| Task scope | Narrow, user-guided | Broad, self-directed |
| Cost visibility | Immediate | Billing happens offline |

## The "Needs Human" Problem

The hardest design problem for background agents: when should the agent stop and ask for help versus push through and guess?

Too many interruptions → user abandons the async model and watches anyway.
Too few interruptions → agent goes far down the wrong path, wasting hours of compute.

Current strategies:
- **Confidence thresholding** — agent scores its own confidence; if below threshold, pause and ask
- **Scope detection** — agent detects when the task has expanded beyond original scope (new files to create, dependencies to install) and checks in
- **Time-boxing** — pause and report after N minutes regardless of confidence
- **Explicit unknowns** — during planning phase, surface all unknowns for user to answer upfront

Devin's approach: tries to front-load all questions in a planning session before starting. Copilot Workspace: makes the plan explicit so users can preempt unknowns.

## Integration Patterns

Background agents integrate into workflows via:

**GitHub App** — agent is triggered by issue labels, PR comments, or CI failures. Results arrive as PR commits or comments.

**Slack Bot** — user DMs the agent or mentions it in a channel. Updates arrive as thread replies.

**CLI with polling** — user runs `agent start "fix bug #42"`, gets a task ID, checks `agent status <id>` later.

**Webhook callbacks** — completion events fire to a user-specified URL (for pipeline integration).

## Resources

- [Cursor Background Agents](https://docs.cursor.com/background-agents) — official docs
- [Devin Architecture Overview](https://www.cognition.ai/blog/introducing-devin) — Cognition's launch post
- [GitHub Copilot Workspace](https://githubnext.com/projects/copilot-workspace) — GitHub Next project page
- [Async Agent Patterns](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic's orchestrator-worker section applies directly
