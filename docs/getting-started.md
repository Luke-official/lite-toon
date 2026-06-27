# Getting Started

> **Cheat sheet:** [getting-started.md](./cheatsheets/getting-started.md)

This guide gets the Lite-Toon demo running locally and verifies each transport layer works.

> **Project status:** Lite-Toon is in early development. Fully tested and supported today: **Next.js App Router**, **Claude MCP** (`/api/mcp`), and direct **TOON** access (`/api/agent`). **ChatGPT and Gemini are not supported yet** — coming soon.

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18+ |
| npm | 10+ (workspaces) |
| OS | Windows, macOS, or Linux |

## Install and run

```bash
git clone https://github.com/Luke-official/lite-toon.git
cd lite-toon
npm install
npm run build
npm run dev:clean
```

`dev:clean` kills stale processes on ports 3000–3002, then starts Turbo dev for all workspaces.

### Environment variables (optional)

Copy the example env file if you need overrides:

```bash
cp .env.example apps/demo/.env.local
```

| Variable | Default | Purpose |
|---|---|---|
| `OAUTH_CLIENT_ID` | `lite-toon-demo` | OAuth client identifier |
| `BASE_URL` | `http://localhost:3000` | Base URL for test scripts |

All variables are optional for local development.

## Explore the demo

| URL | What you'll see |
|---|---|
| [http://localhost:3000](http://localhost:3000) | Interactive shop + chat + TOON System Log |
| [http://localhost:3000/connect](http://localhost:3000/connect) | Merchant setup guide — **Claude** only |
| [http://localhost:3000/login](http://localhost:3000/login) | OAuth username login for agent users |

### Try the chat UI

Type in the chat:

> Add 2 pairs of Nike shoes to my cart

Watch the **System Log** panel — it shows raw TOON request and response payloads in real time.

Other phrases the demo understands:

- `Show my cart`
- `Show products` / `catalog`
- `Clear cart`
- `Add 3 adidas` / `Add 1 puma`

## Verify with test scripts

With the dev server running, open a second terminal:

```bash
# TOON via POST /api/agent
npm run test:api -w @lite-toon/demo

# MCP Streamable HTTP + OAuth discovery (Claude)
npm run test:mcp -w @lite-toon/demo
```

`test:mcp` and `test:api` are the primary smoke tests. `test:oauth` covers internal OpenAPI/tools routes that will power ChatGPT/Gemini when those platforms are supported — **do not use them for ChatGPT or Gemini integration today.**

## Your first TOON request (curl)

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: text/plain" \
  -H "x-agent-id: my-agent" \
  -d 'request[1]{action, params}:
  "getProducts", "{}"'
```

Expected response (TOON):

```
GetProductsResult[3]{id, name, price}:
  p1, "Nike Shoes", 120
  p2, "Adidas T-Shirt", 35
  p3, "Puma Socks", 15
```

### JSON request/response

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "x-agent-id: my-agent" \
  -d '{"action":"getProducts","params":{}}'
```

## Your first authenticated tool call

The `/api/tools/*` endpoints require OAuth. The fastest path locally is the test script:

```bash
npm run test:oauth -w @lite-toon/demo
```

It performs: login → authorize → token exchange → `addToCart` → `getCart`.

See [OAuth & Authentication](./concepts/oauth.md) for the full flow.

## Project commands

| Command | Description |
|---|---|
| `npm run dev` | Start all workspaces via Turbo |
| `npm run dev:clean` | Kill ports 3000–3002, then dev |
| `npm run build` | Build all packages + demo |
| `npm run lint` | Lint via Turbo |
| `npm run kill-ports` | Free ports 3000, 3001, 3002 |

### Windows PowerShell note

Avoid chaining with `&&` on PowerShell 5.1. Use separate lines or `;`:

```powershell
cd lite-toon ; npm install
```

## Next steps

| Goal | Document |
|---|---|
| Understand every layer of the codebase | [Study Guide](./guide/study-guide.md) |
| Connect Claude to your deployment | [Connect Agents](./integration/connect-agents.md) |
| Add your own business logic | [Capabilities](./concepts/capabilities.md) |
| Wire Lite-Toon into your Next.js app | [Next.js Integration](./integration/nextjs.md) |
| Look up endpoints and headers | [API Reference](./reference/api.md) |
