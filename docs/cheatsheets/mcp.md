# MCP — Cheat Sheet

> Primary transport for **Claude** — Streamable HTTP at `/api/mcp`

## Endpoints

| Method | Path | Role |
|---|---|---|
| GET+POST | `/api/mcp` | Streamable HTTP (recommended) |
| GET | `/api/mcp/sse` | Legacy discovery stream |
| POST | `/api/mcp/message` | Legacy JSON-RPC handler |

## OAuth discovery

```
GET  /.well-known/oauth-protected-resource
GET  /.well-known/oauth-authorization-server
POST /api/oauth/register
```

## Connection (Streamable HTTP)

```
1. Claude reads PRM + ASM on connect
2. POST /api/mcp → initialize
3. POST /api/mcp → tools/list
4. OAuth → Bearer token
5. POST /api/mcp → tools/call
```

## Legacy SSE connection

```
1. GET /api/mcp/sse
2. Read event: endpoint → message URL
3. OAuth → Bearer token
4. POST JSON-RPC to message URL
```

## Supported methods

| Method | Auth | Returns |
|---|---|---|
| `initialize` | No | server info |
| `ping` | No | `{}` |
| `tools/list` | No | tool schemas |
| `tools/call` | **Bearer** (scoped caps) | capability result |
| `notifications/initialized` | No | 204 |

## tools/call

```json
{
  "jsonrpc": "2.0", "id": 3, "method": "tools/call",
  "params": { "name": "addToCart", "arguments": { "productId": "p1", "quantity": 2 } }
}
```

## Success result shape

```json
{
  "result": {
    "content": [{ "type": "text", "text": "[...json data...]" }],
    "isError": false
  }
}
```

## JSON-RPC errors

| Code | Meaning |
|---|---|
| -32700 | Parse error |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |
| -32001 | Unauthorized |

## Headers

```http
Authorization: Bearer <token>
Content-Type: application/json
x-agent-id: mcp-client
```

## vs OpenAPI tools (not supported yet)

| | MCP | OpenAPI tools |
|---|---|---|
| Status | ✅ Claude | ❌ ChatGPT/Gemini not yet |
| Consumer | Claude | — |
| Protocol | JSON-RPC | — |
| Discovery | tools/list | — |
| Same execute()? | ✅ | — |

## Test

```bash
npm run test:mcp -w @lite-toon/demo
```

## Local dev

Claude needs HTTPS tunnel (ngrok) — can't reach localhost.
