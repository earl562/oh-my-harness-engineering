# Provider Abstraction

## What It Is

A provider abstraction layer normalizes different LLM APIs behind a single interface. Your harness code calls `provider.chat()` — it doesn't care if the backend is OpenAI, Anthropic, a local model, or the Agent SDK. This is the gateway pattern that makes multi-model strategies possible without changing application code.

## Why It Matters

Without a provider abstraction, every model switch requires changing application code. With it:
- **Model routing** works — the router picks a provider/model pair, the loop doesn't know or care
- **Fallback chains** work — if one provider is down, fail over to another
- **Cost optimization** works — route cheap tasks to cheap providers automatically
- **Testing** works — swap in a mock provider without changing the loop

## The Interface

The core contract every provider implements:

```typescript
interface LLMProvider {
  readonly name: ProviderName
  chat(params: ChatParams): AsyncGenerator<StreamChunk>
  listModels(): Promise<string[]>
  ping(): Promise<boolean>
}

type ChatParams = {
  model: string
  messages: Message[]
  tools?: ToolSchema[]
  maxTokens?: number
  temperature?: number
  signal?: AbortSignal
}

type StreamChunk =
  | { type: 'text'; text: string }
  | { type: 'tool_call'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'stop'; reason: 'end_turn' | 'tool_use' | 'max_tokens' }
  | { type: 'usage'; inputTokens: number; outputTokens: number }
```

Three things are non-negotiable in this interface:

1. **Async generator streaming** — not callbacks, not promises. The generator pattern lets the agent loop consume chunks as they arrive while maintaining backpressure.

2. **Unified chunk types** — all providers normalize to the same 4 chunk types regardless of their native format. The loop never sees provider-specific data structures.

3. **Usage events** — every provider must emit token counts. Without this, cost tracking is impossible.

## Provider Types

| Type | Examples | How It Works | Implementation Effort |
|------|---------|-------------|----------------------|
| **OpenAI-compat** | OpenRouter, vLLM, llama.cpp, Ollama, Together, Groq | SSE streaming, standard chat completions API | Low — one shared handler covers all |
| **Anthropic native** | Claude API direct | Messages API with content blocks | Medium — different message format |
| **CLI wrapper** | `claude -p`, `gemini` | Spawns subprocess, parses stdout | Medium — process management complexity |
| **Agent SDK** | Anthropic Agent SDK, OpenAI Agents SDK | Native library with built-in tools | Low — but gives up control |
| **Google native** | Gemini API | GenerateContent with streaming | Medium — different tool call format |

## The OpenAI-Compatible Shortcut

~80% of LLM providers implement the OpenAI chat completions API. A single streaming handler covers all of them:

```typescript
async function* openAICompatChat(
  baseUrl: string,
  apiKey: string,
  params: ChatParams
): AsyncGenerator<StreamChunk> {
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      tools: params.tools,
      stream: true,
    }),
    signal: params.signal,
  })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  // Tool call accumulation (streamed across multiple chunks)
  const toolCallBuffers = new Map<number, { id: string; name: string; args: string }>()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return

      const chunk = JSON.parse(data)
      const delta = chunk.choices?.[0]?.delta

      // Text content
      if (delta?.content) {
        yield { type: 'text', text: delta.content }
      }

      // Tool calls (streamed incrementally)
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (tc.id) {
            toolCallBuffers.set(tc.index, { id: tc.id, name: tc.function?.name ?? '', args: '' })
          }
          const buf = toolCallBuffers.get(tc.index)
          if (buf && tc.function?.arguments) {
            buf.args += tc.function.arguments
          }
        }
      }

      // Usage (in final chunk)
      if (chunk.usage) {
        yield {
          type: 'usage',
          inputTokens: chunk.usage.prompt_tokens,
          outputTokens: chunk.usage.completion_tokens,
        }
      }

      // Stop
      if (chunk.choices?.[0]?.finish_reason) {
        // Emit accumulated tool calls
        for (const [_, buf] of toolCallBuffers) {
          yield {
            type: 'tool_call',
            id: buf.id,
            name: buf.name,
            input: JSON.parse(buf.args || '{}'),
          }
        }
        yield { type: 'stop', reason: mapStopReason(chunk.choices[0].finish_reason) }
      }
    }
  }
}
```

