# Connect AI Agents to Lite-Toon Demo

This guide explains how merchants connect **ChatGPT**, **Gemini**, and **Claude** to the Lite-Toon demo shop. End users only talk to their AI assistant — they never configure APIs or OAuth.

## Prerequisites

- Demo app running: `npm run dev` from the monorepo root
- Public HTTPS URL for production (use ngrok or similar for local testing with ChatGPT)

## Shared endpoints

| Resource | URL |
|---|---|
| OpenAPI spec | `GET /api/openapi.json` |
| OAuth authorize | `GET /api/oauth/authorize` |
| OAuth token | `POST /api/oauth/token` |
| Tool execution | `POST /api/tools/{capabilityName}` |
| MCP SSE | `GET /api/mcp/sse` |
| MCP messages | `POST /api/mcp/message` |

**Demo client ID:** `lite-toon-demo`  
**Scopes:** `cart:read cart:write`

## OAuth flow (all agents)

1. The AI agent starts OAuth with PKCE (`code_challenge` + `code_verifier`).
2. The user is redirected to `/login` if not authenticated.
3. After login, the user approves access and receives an authorization `code`.
4. The agent exchanges the code at `/api/oauth/token` for a `Bearer` access token.
5. All tool calls include `Authorization: Bearer <access_token>`.

Each user gets an isolated in-memory cart keyed by `userId`.

## ChatGPT (Custom GPT / Actions)

1. Open the GPT builder and create a new Custom GPT.
2. Go to **Configure → Actions → Import from URL**.
3. Paste your OpenAPI URL, e.g. `https://your-domain/api/openapi.json`.
4. Set authentication to **OAuth**:
   - Authorization URL: `https://your-domain/api/oauth/authorize`
   - Token URL: `https://your-domain/api/oauth/token`
   - Client ID: `lite-toon-demo`
   - Scope: `cart:read cart:write`
5. Enable PKCE if prompted.
6. Publish and share the GPT link with customers.

Example user prompt: *"Add 2 pairs of Nike shoes to my cart"*.

## Claude (MCP)

1. Connect your MCP client to the SSE endpoint: `GET /api/mcp/sse`.
2. Read the `endpoint` event to discover the message URL (`/api/mcp/message`).
3. Complete OAuth to obtain a user access token.
4. Send JSON-RPC requests to the message endpoint with `Authorization: Bearer <token>`.

Supported methods:

- `initialize`
- `tools/list`
- `tools/call`
- `ping`

## Gemini (OpenAPI / Extensions)

1. In Google AI Studio or a Gemini Gem, import the same OpenAPI document from `/api/openapi.json`.
2. Configure OAuth with the same authorization and token URLs as ChatGPT.
3. Gemini function declarations match the MCP tool schemas exported from the capability registry.

## Testing locally

With the dev server running:

```bash
npm run test:oauth -w @lite-toon/demo
npm run test:mcp -w @lite-toon/demo
npm run test:api -w @lite-toon/demo
```

## Architecture note

- **JSON** responses on `/api/tools/*` and MCP — for consumer AI agents.
- **TOON** responses on `/api/agent` — for token-efficient direct integrations.
- Business logic lives in registered **capabilities**; exports are generated automatically.
