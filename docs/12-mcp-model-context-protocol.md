# MCP: Model Context Protocol

## What It Is

Model Context Protocol (MCP) is an open standard that defines how AI agents discover and invoke external capabilities — tools, data sources, and prompts — through a vendor-neutral JSON-RPC interface. Think of it as USB-C for AI agents: instead of every harness building a custom integration for every external service, any MCP-compliant host can connect to any MCP-compliant server.

Anthropic introduced MCP in November 2024. It has since been adopted by Claude Code, Cursor, Goose, Cline, Continue, and dozens of third-party integrations.

## Who Created It and Why

Anthropic open-sourced MCP to solve a proliferation problem. Every AI harness was re-implementing the same integrations (GitHub, Slack, databases, file systems) with incompatible schemas and no composability. By standardizing the protocol, Anthropic enabled a marketplace: build an MCP server once, and it works with every compliant harness.

The protocol specification lives at [modelcontextprotocol.io](https://modelcontextprotocol.io) and the reference implementations are MIT-licensed on GitHub.

## Protocol Architecture

MCP is a client-server protocol over stdio or HTTP with Server-Sent Events:

```
[Harness (MCP Host)]
    ↓ spawns or connects to
[MCP Client] ←→ [MCP Server] (one per integration)
    ↓ exposes
[Tools / Resources / Prompts]
```

### The Three Primitives

**Tools** — functions the LLM can invoke (same as standard tool calling, but discovery is dynamic):
```json
{
  "name": "github_create_issue",
  "description": "Create a GitHub issue in a repository",
  "inputSchema": {
    "type": "object",
    "properties": {
      "repo": { "type": "string" },
      "title": { "type": "string" },
      "body": { "type": "string" }
    },
    "required": ["repo", "title"]
  }
}
```

**Resources** — read-only data the LLM can access (files, database records, API responses). Resources have URIs:
```
mcp://github/repos/owner/repo/issues/42
mcp://postgres/tables/users/rows?limit=100
```

**Prompts** — pre-built prompt templates the server exposes. The agent can invoke them by name with arguments, getting back a structured prompt to inject into context.

### Transport Options

| Transport | Use Case |
|-----------|----------|
| stdio | Local servers spawned as subprocesses (default) |
| HTTP + SSE | Remote servers, shared team infrastructure |
| WebSocket | Bidirectional streaming (emerging) |

## How It Changes Tool Design

Before MCP, harness tool schemas were static — compiled into the binary, requiring a code change to add or update. With MCP:

1. **Dynamic discovery** — the host calls `tools/list` on startup and gets the current schema. No redeployment needed when a tool changes.
2. **Server-side versioning** — breaking tool changes can be versioned at the server level without harness changes.
3. **Namespace isolation** — tools from different servers are namespaced (`github_`, `slack_`, `postgres_`) so the LLM understands provenance.
4. **Permission delegation** — the MCP host can require per-server approval, separate from built-in tool permissions.

The implication for harness design: your tool dispatch layer needs to support dynamic registration. Static tool arrays don't cut it.

```typescript
// Before MCP: static registration
const tools: Tool[] = [githubTool, slackTool, postgresTool]

// With MCP: dynamic registration from servers
const mcpTools = await Promise.all(
  mcpServers.map(server => server.listTools())
)
const tools = [...builtinTools, ...mcpTools.flat()]
```

## Which Harnesses Support MCP

| Harness | MCP Support | Notes |
|---------|------------|-------|
| **Goose** | Native (first-class) | MCP is Goose's primary extension mechanism; all capabilities are MCP servers |
| **Claude Code** | Native | Built-in MCP host; project-level and user-level server config |
| **Cline** | Native | VSCode extension installs and manages MCP servers |
| **Continue** | Native | MCP servers as context providers |
| **Cursor** | Emerging | Added in recent versions; configuration via `cursor-mcp.json` |
| **OpenHands** | Partial | Community plugins; not first-class |
| **Aider** | None | No MCP support as of early 2025 |

## The Plugin Ecosystem Effect

MCP has triggered a Cambrian explosion of integrations. Notable MCP servers as of early 2025:

**Development tools:**
- `mcp-server-github` — issues, PRs, code search
- `mcp-server-git` — local git operations
- `mcp-server-filesystem` — controlled file system access
- `mcp-server-postgres` — query and inspect databases
- `mcp-server-puppeteer` — browser automation

**Productivity:**
- `mcp-server-slack` — send messages, read channels
- `mcp-server-google-drive` — read/write docs and sheets
- `mcp-server-notion` — read/write Notion pages

**Data and search:**
- `mcp-server-brave-search` — web search
- `mcp-server-memory` — persistent key-value store between sessions

The [MCP servers registry](https://github.com/modelcontextprotocol/servers) lists 200+ community servers.

## Goose: MCP-First Architecture

Block's Goose harness is the clearest example of MCP-first design. Every capability in Goose — file editing, shell execution, web search — is implemented as an MCP server called a "toolkit." The core harness is intentionally minimal; all domain capability comes through MCP.

This means:
- Adding a new capability never requires changing the core
- Teams can build internal toolkits and share them without forking Goose
- Toolkits can be versioned and updated independently

The tradeoff: startup latency (spawning N servers) and complexity (N processes to debug instead of 1).

## Security Considerations with MCP

MCP introduces a new attack surface:

- **Prompt injection via tool results** — a malicious MCP server could return tool results that hijack the agent's behavior
- **Server impersonation** — without verification, a compromised server claims to be a trusted one
- **Capability creep** — users install MCP servers without understanding their full tool surface

Current mitigations in well-designed hosts:
- Per-server tool approval on first use
- Tool allowlists at the host level
- Server provenance checking (signed manifests, in emerging standards)
- Sandboxed server processes

## Resources

- [MCP Specification](https://modelcontextprotocol.io/specification) — official protocol spec
- [MCP Servers Registry](https://github.com/modelcontextprotocol/servers) — community server index
- [Claude Code MCP Docs](https://docs.anthropic.com/en/docs/claude-code/mcp) — how Claude Code configures MCP
- [Goose MCP Architecture](https://block.github.io/goose/docs/concepts/toolkits) — MCP-first harness design
- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol) — original Nov 2024 announcement
