# TUI and UX

## What It Is

The TUI (Terminal User Interface) is how humans interact with terminal-based agents. It displays streaming text, tool call progress, model information, and provides input controls. Good UX builds trust — users who see what the agent is doing give it more autonomy, and **autonomy is where useful work happens.**

## Why It Matters

An agent that produces great results but shows no progress feels broken. Users cancel runs that are working fine because they can't see what's happening. Claude Code ships a custom Ink fork — 251KB of rendering engine for a CLI. That sounds heavy. It's not.

The context window usage bar, cost counter, and model indicator give users an intuitive sense of remaining capacity and cost without requiring them to understand tokenization. When users trust the agent, they give it harder tasks and more time. The TUI is a force multiplier.

## TUI Frameworks for Agent Harnesses

Most terminal-based harnesses are built on one of three rendering frameworks:

### Ink (React for Terminals) — TypeScript

Used by: **Claude Code**, **Cline CLI**

Ink renders React components to the terminal. If you know React (useState, useCallback, JSX), you can build a TUI. Components re-render when state changes, just like a web app.

```tsx
function AgentTUI({ engine }: { engine: AgentEngine }) {
  const [status, setStatus] = useState<'idle' | 'thinking' | 'tool'>('idle')
  const [model, setModel] = useState('sonnet')
  const [tokens, setTokens] = useState({ input: 0, output: 0 })
  const [cost, setCost] = useState(0)

  return (
    <Box flexDirection="column">
      {/* Chat messages */}
      <MessageList messages={engine.getMessages()} />

      {/* Status indicators */}
      {status === 'thinking' && <Spinner label="Thinking..." />}
      {status === 'tool' && <ToolProgress name={currentTool} />}

      {/* Input */}
      <TextInput onSubmit={handleSubmit} placeholder="Type a message..." />

      {/* Status bar (persistent footer) */}
      <Box borderStyle="single" paddingX={1}>
        <Text color="cyan">{model}</Text>
        <Text> | </Text>
        <Text color="green">${cost.toFixed(2)}</Text>
        <Text> | </Text>
        <ContextBar usage={tokens.input} max={200000} />
      </Box>
    </Box>
  )
}
```

**Strengths:** Familiar React patterns, component composition, hooks for state management. Rich ecosystem (ink-spinner, ink-select-input, ink-text-input).

**Weaknesses:** Node.js dependency, heavier than pure terminal libraries. Ink's rendering can flicker on fast updates without careful memoization.

### Bubble Tea — Go

Used by: **OpenCode**, **Goose CLI**

Bubble Tea is the Go equivalent of Ink — a framework for building terminal UIs with an Elm-like architecture (Model-Update-View). OpenCode (95K+ stars) uses it to build a vim-like agent TUI.

```go
type Model struct {
    messages    []Message
    input       textinput.Model
    status      string
    model       string
    viewport    viewport.Model
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        if msg.String() == "enter" {
            return m, submitMessage(m.input.Value())
        }
    case StreamChunkMsg:
        m.messages = append(m.messages, msg.chunk)
        m.viewport.SetContent(renderMessages(m.messages))
    case ToolStartMsg:
        m.status = fmt.Sprintf("Running %s...", msg.toolName)
    }
    return m, nil
}

func (m Model) View() string {
    return lipgloss.JoinVertical(
        lipgloss.Left,
        m.viewport.View(),
        m.statusBar(),
        m.input.View(),
    )
}
```

**Strengths:** Single binary (no runtime), fast startup (OpenCode starts in 4.3ms), Elm architecture prevents state bugs. Lipgloss for styling.

**Weaknesses:** More verbose than React/Ink. Go's type system makes dynamic UI harder. Smaller ecosystem than Ink.

### Ratatui — Rust

Used by: **Goose** (native desktop app), **Claw Code** (Rust rewrite)

Ratatui is the Rust TUI framework. Immediate-mode rendering — you redraw the entire frame each tick. Combined with crossterm for terminal events.

**Strengths:** Maximum performance, memory safety, single binary. Ideal for harnesses that need native speed.

**Weaknesses:** Steepest learning curve. Immediate-mode means you manage all state manually.

### No TUI (Streaming Stdout)

Used by: **Aider**, **SWE-agent**, **Codex CLI** (simple mode)

Some harnesses skip a TUI framework entirely and print directly to stdout with ANSI escape codes. Simpler to build, works everywhere, no framework dependency.

**When to use:** Research harnesses, scripts, CI/CD pipelines, simple interactive tools.

## Key UX Patterns

### 1. Token-by-Token Streaming

Always stream responses as they're generated. Never buffer the full response and dump it. Users who see nothing for 5 seconds think the agent is broken.

```typescript
for await (const event of agentLoop(params)) {
  if (event.type === 'text_delta') {
    process.stdout.write(event.text)  // Immediate output
  }
}
```

### 2. Tool Call Visualization

Show what tools are being called, with what arguments, and their results:

```
> Reading src/config.ts... (245 lines)
> Running npm test... (3/3 passed)
> Editing src/auth.ts (lines 42-56)
  - const timeout = 5000
  + const timeout = config.timeout ?? 5000
```

Claude Code shows tool calls with animated spinners that interpolate from normal to error-red based on stall duration. Diff rendering shows syntax highlighting with word-level change markers.

