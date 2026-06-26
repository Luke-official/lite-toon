# API Reference — Cheat Sheet

Base: `http://localhost:3000`

## All endpoints

| Method | Path | Auth | Format |
|---|---|---|---|
| POST | `/api/agent` | Optional | TOON/JSON |
| POST | `/api/tools/{name}` | Bearer + scopes | JSON |
| GET | `/api/openapi.json` | — | OpenAPI 3.1 |
| POST | `/api/oauth/login` | — | JSON |
| GET | `/api/oauth/authorize` | Cookie | redirect |
| POST | `/api/oauth/token` | — | JSON |
| GET | `/api/mcp/sse` | — | SSE |
| POST | `/api/mcp/message` | Bearer* | JSON-RPC |
| GET | `/api/demo` | — | JSON |
| POST | `/api/demo` | auto | JSON+TOON |

*Bearer required for `tools/call` only

## Headers

| Header | When |
|---|---|
| `Authorization: Bearer <token>` | Tools, MCP call, optional agent |
| `x-agent-id` | All agent endpoints |
| `Content-Type: text/plain` | TOON request |
| `Accept: application/json` | JSON response from agent |

## Tools quick calls

```bash
# getProducts
curl -X POST localhost:3000/api/tools/getProducts -H "Authorization: Bearer $T" -H "Content-Type: application/json" -d '{}'

# addToCart
curl -X POST localhost:3000/api/tools/addToCart -H "Authorization: Bearer $T" -H "Content-Type: application/json" -d '{"productId":"p1","quantity":2}'

# getCart
curl -X POST localhost:3000/api/tools/getCart -H "Authorization: Bearer $T" -d '{}'

# clearCart
curl -X POST localhost:3000/api/tools/clearCart -H "Authorization: Bearer $T" -d '{}'
```

## TOON agent

```bash
curl -X POST localhost:3000/api/agent -H "Content-Type: text/plain" -d 'request[1]{action,params}:
"getProducts","{}"'
```

## Demo POST

```json
POST /api/demo  { "message": "Add 2 nike shoes to my cart" }
```

## Status codes

200 · 204 · 400 · 401 · 403 · 404 · 429 · 500

## Error JSON

```json
{ "success": false, "message": "TOON_UNAUTHORIZED: ..." }
```

## Capabilities

| Name | Scopes | Body |
|---|---|---|
| getProducts | cart:read | `{}` |
| getCart | cart:read | `{}` |
| addToCart | cart:write | `{productId, quantity}` |
| clearCart | cart:write | `{}` |

## Rate limit

100/min per x-agent-id · 429 on exceed
