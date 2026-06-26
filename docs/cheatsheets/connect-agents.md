# Connect Agents — Cheat Sheet

## Shared URLs

```
OpenAPI:   GET  /api/openapi.json
Authorize: GET  /api/oauth/authorize
Token:     POST /api/oauth/token
Tools:     POST /api/tools/{name}
MCP SSE:   GET  /api/mcp/sse
MCP RPC:   POST /api/mcp/message
```

## Demo credentials

Client ID: `lite-toon-demo` · Scopes: `cart:read cart:write`

## Platform picker

| Platform | Connect via |
|---|---|
| ChatGPT | Import OpenAPI + OAuth PKCE |
| Gemini | Same OpenAPI + OAuth |
| Claude | MCP SSE + OAuth Bearer |
| Direct | POST /api/agent (TOON) |

## ChatGPT setup (5 steps)

```
1. GPT Builder → Actions → Import OpenAPI URL
2. Auth: OAuth, Client ID lite-toon-demo, no secret
3. Auth URL + Token URL from your domain
4. Scope: cart:read cart:write, PKCE on
5. Test OAuth → Publish
```

## Claude setup

```
1. MCP client → SSE URL
2. Read endpoint event
3. OAuth for Bearer token
4. JSON-RPC to message URL
```

## Gemini setup

```
Same as ChatGPT — import /api/openapi.json + OAuth
```

## Local + ChatGPT

```bash
npm run dev:clean
ngrok http 3000
# Use ngrok HTTPS URL in GPT config
# Add ngrok callback to allowedRedirectUris
```

## Test without agents

```bash
npm run test:oauth -w @lite-toon/demo
npm run test:mcp -w @lite-toon/demo
# Or use localhost:3000 chat UI
```

## Example user prompts

`What products?` · `Add 2 Nike shoes` · `Show cart` · `Clear cart`

## Response formats

ChatGPT/Gemini: JSON · Claude: MCP text blocks · Direct: TOON

## Troubleshooting

| Problem | Fix |
|---|---|
| OAuth fail | Check redirect URI allowlist |
| 401 tools | Re-auth in GPT settings |
| 403 | Missing scope — re-auth |
| localhost + GPT | Use ngrok |
| MCP 401 | Bearer on tools/call only |
