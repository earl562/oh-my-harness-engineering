# Cursor: Codebase Indexing — How IDE Agents Get Context Advantages

## The Problem

Terminal agents operate in a codebase they discover file-by-file. Every file read costs tokens. Every wrong file read wastes a turn. When a developer says "find the authentication middleware and add rate limiting," a terminal agent has to: glob for files, grep for keywords, read candidates, and hope it found the right ones.

An IDE agent has a potential advantage: it can index the entire codebase ahead of time and retrieve exactly the right context for any query. But how do you build that index, keep it fresh, and make retrieval useful to an LLM?

## The Approach

Cursor (Anysphere) combines two indexing strategies: **tree-sitter structural analysis** (like Aider's repo map, but persistent) and **vector embeddings** (semantic search over code chunks). Together, they give the agent both structural and semantic understanding of the codebase.

### The Indexing Pipeline

```
[File change detected]
    ↓
[Tree-sitter parse] → structural index (classes, functions, imports)
    ↓
[Chunking] → split files into semantically coherent chunks (function-level)
    ↓
[Embedding model] → vector embeddings per chunk
    ↓
[Vector store] → local index (persisted between sessions)
```

When the agent needs context for a task:

```
[User prompt + current file]
    ↓
[Query embedding] → semantic search against vector store
    ↓
[Top-K relevant chunks] → injected into LLM context
    ↓
[Structural context] → related definitions and references from tree-sitter index
    ↓
[Agent has rich, relevant context without reading every file]
```

### @-Mention Context

Cursor's UX innovation: users can explicitly pull context with `@` references:
- `@file:src/auth.ts` — include this file
- `@folder:src/middleware/` — include all files in this directory
- `@codebase` — search the full index for relevant context
- `@docs` — search documentation
- `@web` — search the web

The `@codebase` command triggers the full semantic search pipeline. The others are explicit context injection — the user knows what's relevant and tells the agent directly.

### Incremental Updates

The index must stay fresh as the user edits code. Cursor handles this with:
1. **File watcher** — detects changes as the user saves or git pulls
2. **Incremental re-parsing** — only re-parse changed files (tree-sitter supports incremental parsing)
3. **Chunk invalidation** — only re-embed chunks that changed
4. **Background processing** — indexing runs in a separate thread, never blocks the editor

For a 10,000-file repo, initial indexing takes 30-60 seconds. Subsequent updates process in milliseconds.

## Why It Works

1. **Retrieval precision** — semantic search finds relevant code by meaning, not just keywords. "Authentication middleware" finds `verifyToken()` even if those exact words don't appear in the code.

2. **Zero-shot codebase understanding** — the agent can answer questions about any part of the codebase without the user guiding it to the right files. This is the key advantage over terminal agents.

3. **Token efficiency** — instead of reading 20 files looking for the right one, the agent gets the 3-5 most relevant chunks directly. Similar token savings to Aider's repo map, but with higher precision.

4. **IDE context** — the editor knows which file is open, what's selected, what was recently edited. This contextual signal is unavailable to terminal agents and dramatically improves relevance ranking.

5. **Multi-modal context** — the agent sees the user's cursor position, open tabs, terminal output, and git state. All of this informs what context is relevant to the current task.

## Trade-offs

**IDE lock-in** — the indexing infrastructure is tightly coupled to the editor. Terminal agents and web agents can't easily replicate this without their own index-building step.

**Index freshness** — there's always a small window where the index is stale after a file change. For rapidly changing codebases, this can cause the agent to retrieve outdated definitions.

**Embedding quality** — code embedding models are improving but still imperfect. Semantically similar code in different paradigms (OOP vs functional) may not be close in embedding space.

**Storage cost** — vector embeddings for a large codebase require significant local storage (100-500MB for a 10K-file repo). Not an issue on developer machines, but matters for cloud environments.

**Privacy** — embedding the codebase requires either a local embedding model (slower, less accurate) or sending code to an external API. Enterprise users with sensitive code need the local option.

## Lessons for Your Harness

1. **Pre-index when possible.** If your harness runs in a persistent environment (IDE, long-running process), build an index at startup and keep it fresh. The upfront cost pays for itself within 2-3 queries.

2. **Combine structural and semantic search.** Tree-sitter gives you precise definitions ("where is this function?"). Embeddings give you fuzzy matching ("what's related to authentication?"). Neither alone is sufficient.

3. **Use explicit context injection as an escape hatch.** The `@file` and `@folder` patterns let users override the retrieval system when they know exactly what context is needed. Don't force users through semantic search for everything.

4. **IDE context is a moat.** Terminal agents should consider building a lightweight context-gathering step that mimics some of this: current directory, recently modified files, git status, open PR description. It's not as rich as IDE context but it's better than nothing.

5. **Local-first for enterprise.** If you target enterprise users, the indexing pipeline must work entirely offline. Use a local embedding model (like `nomic-embed-text` via Ollama) rather than requiring API calls.
