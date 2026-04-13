# Sandbox-First Harness Program

This repository already explains what harnesses are. This document defines how to use that knowledge to build one.

The goal is not to copy one product. The goal is to rebuild the strongest ideas from several harness families, compare their trade-offs under a shared rubric, and synthesize a new harness whose first design constraint is safe execution.

## Why This Program Exists

The field is converging on a blunt truth: once models are good enough, the harness becomes the product. But "harness" is too broad to study casually. Terminal agents, orchestration overlays, browser agents, spec frameworks, and personal assistants all solve different pieces of the same systems problem.

If we study them without a build order, we get a bookshelf. If we rebuild them in sequence, we get engineering judgment.

## North Star

Build a state-of-the-art open-source harness that:

- runs useful long-horizon tasks,
- survives messy real-world repos,
- supports multiple client surfaces,
- keeps memory and policies under operator control,
- and treats the sandbox as the load-bearing wall rather than optional hardening.

## The Six Families We Need To Study

### 1. Terminal coding substrates

Examples: Codex CLI, OpenCode, Gemini CLI, Qwen Code, Aider, Pi.

These teach the local agent loop, editing primitives, model routing, context compaction, and trust signals.

### 2. Orchestration overlays

Examples: oh-my-codex, oh-my-openagent.

These teach how a basic coding loop becomes a workflow engine: planning gates, persistent completion loops, background agents, model categories, and runtime state.

### 3. Spec and artifact frameworks

Examples: OpenSpec, GitHub Spec Kit, Kiro.

These teach a different lesson: planning should not live only in chat history. Specs, designs, and task lists can become first-class harness artifacts.

### 4. Browser and personal-agent harnesses

Examples: Browser Use, OpenClaw, Hermes-style assistants, Letta.

These add hard problems that code-only harnesses can ignore: authentication, secret brokering, durable identity, multi-app workflows, and browser/session state.

### 5. Cloud and autonomous runners

Examples: Devin, Jules, Copilot Coding Agent, Warp Oz.

These teach how agent sessions move from interactive local work into long-running, resumable, remotely supervised execution.

### 6. Sandbox infrastructure

Examples: Codex sandboxing, Browser Use control plane + microVMs, OpenHands backends, E2B, Daytona, Docker Sandboxes, microsandbox, Unikraft.

This family matters most. The rest of the harness is only as trustworthy as the execution boundary underneath it.

## The Most Important Design Decision

The harness must choose where untrusted execution lives.

There are two primary patterns:

1. Isolate the tool.
   The agent loop stays on the host or backend, but dangerous actions like shell execution or browser automation run in an isolated environment.
2. Isolate the agent.
   The entire agent runs inside a sandbox and reaches the outside world only through a control plane that holds secrets and policy.

Pattern 1 is easier to retrofit into existing systems.
Pattern 2 is the stronger long-term architecture for high-autonomy agents.

Our program should learn both, but the final harness should bias toward Pattern 2 for untrusted or long-running workloads.

## What Ralph, GEPA, and JEPA Mean For This Repo

### Ralph

Ralph is best understood as a persistent completion loop: keep pushing the task forward, verify, fix, and continue until the work is genuinely done.

Why it matters:

- It encodes a workflow discipline that many harnesses leave implicit.
- It is especially useful once planning is approved and the system should self-correct instead of stopping early.

What it is not:

- It is not a substitute for a secure runtime.
- It is not a proof that multi-agent orchestration is always needed.

Use it as a control-plane pattern, not the whole product thesis.

### GEPA

GEPA belongs in the outer optimization loop, not the initial runtime core.

Practical meaning for this repo:

- Once we have evals, we can use GEPA-style search to optimize prompts, routing rules, approval policies, and skill selection.
- It is a harness improver. It should tune the system after we define measurable outcomes.

Treat GEPA as phase-two leverage: first build the harness, then optimize the harness.

### JEPA

JEPA is not a coding harness pattern, but it matters strategically.

Why it matters:

- It points toward world-model-style prediction instead of pure text continuation.
- That matters more for browser agents, robotics, multimodal assistants, and long-horizon planning than for a first CLI harness.

How to use it:

- Keep JEPA in the research horizon.
- Do not make it a dependency for the initial harness MVP.

JEPA is a future-facing bet on better planning and state estimation, not an excuse to delay building the execution stack.

## Rebuild Program

### Wave 0: Build the lab before the harness

Deliver:

- benchmark tasks,
- trace capture,
- failure taxonomy,
- and a repeatable comparison rubric.

Why first:

- Without measurement, every harness looks impressive in screenshots.

### Wave 1: Minimal single-agent harness

Rebuild:

- a small ReAct-style loop,
- tool calling,
- safe file editing,
- bounded outputs,
- and a pluggable sandbox interface.

Reference influences:

- SWE-agent for ACI discipline,
- Aider for repo maps,
- Pi for toolkit minimalism.

Exit criterion:

