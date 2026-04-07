# Multi-Agent Orchestration

## What It Is

Multi-agent orchestration is the coordination of multiple specialized agents working toward a shared goal. Instead of one agent doing everything, the work is decomposed: an orchestrator plans and delegates, workers execute specific subtasks, and results are aggregated into a final output.

The single-agent model hits a wall on tasks that are: too long for one context window, naturally parallelizable, or requiring multiple domains of expertise simultaneously.

## Why It Matters

Anthropic's "Building Effective Agents" cites three reasons to go multi-agent:
1. Tasks too long or complex for one context window
2. Tasks benefiting from independent verification (one agent checks another's work)
3. Tasks with parallel independent subtasks (different agents work simultaneously)

The CodeR paper (2024) empirically showed that multi-agent approaches outperform single-agent on cross-file tasks requiring changes to 5+ files — while simple single-file fixes are better handled by a single focused agent.

## The Orchestrator-Worker Pattern

The most common architecture:

```
[Orchestrator Agent]
  - Receives the high-level task
  - Decomposes into subtasks
  - Assigns subtasks to worker agents
  - Aggregates results
  - Handles failures and retries
        ↓
[Worker 1]   [Worker 2]   [Worker 3]
  - Read-only   - File edits  - Test runner
  - Focused     - Focused     - Focused
  - Bounded     - Bounded     - Bounded
        ↓
[Results merged by orchestrator]
```

Claude Code implements this via the `Agent` tool: the orchestrator spawns subagents with specific tool allowlists and system prompts, then receives their results. Workers are bounded — they can't spawn their own subagents unless explicitly allowed.

## DAG-Based Coordination

More sophisticated orchestration uses a Directed Acyclic Graph (DAG) where nodes are tasks and edges are dependencies:

```
     [Parse issue]
          ↓
  [Localize file A]  [Localize file B]
       ↓                  ↓
  [Edit A]           [Edit B]
       ↓                  ↓
        [Run tests]
              ↓
        [Fix test failures]
              ↓
           [Done]
```

LangGraph implements DAGs explicitly: nodes are functions (often LLM calls), edges are transitions, and the graph topology determines execution order and parallelism.

## Framework Deep Dives

### LangGraph
LangGraph (from LangChain) is a graph-based agent orchestration library. Agents are nodes; state flows along edges. Key concepts:
- **State schema** — a typed object passed between all nodes (not just messages)
- **Conditional edges** — routing logic determines which node runs next based on current state
- **Cycles** — unlike pure DAGs, LangGraph supports cycles (the agent loops until a condition is met)
- **Human-in-the-loop** — nodes can pause and wait for human input before continuing
- **Persistence** — state is checkpointed; graphs can resume after failure

Best for: complex, stateful workflows with explicit branching logic. The graph structure is visible and debuggable.

Limitation: verbose. Defining a simple two-agent pipeline requires 50+ lines of graph definition.

### CrewAI
CrewAI uses a role-based metaphor: agents have `role`, `goal`, and `backstory`. A `Crew` defines agents and `Tasks`, and runs them in sequence or in parallel.

```python
researcher = Agent(
    role='Senior Research Analyst',
    goal='Research the competitive landscape',
    backstory='You are an expert at market research...',
    tools=[search_tool]
)

writer = Agent(
    role='Content Writer',
    goal='Write a report based on research findings',
    backstory='You are an expert at synthesizing...',
)

crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    process=Process.sequential
)
```

Best for: business workflows with human-readable role definitions. The role/goal/backstory pattern grounds agent behavior in domain terms rather than technical definitions.

Limitation: the metaphor breaks down for technical agent tasks (a "Senior DevOps Engineer" still needs exact tool schemas, not just a backstory).

### AutoGen / AG2
AutoGen (Microsoft, now forked as AG2) uses a **conversation-based** multi-agent model. Agents communicate by sending messages to each other, and the framework routes those messages based on who is addressed.

Key pattern: `UserProxyAgent` + `AssistantAgent`. The proxy agent represents a human or automated executor; the assistant proposes actions. This naturally supports human-in-the-loop at any point.

AutoGen 0.4+ (and AG2) added **Actor model** semantics: agents are actors that process messages asynchronously, enabling true parallel execution without shared mutable state.

Best for: conversational multi-agent pipelines where agents need to directly ask each other questions. The message-passing model is natural for delegation patterns.

Limitation: debugging multi-agent conversations is hard. When 4 agents are talking to each other, understanding why a decision was made requires reading through hundreds of messages.

### Semantic Kernel (Microsoft)
Semantic Kernel is a .NET/Python SDK (not a harness) that adds plugin and "planner" abstractions over standard LLM calls. The `Planner` decomposes a goal into a function call sequence using available plugins — essentially automated multi-step tool chaining.

SK's multi-agent support is newer (Agent Framework, added 2024): agents have `AgentChannel` for communication and can be combined into a `AgentGroupChat`.

Best for: enterprise .NET shops building on Azure OpenAI. Not commonly used in the harness space outside Microsoft ecosystems.

## Agent-to-Agent Communication Patterns

### Shared Message Queue
Agents read from and write to a shared queue. Decoupled — agents don't know about each other, only the queue format.

### Direct Tool Call (Claude Code model)
The orchestrator calls `Agent(subagent_type, prompt, tools)` and blocks until the worker responds. Synchronous, simple, no queue infrastructure needed. Works well when the orchestrator drives all decisions.

### Publish-Subscribe (AutoGen Actor model)
Agents subscribe to topic channels. An event on a topic wakes all subscribed agents. Enables reactive, event-driven coordination without central orchestration.

### Shared State Object (LangGraph model)
All agents read from and write to a shared typed state object. Simpler than message passing for tight coordination, but creates coupling — all agents must agree on the state schema.

## When to Use Multi-Agent

**Use multi-agent when:**
- A task requires more context than fits in one window (split into sequential agents)
- A task has independent parallel subtasks (run workers concurrently, cut wall time)
- A task benefits from adversarial review (one agent generates, another critiques)
- Different subtasks require completely different tool sets

**Don't use multi-agent when:**
- The task fits in one context window (coordination overhead > benefit)
- Tasks aren't truly independent (you'll need complex synchronization)
- The orchestrator needs to react to worker output mid-task (sequential is simpler)

## Failure Modes

**Cascade failures** — a worker produces bad output, the orchestrator treats it as good, and downstream workers build on the bad foundation.

**Orchestrator hallucination** — the orchestrator invents subtask results rather than waiting for workers.

**Infinite delegation** — worker agents spawn their own workers, depth grows unboundedly.

**State desync** — two workers modify the same file simultaneously; one's changes are lost.

Mitigations: worker result validation before handoff, explicit depth limits on delegation, sequential execution for writes, and result schemas that make invalid outputs easy to detect.

## Resources

- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic's orchestrator-worker patterns
- [CodeR Paper](https://arxiv.org/abs/2406.01304) — when multi-agent helps (and when it doesn't)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/) — graph-based orchestration
- [CrewAI](https://docs.crewai.com/) — role-based multi-agent framework
- [AutoGen / AG2](https://ag2.ai/) — conversational multi-agent framework
- [Claude Code Sub-Agent Patterns](../case-studies/claude-code-sub-agent-patterns.md) — how Claude Code's Agent tool works
