# Getting Started — Cheat Sheet

> **Supported:** Next.js App Router · Claude MCP · TOON. ChatGPT/Gemini **not supported yet**.

## Prerequisites

Node 18+ · npm 10+ · ports 3000–3002 free

## Install & run

```bash
git clone https://github.com/Luke-official/lite-toon.git
cd lite-toon
npm install
npm run build
npm run dev:clean
```

## URLs (local)

| URL | Purpose |
|---|---|
| `http://localhost:3000` | Chat UI + TOON log |
| `http://localhost:3000/connect` | Merchant setup (Claude) |
| `http://localhost:3000/login` | OAuth login |

## Test commands

```bash
npm run test:api -w @lite-toon/demo      # TOON /api/agent
npm run test:mcp -w @lite-toon/demo      # MCP Streamable HTTP (Claude)
# test:oauth exists for internal dev only — ChatGPT/Gemini not supported yet
```

## First curl (TOON)

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: text/plain" \
  -H "x-agent-id: test" \
  -d 'request[1]{action, params}:
  "getProducts", "{}"'
```

## First curl (JSON)

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"action":"getProducts","params":{}}'
```

## Env vars (optional)

| Var | Default |
|---|---|
| `OAUTH_CLIENT_ID` | `lite-toon-demo` |
| `BASE_URL` | `http://localhost:3000` |

## Chat phrases (demo UI)

`Add 2 nike` · `Show my cart` · `Show products` · `Clear cart`

## Next steps

Architecture → `docs/architecture/overview.md` · Study → `docs/guide/study-guide.md`
