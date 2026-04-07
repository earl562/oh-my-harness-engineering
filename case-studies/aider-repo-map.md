# Aider: Repo Map — Codebase Awareness Without Reading Every File

## The Problem

A coding agent asked to "add a feature to the User model" needs to know where the User model is defined, what fields it has, what other files reference it, and what conventions the codebase follows. The naive approach: read every relevant file into context. But that consumes thousands of tokens and hits context limits fast.

How do you give an agent codebase awareness without reading every file?

## The Approach

Aider generates a **repo map** — a compact, structured summary of the entire codebase created by parsing source files with tree-sitter. The map shows the skeleton of every file: module names, class definitions, function signatures, and import relationships — without the implementation details.

### What a Repo Map Looks Like

For a project with 50 files, the repo map might be 2,000 tokens (vs 50,000+ tokens to read all files):

```
src/models/user.ts
  class User
    constructor(id: string, email: string, name: string)
    async save(): Promise<void>
    static async findById(id: string): Promise<User | null>
    static async findByEmail(email: string): Promise<User | null>

src/models/post.ts
  class Post
    constructor(id: string, authorId: string, title: string, body: string)
    async save(): Promise<void>
    getAuthor(): Promise<User>

src/routes/users.ts
  async function getUser(req, res)
  async function createUser(req, res)
  async function updateUser(req, res)

src/routes/posts.ts
  async function listPosts(req, res)
  async function createPost(req, res)
```

The agent can see the full structure at a glance: User has `findById` and `findByEmail`, Post references User via `getAuthor()`, routes map to CRUD operations. This is enough to know which files to read in full for any given task.

### How Tree-Sitter Parsing Works

Tree-sitter parses source code into a concrete syntax tree (CST). Aider walks this tree to extract:
1. **Definitions** — classes, functions, methods, type aliases
2. **Signatures** — parameter names and types (not bodies)
3. **References** — which symbols from other files are used (via imports)

This works across languages because tree-sitter has grammars for 100+ languages. The repo map for a Python file and a TypeScript file use the same extraction logic with language-specific grammars.

### The Two-Pass Strategy

Aider uses the repo map in a two-pass approach:

**Pass 1: Orientation** — The agent receives the repo map plus the user's request. Based on the map, the agent identifies which files are relevant and requests them.

**Pass 2: Editing** — The agent receives the full content of the relevant files and makes its edits. The repo map stays in context as a reference for navigating to other files if needed.

This means the agent reads 3-5 files instead of 50, using 10-20% of the tokens.

## Why It Works

1. **Token efficiency** — the repo map is 5-10% the size of reading all files. For a 100-file project, that's the difference between fitting in context and not.

2. **Structural awareness** — the agent knows about files it hasn't read. "The UserService calls User.findById()" is visible in the map even if the agent hasn't read either file yet.

3. **Import graph** — the map reveals dependencies. If the agent needs to change User, it can see which other files reference User and might need updates.

4. **Language-agnostic** — tree-sitter grammars handle Python, TypeScript, Java, Go, Rust, and dozens more. The same map concept works across all of them.

5. **Incremental updates** — the map only needs to be regenerated when files change. During a session, it's computed once and stays in context.

## Trade-offs

**No implementation details** — the map shows that `User.save()` exists but not how it works. If the agent needs to understand the implementation, it still has to read the file. The map is an index, not a substitute for reading.

**Large monorepos** — a 10,000-file repo produces a huge map. Aider handles this by ranking files by relevance to the current task and truncating the map to fit the context budget.

**Dynamic languages** — tree-sitter parses syntax, not runtime behavior. In JavaScript, a method added via `Object.assign` or monkey-patching won't appear in the map.

**Setup cost** — first-time parsing of a large repo takes a few seconds. Not an issue for interactive use, but adds latency to cold starts.

## Lessons for Your Harness

1. **Don't read files you don't need.** A structural overview (map) lets the agent choose which files to read. This is the single biggest context optimization available.

2. **Tree-sitter is your friend.** It's battle-tested, fast, and supports every major language. Use it for codebase understanding, not regex.

3. **Show relationships, not just names.** A flat file list is less useful than showing which files reference which. Import relationships guide the agent to impact analysis.

4. **Budget the map.** For large repos, rank files by relevance to the current task. The map should be a fixed percentage of your context budget (5-15%).

5. **Consider codebase indexing as the next step.** Aider's map is static text. Cursor goes further with vector embeddings for semantic search. The map is the minimum viable approach; indexing is the production version.
