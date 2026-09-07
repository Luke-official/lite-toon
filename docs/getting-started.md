# Getting Started

Get the lite-toon **TaskFlow** demo running locally in under 5 minutes.

> **Project status:** Fully supported today — **Next.js App Router**, **Claude MCP** (`/api/mcp`), **Hono**, **Express**, **Fastify**, and **Stdio** adapters. ChatGPT Actions and Gemini Extensions are not yet supported.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18+ |
| npm | 10+ (workspace support required) |
| OS | Windows, macOS, or Linux |

---

## Install and run

Run all commands from the **monorepo root** (`lite-toon/`):

```bash
git clone https://github.com/Luke-official/lite-toon.git
cd lite-toon
npm install
npm run build
npm run dev -w apps/demo
```

> **Windows PowerShell note:** Do not chain commands with `&&` — PowerShell 5.1 does not support it. Run commands on separate lines or use `;`.

The demo starts at **[http://localhost:3000](http://localhost:3000)**.

### What `npm run build` does

It builds all `@lite-toon/*` packages in dependency order (toon → core → auth → adapters → bridge) before starting the demo. You only need to run it once, or again after pulling changes to package source files.

---

## Explore the demo

| URL | What you'll see |
|---|---|
| [http://localhost:3000](http://localhost:3000) | TaskFlow — Kanban board (Todo / In Progress / Done) |
| [http://localhost:3000/connect](http://localhost:3000/connect) | Step-by-step guide to connect Claude |
| [http://localhost:3000/hitl](http://localhost:3000/hitl) | Human-in-the-Loop approval queue |
| [http://localhost:3000/login](http://localhost:3000/login) | Register / sign in |

### Try the board

1. Open the homepage — 5 pre-seeded tasks appear on the board.
2. Sign in at `/login` with any username (e.g. `alice`).
3. Add a task using the inline **+ Add task** button in any column.
4. Connect Claude via `/connect` and ask it to plan your week — tasks appear on the board in real time with a **✦ AI** badge.

---

## Environment variables (optional)

All variables are optional for local development.

```bash
cp .env.example apps/demo/.env.local
```

| Variable | Default | Purpose |
|---|---|---|
| `OAUTH_CLIENT_ID` | `lite-toon-demo` | OAuth client identifier |
| `BASE_URL` | `http://localhost:3000` | Base URL for test scripts |

---

## Verify with test scripts

With the dev server running, open a second terminal:

```bash
# Capability unit tests (no server needed)
npm run test:tasks -w apps/demo

# MCP Streamable HTTP smoke test (initialize + tools/list)
npm run test:mcp -w apps/demo

# TOON/JSON via POST /api/agent
npm run test:api -w apps/demo

# OAuth PKCE flow + tools/call
npm run test:oauth -w apps/demo
```

---

## Your first tool call (curl)

List tasks via the TOON agent protocol (no auth required for a quick test):

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "x-agent-id: my-agent" \
  -d '{"action":"listTasks","params":{}}'
```

Expected response:

```json
{
  "success": true,
  "data": [
    { "id": "...", "title": "Finish onboarding docs", "status": "in-progress", "priority": "high", ... },
    ...
  ]
}
```

> `listTasks` requires `tasks:read` scope when called with an OAuth token. Without a token it still works — it resolves as `anonymous` and seeds a fresh board.

---

## Monorepo commands

| Command | Description |
|---|---|
| `npm run test:mcp -w apps/demo` | MCP smoke test |
| `npm run lint` | Lint via Turbo |

---

## Next steps

| Goal | Document |
|---|---|
| Connect Claude to the running demo | [Connect Agents](./integration/connect-agents.md) |
| Add your own business logic | [Capabilities](./concepts/capabilities.md) |
| Wire lite-toon into your Next.js app | [Next.js Integration](./integration/nextjs.md) |
| Understand the full codebase | [Study Guide](./guide/study-guide.md) |
| Look up endpoints and headers | [API Reference](./reference/api.md) |
