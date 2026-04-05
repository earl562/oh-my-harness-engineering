# Provider Abstraction

## What It Is

A provider abstraction layer normalizes different LLM APIs behind a single interface. Your harness code calls `provider.chat()` — it doesn't care if the backend is OpenAI, Anthropic, a local model, or the Agent SDK.

## The Interface

```typescript
interface LLMProvider {
  readonly name: string
  chat(params: ChatParams): AsyncGenerator<StreamChunk>
  listModels(): Promise<string[]>
  ping(): Promise<boolean>
}

type StreamChunk =
  | { type: 'text'; text: string }
  | { type: 'tool_call'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'stop'; reason: 'end_turn' | 'tool_use' | 'max_tokens' }
  | { type: 'usage'; inputTokens: number; outputTokens: number }
```

All providers implement this interface. The agent loop, TUI, and routing layer only depend on `LLMProvider` — never on provider-specific code.

## Provider Types

| Type | Example | How It Works |
|------|---------|-------------|
| **OpenAI-compat** | OpenRouter, vLLM, llama.cpp | SSE streaming, standard chat completions |
| **Anthropic native** | Claude API | Messages API with content blocks |
| **CLI wrapper** | claude-cli | Spawns `claude -p` subprocess |
| **Agent SDK** | @anthropic-ai/claude-agent-sdk | Native library with built-in tools |
| **Local** | Ollama | OpenAI-compat on localhost |

## The Agent SDK as Meta-Provider

The Agent SDK is special — it's not just an LLM provider, it's a complete agent runtime. It includes built-in tools, context compaction, error recovery, and session persistence. Using it as a provider gives you Claude Code's full engine inside your harness.

```typescript
// Agent SDK provider — native Claude Code engine
import { query } from '@anthropic-ai/claude-agent-sdk'

class AgentSdkProvider implements LLMProvider {
  async *chat(params: ChatParams): AsyncGenerator<StreamChunk> {
    for await (const msg of query({
      prompt: params.messages.map(m => m.content).join('\n'),
      options: { model: params.model, allowedTools: ['Read', 'Edit', 'Bash'] }
    })) {
      if (msg.type === 'assistant') { /* yield text chunks */ }
      if (msg.type === 'result') { /* yield usage + stop */ }
    }
  }
}
```

## Registry Pattern

```typescript
function createRegistry(config): Registry {
  const store = new Map<string, LLMProvider>()
  store.set('ollama', new OllamaProvider())
  store.set('openrouter', new OpenRouterProvider())
  store.set('agent-sdk', new AgentSdkProvider())
  return { getProvider: (name) => store.get(name) }
}
```

## Checklist

- [ ] Single `LLMProvider` interface for all backends
- [ ] Async generator streaming (not callbacks)
- [ ] Provider registry with lookup by name
- [ ] Model string parsing (`provider/model` format)
- [ ] Auth normalization (API key, OAuth, none)
