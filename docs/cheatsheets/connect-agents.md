# Connect Agents — Cheat Sheet

> **Supported:** Claude (MCP Streamable HTTP)  
> **Not supported yet:** ChatGPT, Gemini — coming soon

## Shared URLs (Claude)

```
MCP (primary): GET+POST /api/mcp
MCP legacy:    GET  /api/mcp/sse
               POST /api/mcp/message
PRM:           GET  /.well-known/oauth-protected-resource
ASM:           GET  /.well-known/oauth-authorization-server
Authorize:     GET  /api/oauth/authorize
Token:         POST /api/oauth/token
Register:      POST /api/oauth/register
```

## Demo credentials

Client ID: `lite-toon-demo` · Scopes: `cart:read cart:write`

## Platform picker

| Platform | Status | Connect via |
|---|---|---|
| **Claude** | ✅ Supported | `/api/mcp` + OAuth discovery |
| ChatGPT | ❌ Not supported yet | — |
| Gemini | ❌ Not supported yet | — |
| Direct | ✅ Supported | POST /api/agent (TOON) |

## Claude setup (Claude Chat + ngrok)

```
1. npm run dev:clean
2. ngrok http 3000
3. Claude → Settings → Connectors → Add custom connector
4. MCP URL: https://<ngrok-host>/api/mcp
5. Connect → OAuth → sign in at /login
6. Ask: "What products?" → "Add 2 Nike shoes"
```

## ChatGPT / Gemini

**Not supported yet.** Do not attempt integration.

## Local dev

```bash
npm run dev:clean
ngrok http 3000
# Claude needs HTTPS — cannot use localhost directly
```

## Test without agents

```bash
npm run test:mcp -w @lite-toon/demo    # supported
npm run test:api -w @lite-toon/demo    # supported
# Or use localhost:3000 chat UI
```

## Example user prompts

`What products?` · `Add 2 Nike shoes` · `Show cart` · `Clear cart`

## Response formats

Claude: MCP text blocks · Direct: TOON

## Troubleshooting

| Problem | Fix |
|---|---|
| OAuth fail | Check redirect URI allowlist |
| Claude + localhost | Use ngrok HTTPS |
| MCP 401 on addToCart | Complete OAuth connector flow |
| MCP 401 on getProducts | Should work without token in demo |
| Cart not in browser | Sign in at /login with same OAuth username |