### 3. Persistent Status Bar

A footer that always shows the agent's current state. Claude Code displays:

```
claude-sonnet-4-6 │ $0.42 │ ████████░░ 62% context │ ⚡ 85% rate limit
```

Components:
- **Model name** — which model is active (updates on routing changes)
- **Cost in USD** — running total for the session
- **Context window usage** — visual bar showing how full the context is
- **Rate limit utilization** — how close to API limits

The context bar gives users an intuitive sense of remaining capacity. When it fills up, they know to wrap up or let the agent compact. No token counting required.

### 4. Model Switching UI

Let users change models mid-conversation without restarting:

```
/model
┌──────────────────────┐
│ > auto   (current)   │
│   sonnet             │
│   opus               │
│   haiku              │
└──────────────────────┘
```

The selection updates the status bar immediately. Message history is preserved — no session restart needed.

### 5. Slash Commands

Discoverable commands with a consistent prefix:

| Command | Action |
|---------|--------|
| `/model` | Switch model |
| `/clear` | Reset conversation |
| `/compact` | Force context compaction |
| `/cost` | Show session cost breakdown |
| `/help` | List available commands |

### 6. Multi-Agent Status Trees

When sub-agents are running, show the hierarchy:

```
Agent: poly (sonnet)
├─ SubAgent: explorer (haiku) — searching for config files...
├─ SubAgent: reviewer (sonnet) — reviewing auth.ts [done]
└─ SubAgent: tester (haiku) — running test suite... (2/5 passed)
```

Claude Code displays this as a real-time updating tree. Each sub-agent's status updates independently.

### 7. Diff Rendering

For file edits, show syntax-highlighted diffs with context:

```diff
  src/auth.ts (lines 40-45):
  40 │ function authenticate(token: string) {
  41 │   const decoded = jwt.verify(token, SECRET)
- 42 │   const timeout = 5000
+ 42 │   const timeout = config.timeout ?? 5000
  43 │   return { user: decoded.sub, expires: timeout }
  44 │ }
```

Three lines of context above and below the change. Word-level highlighting (not just line-level) shows exactly what changed within a line.

### 8. Themes and Accessibility

Claude Code ships 6 themes including **color-blind friendly** options. The TUI should never rely solely on color to convey information — use icons, labels, or position as secondary indicators.

## IDE Agent UX Patterns (Different Constraints)

IDE agents (Cursor, Windsurf, Cline, Trae, Kiro) operate within the editor's UX framework. Key differences from terminal agents:

| Constraint | Terminal Agent | IDE Agent |
|-----------|---------------|-----------|
| **Rendering** | Full-screen TUI or stdout | Sidebar panel, inline widgets |
| **Input** | Text input with slash commands | Chat panel + @-mentions + inline prompts |
| **File edits** | Diff in terminal or in-place | Native editor diff view with accept/reject |
| **Context** | Repo map or search tools | Full codebase index + open files + cursor position |
| **Tool calls** | Printed to terminal | Shown in activity panel or notifications |
| **Trust** | Status bar + permission prompts | Diff review + undo integration |

Cursor's **@-mention system** is the IDE equivalent of slash commands: `@file`, `@codebase`, `@docs`, `@web`. Cline's **diff-before-apply** approach shows proposed changes in the editor's native diff view for approval.

Kiro's **spec-driven UX** is unique: the agent generates a spec document, the user reviews and edits the spec in the IDE, then the agent generates code from the approved spec. Planning and coding happen in different UI modes.

## Common Pitfalls

- **No streaming** — user sees nothing for 30 seconds
- **Wall of text** — no structure, no headers, no formatting
- **Hidden tool calls** — user doesn't know what the agent is doing
- **No abort** — Ctrl+C should always work
- **Stale status** — status bar shows old model after switching
- **No cost visibility** — user doesn't know they've spent $15 until the session ends
- **Ignoring accessibility** — color-only indicators fail for color-blind users
- **No markdown rendering** — agent outputs markdown but terminal shows raw `**bold**` text

## Checklist

- [ ] Token-by-token streaming (never buffer full responses)
- [ ] Tool call visualization (name, input summary, result preview)
- [ ] Persistent status bar (model, cost, context usage, rate limit)
- [ ] Slash commands (/clear, /model, /compact, /help)
- [ ] Ctrl+C abort support (AbortSignal propagation)
- [ ] Diff rendering for file edits (syntax highlighted, with context)
- [ ] Cost tracking visible to user (running total in USD)
- [ ] Context window usage indicator (visual bar or percentage)
- [ ] Markdown rendering in terminal
- [ ] Color-blind friendly themes
- [ ] Multi-agent status display (if supporting sub-agents)
- [ ] Model switching UI (mid-conversation without restart)

## Further Reading

- [Ink (React for Terminals)](https://github.com/vadimdemedes/ink) — TypeScript TUI framework
- [Bubble Tea](https://github.com/charmbracelet/bubbletea) — Go TUI framework (used by OpenCode)
- [Lipgloss](https://github.com/charmbracelet/lipgloss) — Go terminal styling
- [Ratatui](https://github.com/ratatui/ratatui) — Rust TUI framework
- [Case Study: Claude Code Architecture](../case-studies/claude-code-architecture-deep-dive.md) — 251KB Ink-based rendering engine
