# Connect AI Agents

> **Cheat sheet:** [connect-agents.md](../cheatsheets/connect-agents.md)

Guide for merchants and developers connecting **Claude** to a Lite-Toon-powered application.

> **Supported today:** Claude via MCP Streamable HTTP (`/api/mcp`) on **Next.js App Router**.  
> **Not supported yet:** ChatGPT and Gemini. They will be added in a future release — do not attempt to connect them today.

End users only talk to their AI assistant — they never configure APIs, OAuth, or TOON.

## Prerequisites

- Lite-Toon app deployed and reachable (or local demo running)
- **HTTPS required** for Claude Chat in the browser (use [ngrok](https://ngrok.com/) or Cloudflare Tunnel for local testing)
- Open `/connect` on your deployment for copy-paste endpoint URLs

## Shared endpoints

Replace `your-domain` with your deployment URL.

| Resource | URL |
|---|---|
| **MCP (Streamable HTTP)** | `GET`+`POST https://your-domain/api/mcp` |
| MCP (legacy SSE) | `GET https://your-domain/api/mcp/sse` |
| MCP (legacy messages) | `POST https://your-domain/api/mcp/message` |
| OAuth authorize | `GET https://your-domain/api/oauth/authorize` |
| OAuth token | `POST https://your-domain/api/oauth/token` |
| OAuth register (DCR) | `POST https://your-domain/api/oauth/register` |
| Protected resource metadata | `GET https://your-domain/.well-known/oauth-protected-resource` |
| Authorization server metadata | `GET https://your-domain/.well-known/oauth-authorization-server` |
| Merchant guide | `GET https://your-domain/connect` |

**Demo client ID:** `lite-toon-demo`  
**Scopes:** `cart:read cart:write`

## OAuth flow (Claude)

```mermaid
sequenceDiagram
    participant User
    participant Agent as Claude
    participant OAuth as Lite-Toon OAuth
    participant API as /api/mcp

    Agent->>OAuth: Authorize (PKCE challenge)
    OAuth->>User: Redirect to /login
    User->>OAuth: Login + approve
    OAuth->>Agent: Authorization code
    Agent->>OAuth: Exchange code + verifier
    OAuth->>Agent: access_token
    User->>Agent: "Add 2 Nike shoes"
    Agent->>API: tools/call addToCart + Bearer
    API-->>Agent: MCP tool result
    Agent-->>User: Natural language reply
```

### Steps

1. Agent generates PKCE `code_verifier` and `code_challenge` (S256)
2. Agent redirects user to `/api/oauth/authorize` with `client_id`, `redirect_uri`, `scope`, `code_challenge`
3. User logs in at `/login` if no session exists
4. User is redirected back to agent with `code`
5. Agent exchanges `code` + `code_verifier` at `/api/oauth/token`
6. Agent stores `access_token` and sends `Authorization: Bearer` on all tool calls

Each user gets an isolated cart keyed by their OAuth `userId`.

See [OAuth & Authentication](../concepts/oauth.md) for technical details.

---

## Claude (MCP) — supported

Claude connects via the **Model Context Protocol**. Use **Streamable HTTP** at `/api/mcp` for Claude Chat (browser); legacy SSE at `/api/mcp/sse` remains available.

### Claude Chat (browser) with ngrok

1. Start the demo: `npm run dev:clean`
2. Expose HTTPS: `ngrok http 3000`
3. In Claude → **Settings → Connectors → Add custom connector**
4. MCP server URL: `https://<your-ngrok-host>/api/mcp`
5. Click **Connect** — Claude discovers OAuth via `/.well-known/oauth-protected-resource`
6. Sign in at `https://<your-ngrok-host>/login` when redirected (use a username you'll remember)
7. Ask Claude: *"What products do you have?"* then *"Add 2 Nike shoes to my cart"*
8. Optional: open the shop at the same ngrok URL (signed in) to see the cart update

ngrok hosts matching `*.ngrok-free.app` and `*.ngrok.io` are allowed for OAuth redirects automatically.

### OAuth discovery endpoints

| Resource | URL |
|---|---|
| Protected resource metadata | `GET /.well-known/oauth-protected-resource` |
| Authorization server metadata | `GET /.well-known/oauth-authorization-server` |
| Dynamic client registration | `POST /api/oauth/register` |

Unauthenticated `tools/call` requests return **HTTP 401** with a `WWW-Authenticate` header pointing at the metadata URL.

### Supported MCP methods

| Method | Auth | Description |
|---|---|---|
| `initialize` | No | Protocol handshake |
| `ping` | No | Health check |
| `tools/list` | No | Discover available tools |
| `tools/call` | **Yes** | Execute a capability |

### Example tools/call

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "addToCart",
    "arguments": { "productId": "p1", "quantity": 2 }
  }
}
```

### Legacy SSE setup

1. Configure your MCP client with SSE URL: `https://your-domain/api/mcp/sse`
2. Client reads `endpoint` event → discovers message URL
3. Complete OAuth to obtain Bearer access token
4. Send JSON-RPC to message URL with `Authorization: Bearer <token>`

See [MCP Integration](../concepts/mcp.md) for the full protocol reference.

### Troubleshooting

| Problem | Solution |
|---|---|
| Claude cannot connect to localhost | Use ngrok or deploy to a public HTTPS URL |
| OAuth redirect fails | Ensure ngrok URL is HTTPS; check `allowedRedirectUris` |
| SSE connection drops | Check reverse proxy supports long-lived connections |
| tools/call returns 401 | Complete OAuth connector flow in Claude settings |
| Empty tools list | Verify capabilities are registered on the agent |
| Cart not visible in browser | Sign in at `/login` with the same username used during Claude OAuth |

---

## ChatGPT — not supported yet

ChatGPT (Custom GPT / Actions) integration is **not available today**. It will be added in a future release.

---

## Gemini — not supported yet

Gemini (Extensions / OpenAPI) integration is **not available today**. It will be added in a future release.

---

## Local development with ngrok

Claude Chat cannot reach `localhost`. Tunnel your dev server:

```bash
# Terminal 1
npm run dev:clean

# Terminal 2
ngrok http 3000
```

Use the ngrok HTTPS URL as the MCP server host:

- MCP: `https://abc123.ngrok.io/api/mcp`
- Login: `https://abc123.ngrok.io/login`

ngrok hosts matching `*.ngrok-free.app` and `*.ngrok.io` are allowed for OAuth redirects automatically in the demo.

## Testing without external agents

With the dev server running:

```bash
# MCP Streamable HTTP + OAuth discovery (supported)
npm run test:mcp -w @lite-toon/demo

# TOON direct access (supported)
npm run test:api -w @lite-toon/demo
```

Or use the built-in chat UI at `http://localhost:3000` — it simulates an AI via keyword matching and shows TOON payloads in the System Log.

## Platform comparison

| Feature | Claude *(supported)* | ChatGPT *(not yet)* | Gemini *(not yet)* | Direct `/api/agent` |
|---|---|---|---|---|
| Discovery | MCP `tools/list` | — | — | Manual |
| Protocol | JSON-RPC on `/api/mcp` | — | — | TOON or JSON |
| Auth | OAuth PKCE + Bearer | — | — | Optional Bearer |
| Response format | MCP text content | — | — | TOON (default) |
| Per-user context | Yes | — | — | Yes (with token) |

## Architecture note

- **JSON-RPC** on `/api/mcp` — primary transport for Claude (Streamable HTTP)
- **TOON** on `/api/agent` — for token-efficient direct integrations
- Business logic lives in **capabilities**; schemas are generated automatically
- One registry update → all platforms get the new tool when they are supported

## Related

- [OAuth & Authentication](../concepts/oauth.md)
- [MCP Integration](../concepts/mcp.md)
- [API Reference](../reference/api.md)
- [Next.js Integration](./nextjs.md)
- [Security](../security/overview.md)