This single function handles: Ollama, OpenRouter, vLLM, llama.cpp, Groq, Together, Fireworks, and any other OpenAI-compatible endpoint. The tool call accumulation is the tricky part — tool arguments are streamed across multiple SSE chunks and must be buffered until complete.

## The Registry Pattern

Providers are registered at startup via a factory that reads configuration:

```typescript
type ProviderName = 'ollama' | 'openai' | 'anthropic' | 'google' | 'openrouter'
  | 'llamacpp' | 'vllm' | 'nim' | 'claude-cli' | 'agent-sdk' | 'custom'

type RegistryConfig = {
  ollamaBaseUrl?: string | null   // null = skip Ollama registration
  providers?: ProviderConfig[]
}

function createRegistry(config: RegistryConfig = {}): Registry {
  const store = new Map<ProviderName, LLMProvider>()

  // Always register Ollama unless explicitly disabled
  if (config.ollamaBaseUrl !== null) {
    store.set('ollama', new OllamaProvider(config.ollamaBaseUrl ?? 'http://localhost:11434'))
  }

  // Register additional providers from config
  for (const cfg of config.providers ?? []) {
    store.set(cfg.name, instantiateProvider(cfg))
  }

  return {
    getProvider(name: ProviderName): LLMProvider | undefined {
      return store.get(name)
    },
    getAllProviders(): LLMProvider[] {
      return Array.from(store.values())
    },
    providerNames(): ProviderName[] {
      return Array.from(store.keys())
    },
  }
}

function instantiateProvider(cfg: ProviderConfig): LLMProvider {
  // Most providers reuse the OpenAI-compatible handler
  switch (cfg.name) {
    case 'ollama':
      return new OllamaProvider(cfg.baseUrl)
    case 'llamacpp':
    case 'vllm':
    case 'openrouter':
    case 'groq':
    case 'together':
      return createOpenAICompatProvider(cfg)  // Same handler, different baseUrl/apiKey
    case 'anthropic':
      return new AnthropicProvider(cfg.apiKey)
    case 'claude-cli':
      return new ClaudeCliProvider()  // Spawns subprocess
    case 'agent-sdk':
      return new AgentSdkProvider()
    default:
      return createOpenAICompatProvider(cfg)  // Assume OpenAI-compat for unknown providers
  }
}
```

The registry is immutable after creation — no providers are added or removed during a session. This prevents race conditions and makes the provider set predictable.

## Model String Parsing

Users specify models as `provider/model` strings. The harness must parse these:

```typescript
function parseModelString(input: string): { providerName: ProviderName | null; modelId: string } {
  const knownPrefixes = ['ollama', 'openai', 'anthropic', 'openrouter', 'google']
  const slashIndex = input.indexOf('/')

  if (slashIndex === -1) {
    return { providerName: null, modelId: input }
  }

  const prefix = input.slice(0, slashIndex)
  if (knownPrefixes.includes(prefix)) {
    return { providerName: prefix as ProviderName, modelId: input.slice(slashIndex + 1) }
  }

  // Not a known provider prefix — treat entire string as model ID
  // (handles "meta-llama/Llama-3.3-70B" where "meta-llama" is a model org, not a provider)
  return { providerName: null, modelId: input }
}

// Examples:
// "openrouter/qwen-plus"         → { providerName: "openrouter", modelId: "qwen-plus" }
// "ollama/llama3.2"              → { providerName: "ollama", modelId: "llama3.2" }
// "claude-sonnet-4-6"            → { providerName: null, modelId: "claude-sonnet-4-6" }
// "meta-llama/Llama-3.3-70B"    → { providerName: null, modelId: "meta-llama/Llama-3.3-70B" }
```

When `providerName` is null, the harness falls back to the default provider from config.

## Provider Wrappers

Wrappers add cross-cutting concerns without modifying providers:

### Token Tracking Wrapper
```typescript
function createTrackingProvider(
  inner: LLMProvider,
  onUsage: (inputTokens: number, outputTokens: number) => void
): LLMProvider {
  return {
    name: inner.name,
    async *chat(params) {
      for await (const chunk of inner.chat(params)) {
        if (chunk.type === 'usage') {
          onUsage(chunk.inputTokens, chunk.outputTokens)
        }
        yield chunk
      }
    },
    listModels: () => inner.listModels(),
    ping: () => inner.ping(),
  }
}
```