- the minimal harness can solve small repo tasks with traceable failures.

### Wave 2: Sandbox-first coding substrate

Rebuild:

- Codex-style OS-native local isolation,
- or a microVM-backed equivalent for remote mode,
- plus filesystem and network policy,
- secret handling,
- and audit logs.

Reference influences:

- Codex CLI for OS-level restrictions,
- Browser Use for control-plane isolation,
- Docker Sandboxes and OpenHands for backend comparisons.

Exit criterion:

- the agent can run code without being trusted with host-level freedom.

### Wave 3: Multi-surface client/runtime split

Rebuild:

- a client/server boundary,
- durable sessions,
- and more than one surface for the same runtime.

Reference influences:

- OpenCode for client/server orientation,
- Codex App Server ideas,
- personal-agent runtimes that separate UI from execution.

Exit criterion:

- terminal, editor, or web surfaces can drive the same underlying task state.

### Wave 4: Orchestration overlay

Rebuild:

- planning gates,
- persistent completion loops,
- bounded subagents,
- model routing by task class,
- and optionally hash-anchored editing.

Reference influences:

- oh-my-codex,
- oh-my-openagent,
- Pi-style role separation.

Exit criterion:

- the system can parallelize research, implementation, and verification without collapsing context quality.

### Wave 5: Artifact and memory layer

Rebuild:

- spec artifacts,
- project memory,
- learned skills,
- and durable task records.

Reference influences:

- OpenSpec for artifact-guided changes,
- Letta for durable identity and memory,
- OpenClaw/Hermes-style personal assistant needs.

Exit criterion:

- important decisions no longer disappear when context compacts.

### Wave 6: Browser and personal-assistant execution

Rebuild:

- browser tasks,
- authentication workflows,
- and cross-app automation with stronger secret boundaries.

Reference influences:

- Browser Use sandboxing and auth patterns,
- assistant-style agents that need calendars, email, and documents.

Exit criterion:

- browser automation works without leaking raw credentials into the runtime.

### Wave 7: Meta-optimization

Rebuild:

- eval-driven harness tuning,
- prompt/policy/routing search,
- and automated comparison across harness variants.

Reference influences:

- GEPA-style optimization,
- modern coding-agent eval programs,
- and harness papers that treat the harness as a first-class research object.

Exit criterion:

- we can improve the harness by measurement instead of taste alone.

## The Target Architecture

The final harness should be organized into explicit planes:

### Control plane

- intent resolution,
- planning,
- routing,
- approval policy,
- stop conditions,
- and evaluator loops.

### Execution plane

- shell,
- file editing,
- browser,
- git,
- HTTP,
- and language-specific tools.

This plane runs inside the sandbox boundary.

### State plane

- short-term conversation state,
- compaction summaries,
- project memory,
- user memory,
- skill registry,
- and replayable traces.

### Environment plane

- workspace mounts,
- dependency cache,
- secrets broker,
- network policy,
- filesystem policy,
- and snapshot/resume controls.

### Client plane

- terminal,
- editor,
- web,
- CI trigger,
- and background job entrypoints.

### Governance plane

- audits,
- hooks,
- provenance,
- policy checks,
- budget limits,
- and incident response.

## Sandbox Strategy We Should Aim For

### Local mode

- Default to OS-native restrictions when available.
- Keep writes scoped to the workspace.
- Deny outbound network by default unless the task or tool explicitly requires it.

### Remote mode

- Prefer microVMs or equivalent VM-backed isolation for untrusted execution.
- Hold secrets in a control plane, not inside the sandbox.
- Treat the sandbox as disposable.

### Cross-mode rule

Never let convenience features erase the trust boundary. If a feature requires bypassing the sandbox to feel smooth, the feature design is incomplete.

## Comparative Rubric

Every rebuild should be scored on the same dimensions:

1. Sandbox strength
2. Edit reliability
3. Context efficiency
4. Memory durability
5. Long-horizon stability
6. Human trust and steerability
7. Cost and latency
8. Surface portability
9. Extensibility
10. Failure recovery

## The First Projects To Analyze Closely

Start with these because they define the program's backbone:

- `openai/codex`
- `anomalyco/opencode`
- `Yeachan-Heo/oh-my-codex`
- `code-yeongyu/oh-my-openagent`
- `badlogic/pi-mono`
- `Fission-AI/OpenSpec`
- Browser Use posts on sandboxing and authentication

Then expand into:

- OpenHands
- SWE-agent
- Letta
- OpenClaw
- Hermes-style assistants
- E2B
- Daytona
- Docker Sandboxes
- microsandbox

## What Success Looks Like

This program is working if, six months from now, the repo can answer three questions clearly:

1. Which harness patterns are genuinely reusable, and which are mostly branding?
2. Which sandbox architecture should power a modern open-source agent runtime?
3. Which pieces belong in the first version of our own harness, and which should wait?

If we can answer those with evidence instead of vibes, the repo has done its job.
