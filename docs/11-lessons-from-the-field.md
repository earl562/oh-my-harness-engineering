# Lessons from the Field

## What We Learned

After studying 10 production harnesses and building one from scratch, these are the lessons that weren't obvious going in.

### 1. The Agent SDK Changes Everything
If you're building on Claude, the Agent SDK gives you Claude Code's full runtime as a library: agent loop, tools, context compaction, error recovery, prompt caching, session persistence. We spent weeks building a custom `claude -p` subprocess wrapper — the Agent SDK replaced it in an afternoon with better results.

**Lesson:** Don't build what the platform provides. Use the SDK, then add your unique value on top.

### 2. Tool Design > Tool Count
SWE-agent proved that how you present tools to the LLM matters more than how many tools you have. Structured output, bounded results, helpful error messages — these double task completion rates. We had 18 tools and mediocre results. Better descriptions on the same 18 tools improved everything.

### 3. Compaction Is Table Stakes
Without context compaction, agents die after 15-20 tool-heavy turns. Every production harness implements it. Trigger at 60% capacity, use a cheap model to summarize, protect the last 10 messages. This is not optional for any serious harness.

### 4. Auto-Routing Saves Real Money
Sending everything to opus costs 10x what sonnet costs for the 80% of turns that don't need it. A simple keyword classifier (no LLM call needed) routes correctly 90%+ of the time. We went from $50/day to $12/day with the same quality on complex tasks.

### 5. Permissions Are Not Optional
We ran with bypassPermissions for weeks during development. It was fine until an agent deleted a git branch. Production harnesses need at minimum a tool allowlist. Hooks give you programmatic control. Sandboxing gives you OS-level safety.

### 6. Streaming Is Trust
Users who can see the agent working tolerate 30-second tasks. Users who see nothing for 5 seconds think it's broken. Always stream. Show tool calls. Show progress. This isn't just UX polish — it directly affects whether users give agents enough autonomy to complete tasks.

### 7. The Proxy Pattern Unlocks Legacy Tools
We needed our Discord bot (Hermes) to use the same backend as our CLI harness (Poly). An OpenAI-compatible proxy in front of the Agent SDK let us integrate without modifying either tool. The proxy translates wire formats — Hermes speaks Anthropic Messages API, the proxy translates to Agent SDK calls. 60 lines of Python.

### 8. Multi-Agent > One Agent
Different tasks need different tools and system prompts. A personal assistant agent needs calendar and notes. A coding agent needs file editing and bash. A business agent needs CRM and email. One system prompt can't do all three well. Split into focused agents with the right tools for their domain.

## Where Harnesses Are Heading

1. **SDK-native harnesses** — building on Agent SDK / Codex SDK rather than from scratch
2. **Multi-model orchestration** — different models for different subtasks within a single workflow
3. **Background agents** — long-running tasks that report back when done (Cursor's background agents, Devin)
4. **Codebase-aware context** — tree-sitter indexing, embeddings, semantic search as standard
5. **Eval-driven development** — harness changes tested against benchmark suites before merge

## The Thesis, Revisited

The model isn't the moat. GPT-4, Claude, Gemini — they're all good enough for most tasks. What makes the difference is:
- How you present tools to the model
- How you manage context across turns
- How you recover from errors
- How you route to the right model
- How you present results to the user

That's the harness. That's the moat.
