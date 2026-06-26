# MCP — Cheat Sheet

## Endpoints

| Method | Path | Role |
|---|---|---|
| GET | `/api/mcp/sse` | Discovery stream |
| POST | `/api/mcp/message` | JSON-RPC handler |

## Connection

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
| `tools/call` | **Bearer** | capability result |
| `notifications/initialized` | No | 204 |

## initialize

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"x","version":"1.0"}}}
```

## tools/list

```json
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
```

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

## vs OpenAPI tools

| | MCP | OpenAPI tools |
|---|---|---|
| Consumer | Claude | ChatGPT, Gemini |
| Protocol | JSON-RPC | REST POST |
| Discovery | tools/list | openapi.json |
| Same execute()? | ✅ | ✅ |

## Test

```bash
npm run test:mcp -w @lite-toon/demo
```

## Local dev

Claude needs HTTPS tunnel (ngrok) — can't reach localhost.