### Cost Estimation
```typescript
const COST_PER_INPUT_TOKEN: Record<string, number> = {
  'claude-sonnet-4-6': 3e-6,
  'claude-haiku-4-5': 0.8e-6,
  'claude-opus-4-6': 15e-6,
  'gpt-4o': 2.5e-6,
}
// Output tokens typically cost 3-5× input tokens
```

### Retry Wrapper
```typescript
function createRetryProvider(inner: LLMProvider, maxRetries = 3): LLMProvider {
  return {
    name: inner.name,
    async *chat(params) {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          yield* inner.chat(params)
          return
        } catch (err) {
          if (attempt === maxRetries) throw err
          if (!isRetryable(err)) throw err
          await sleep(1000 * Math.pow(2, attempt))
        }
      }
    },
    listModels: () => inner.listModels(),
    ping: () => inner.ping(),
  }
}
```

Wrappers compose: `createRetryProvider(createTrackingProvider(baseProvider, onUsage), 3)`.

## The Agent SDK as Meta-Provider

The Agent SDK (Anthropic) and Agents SDK (OpenAI) are special — they're not just LLM providers, they're complete agent runtimes with built-in tools, context compaction, error recovery, and session persistence. Wrapping them as a provider gives you the full Claude Code or Codex engine inside your harness:

```typescript
class AgentSdkProvider implements LLMProvider {
  readonly name = 'agent-sdk'

  async *chat(params: ChatParams): AsyncGenerator<StreamChunk> {
    for await (const msg of query({
      prompt: params.messages.map(m => m.content).join('\n'),
      options: {
        model: params.model,
        allowedTools: ['Read', 'Edit', 'Bash'],
      }
    })) {
      if (msg.type === 'assistant') {
        yield { type: 'text', text: msg.content }
      }
      if (msg.type === 'result') {
        yield { type: 'usage', inputTokens: msg.usage.input, outputTokens: msg.usage.output }
        yield { type: 'stop', reason: 'end_turn' }
      }
    }
  }

  async listModels() { return ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5'] }
  async ping() { return true }
}
```

The trade-off: you get Claude Code's full engine for free, but you lose control over tool execution, compaction strategy, and the inner loop. It's a provider that's also a harness.

## Configuration Hierarchy

Provider config should load from multiple sources with clear priority:

```
Built-in defaults           ← lowest priority
  ↓
~/.myharness/config.json    ← global user config
  ↓
.myharness/config.json      ← project-local config
  ↓
Environment variables       ← highest priority
```

```typescript
type HarnessConfig = {
  defaultProvider: string     // "anthropic"
  defaultModel: string        // "claude-sonnet-4-6"
  providers: Record<string, {
    baseUrl?: string
    apiKey?: string           // or use env var
  }>
}
```

Environment variables override file config: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`. Never store API keys in config files that might be committed.

## How Many Providers Do You Need?

For a personal harness: **one** (your main provider) is fine. Don't over-engineer.

For a production harness serving multiple users:

| Must have | Nice to have | Overkill for most |
|-----------|-------------|-------------------|
| One cloud provider (Anthropic or OpenAI) | Ollama (local/privacy) | 10+ providers |
| | OpenRouter (fallback / model variety) | Custom provider for every API |
| | One fast/cheap provider (Groq) | |

OpenCode supports 75+ providers. For most harnesses, 3-4 is the sweet spot.

## Checklist

- [ ] Single `LLMProvider` interface for all backends
- [ ] Async generator streaming (not callbacks or promises)
- [ ] OpenAI-compatible handler covering 80% of providers
- [ ] Provider registry with lookup by name
- [ ] Model string parsing (`provider/model` format)
- [ ] Token usage events from every provider
- [ ] Tracking wrapper for cost accounting
- [ ] Retry wrapper with exponential backoff
- [ ] Configuration hierarchy (defaults → global → project → env)
- [ ] API keys from environment variables, never hardcoded

## Further Reading

- [Model Routing](05-model-routing.md) — using the registry to route by task complexity
- [Build Your First Harness](build-your-first-harness.md) — implements a minimal provider
- [MCP: Model Context Protocol](12-mcp-model-context-protocol.md) — dynamic tool providers via MCP
