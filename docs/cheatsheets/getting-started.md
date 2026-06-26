# Getting Started — Cheat Sheet

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
| `http://localhost:3000/connect` | Merchant setup |
| `http://localhost:3000/login` | OAuth login |
| `http://localhost:3000/api/openapi.json` | OpenAPI spec |

## Test commands

```bash
npm run test:api -w @lite-toon/demo      # TOON /api/agent
npm run test:oauth -w @lite-toon/demo    # OAuth + tools
npm run test:mcp -w @lite-toon/demo       # MCP JSON-RPC
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
