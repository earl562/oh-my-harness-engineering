# Anatomy of an Agent Harness

## What It Is

An agentic harness is the runtime system that turns an LLM into an autonomous agent. Without a harness, an LLM is a stateless text generator — it can answer questions but can't read files, run commands, or execute multi-step workflows.

The harness provides: a conversation loop, tools to interact with the world, context management to stay on track, and guardrails to stay safe.

## The 10 Essential Components

### 1. The Agent Loop
The core observe-choose-act cycle. Each turn: send messages to the LLM, receive a response, check if tools were called, execute them, feed results back, repeat. Every harness has this — the quality of implementation determines agent capability.

### 2. Tool System
How the agent interacts with the world. Tools are defined as JSON schemas (name, description, parameters), executed by the harness, and results fed back to the LLM. Good tool design is the #1 lever for agent quality after the model itself.

### 3. Context Management
What the agent remembers across turns. Raw message history grows without bound — production harnesses compress, summarize, or window the history. Aider's repo map and Cursor's codebase index are advanced forms.

### 4. Model Routing
Not every turn needs the same model. Simple questions → cheap/fast model. Complex reasoning → expensive/powerful model. The harness classifies each turn and routes accordingly. Saves 50-80% on costs.

### 5. Provider Abstraction
A gateway layer that normalizes different LLM APIs (OpenAI, Anthropic, local models) behind a single interface. Enables multi-model strategies without changing application code.

### 6. Error Recovery
Agents fail. Tools return errors, models hallucinate, edits break code. The harness detects failures and attempts recovery — retrying, self-correcting, or escalating to the user.

### 7. Security & Permissions
Agents can run arbitrary code. The harness controls what they're allowed to do: tool allowlists, approval flows, sandboxed execution. Without this, agents are a security liability.

### 8. TUI & UX
How the human interacts with the agent. Streaming text, tool call visualization, progress indicators. Good UX builds trust — users who can see what the agent is doing are more comfortable giving it autonomy.

### 9. Eval & Benchmarks
How you measure harness quality. Standard task suites (like SWE-bench) test the full stack — model + harness + tools. Critical for knowing if changes improve or regress quality.

### 10. Memory & Persistence
Session state that survives restarts. Conversation history, learned preferences, project context. Differentiates a tool you use once from an assistant that knows your codebase.

## What Makes a Harness vs Just a Wrapper

A **wrapper** sends prompts to an LLM and returns responses. That's `curl` with a system prompt.

A **harness** adds:
- Tool execution (the agent can DO things, not just talk about them)
- Multi-turn loops (the agent can iterate until the task is done)
- State management (the agent remembers what happened)
- Error handling (the agent recovers from failures)
- Safety controls (the agent is constrained to appropriate actions)

The minimum viable harness is a loop that sends messages, executes tool calls, and feeds results back. Everything else is optimization — but that optimization is the difference between a demo and a production system.

## The Architecture Pattern

```
User Input
    ↓
[System Prompt + Context + History]
    ↓
[LLM Provider] ←→ [Model Router]
    ↓
[Response Parser]
    ↓
[Tool Calls?] → Yes → [Permission Check] → [Tool Execution] → [Results → History] → Loop
    ↓ No
[Text Output → User]
```

Every harness implements this pattern. The differences are in the details: how context is managed, how tools are executed, how errors are handled, how the user interacts.
