# TUI and UX

## What It Is

The TUI (Terminal User Interface) is how humans interact with the agent. It displays streaming text, tool call progress, model information, and provides input controls. Good UX builds trust — users who see what the agent is doing give it more autonomy.

## Why It Matters

An agent that produces great results but shows no progress feels broken. Users cancel runs that are working fine because they can't see what's happening. Conversely, visible progress and clear status build confidence.

## Key UX Patterns

### Streaming Text
Always stream responses token-by-token. Never buffer the full response and dump it. Users need to see the agent is working.

### Tool Call Visualization
Show what tools are being called and their results:
```
> Reading src/config.ts...
> Running tests... (3/3 passed)
> Editing src/auth.ts (lines 42-56)
```

### Status Bar
Persistent footer showing: current model, agent name, tool count, session state.
```
POLY v0.1.0 │ agent-sdk/claude-sonnet-4-6 │ hermes │ 12 tools
```

### Model Switching
Let users change models mid-conversation without restarting:
```
/model
┌──────────────────┐
│ > auto (current) │
│   sonnet         │
│   opus           │
│   haiku          │
└──────────────────┘
```

### Slash Commands
`/clear` to reset, `/model` to switch, `/compact` to compress history. Discoverable, consistent prefix.

## Framework: Ink (React for Terminal)

Most TypeScript harnesses use Ink — React components that render to the terminal. Familiar patterns (useState, useCallback, components) applied to CLI apps.

```tsx
function StatusBar({ model, agent }) {
  return (
    <Box borderStyle='single'>
      <Text>{model}</Text>
      <Text> │ </Text>
      <Text>{agent}</Text>
    </Box>
  )
}
```

## Common Pitfalls

- **No streaming** — user sees nothing for 30 seconds
- **Wall of text** — no structure, no headers, no formatting
- **Hidden tool calls** — user doesn't know what the agent is doing
- **No abort** — Ctrl+C should always work
- **Stale status** — status bar shows old model after switching

## Checklist

- [ ] Token-by-token streaming
- [ ] Tool call visualization (name, input, result)
- [ ] Persistent status bar (model, agent, tools)
- [ ] Slash commands (/clear, /model, /compact)
- [ ] Ctrl+C abort support
- [ ] Markdown rendering in terminal
