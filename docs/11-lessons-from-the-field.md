# Lessons from the Field

## What We Learned

After studying 10 production harnesses and building one from scratch, these are the lessons that weren't obvious going in.

### 1. The Agent SDK Changes Everything
If you're building on Claude, the Agent SDK gives you Claude Code's full runtime as a library: agent loop, tools, context compaction, error recovery, prompt caching, session persistence. Building a custom `claude -p` subprocess wrapper takes weeks — the Agent SDK replaces it in an afternoon with better results.

**Lesson:** Don't build what the platform provides. Use the SDK, then add your unique value on top.

### 2. Tool Design > Tool Count
SWE-agent proved that how you present tools to the LLM matters more than how many tools you have. Structured output, bounded results, helpful error messages — these double task completion rates. A harness with 18 poorly described tools will underperform the same 18 tools with clear names, bounded output, and helpful error messages.

### 3. Compaction Is Table Stakes
Without context compaction, agents die after 15-20 tool-heavy turns. Every production harness implements it. Trigger at 60% capacity, use a cheap model to summarize, protect the last 10 messages. This is not optional for any serious harness.

### 4. Auto-Routing Saves Real Money
Sending everything to opus costs 10x what sonnet costs for the 80% of turns that don't need it. A simple keyword classifier (no LLM call needed) routes correctly 90%+ of the time. Teams report going from $50/day to $12/day with the same quality on complex tasks.

### 5. Permissions Are Not Optional
Running with bypassPermissions during development feels fine — until an agent deletes a git branch or overwrites a config file. Production harnesses need at minimum a tool allowlist. Hooks give you programmatic control. Sandboxing gives you OS-level safety.

### 6. Streaming Is Trust
Users who can see the agent working tolerate 30-second tasks. Users who see nothing for 5 seconds think it's broken. Always stream. Show tool calls. Show progress. This isn't just UX polish — it directly affects whether users give agents enough autonomy to complete tasks.

### 7. The Proxy Pattern Unlocks Legacy Tools
Need a Discord bot and a CLI harness to share the same backend? An OpenAI-compatible proxy in front of the Agent SDK integrates both without modifying either tool. The proxy translates wire formats — the bot speaks one API, the proxy translates to Agent SDK calls. Often under 100 lines of code.

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
