# Demo App

> **Cheat sheet:** [demo-app.md](../cheatsheets/demo-app.md)

Walkthrough of `apps/demo` — the reference **Next.js App Router** proof-of-concept for **Claude MCP**, OAuth, and TOON.

## Purpose

The demo app is **not** a production shop. It exists to:

1. Show how to wire Lite-Toon routes in a Next.js App Router project
2. Provide working OAuth, MCP (Streamable HTTP), and TOON endpoints for testing
3. Simulate an AI chat interaction with a live TOON System Log
4. Offer a merchant setup page at `/connect` (Claude only)

## File map

```
apps/demo/
├── package.json
├── scripts/
│   ├── test-api.js       # TOON /api/agent test
│   ├── test-oauth.js     # OAuth + tools flow test
│   └── test-mcp.js       # MCP JSON-RPC test
└── src/
    ├── agent.ts                    # UniversalAgent singleton
    ├── lib/auth.ts                 # OAuthServer configuration
    ├── demo/capabilities.ts        # E-commerce business logic
    ├── types/
    │   ├── toon.d.ts
    │   └── mcp.d.ts
    └── app/
        ├── layout.tsx
        ├── page.tsx                # Chat UI + TOON log
        ├── globals.css
        ├── connect/page.tsx        # Merchant setup guide
        ├── login/page.tsx          # OAuth login form
        ├── .well-known/
        │   ├── oauth-protected-resource/route.ts
        │   └── oauth-authorization-server/route.ts
        └── api/
            ├── agent/route.ts
            ├── demo/route.ts
            ├── me/route.ts
            ├── products/route.ts
            ├── openapi.json/route.ts
            ├── tools/[name]/route.ts
            ├── oauth/
            │   ├── authorize/route.ts
            │   ├── token/route.ts
            │   ├── login/route.ts
            │   └── register/route.ts
            └── mcp/
                ├── route.ts          # Streamable HTTP (Claude)
                ├── sse/route.ts      # legacy
                └── message/route.ts  # legacy
```

## Agent singleton

`src/agent.ts` — the single `UniversalAgent` instance used by all routes:

```typescript
import { UniversalAgent } from '@lite-toon/bridge';
import { getProducts, getCart, addToCart, clearCart } from '@/demo/capabilities';
import { oauthServer } from '@/lib/auth';

export const agent = new UniversalAgent({
  tokenResolver: oauthServer,
  capabilities: [getProducts, getCart, addToCart, clearCart],
});
```

Every API route imports this same `agent` object.

## OAuth configuration

`src/lib/auth.ts`:

- `InMemoryAuthStore` for all auth data
- Client ID from `OAUTH_CLIENT_ID` env var (default `lite-toon-demo`)
- Allowed redirect URIs include ChatGPT callbacks

## Business logic

`src/demo/capabilities.ts`:

| Export | Description |
|---|---|
| `PRODUCT_CATALOG` | Static product list (3 items) |
| `getProducts` | Returns catalog (scope: `cart:read`) |
| `getCart` | Returns user's cart (scope: `cart:read`) |
| `addToCart` | Adds item to user's cart (scope: `cart:write`) |
| `clearCart` | Empties user's cart (scope: `cart:write`) |
| `enrichCart()` | Adds name, price, subtotal to cart lines |
| `getCartTotal()` | Sum of subtotals |
| `getCartItemCount()` | Total item quantity |

**Per-user isolation:** `cartsByUser` is a `Map<string, CartItem[]>` keyed by OAuth `userId`.

## API routes (thin intercoms)

Every route delegates to an adapter factory. No business logic in route files.

### `api/agent/route.ts`

```typescript
export const POST = createNextAgentHandler(agent);
```

### `api/tools/[name]/route.ts`

```typescript
const handler = createNextToolsHandler(agent);
export const POST = (req, ctx) => handler(req, ctx);
```

Dynamic `[name]` matches any registered capability.

### `api/mcp/route.ts` (Streamable HTTP)

```typescript
const handler = createMCPStreamableHttpHandler(agent);
export const GET = handler;
export const POST = handler;
```

### `api/mcp/sse/route.ts` + `api/mcp/message/route.ts` (legacy)

```typescript
export const GET = createMCPSseHandler(agent);
export const POST = createMCPMessageHandler(agent);
```

### `api/oauth/*.ts`

```typescript
export const GET = createOAuthAuthorizeHandler({ oauth: oauthServer });
export const POST = createOAuthTokenHandler({ oauth: oauthServer });
export const POST = createOAuthLoginHandler({ oauth: oauthServer });
export const POST = createOAuthRegisterHandler({ oauth: oauthServer });
```

### `api/openapi.json/route.ts`

Builds OpenAPI document with dynamic `baseUrl` from request headers.

### `api/demo/route.ts` (special)

The demo simulation route. **This is the only route with substantial logic** — and it's demo-specific, not SDK code.

**Flow:**

1. `POST { message }` — natural language from chat UI
2. Keyword parser maps message → `{ action, params }`
3. `formatToon()` builds TOON request
4. Calls `createNextAgentHandler(agent)` internally (same path as `/api/agent`)
5. Parses TOON response
6. Builds human-friendly `assistantMessage`
7. Returns cart state + `toonRequest` + `toonResponse` for System Log

**Demo token:** Auto-creates OAuth user `demo-ui-user` and caches access token in memory.

## UI pages

### `/` — Chat + shop

`src/app/page.tsx`:

- Product catalog sidebar
- Cart display with totals
- Chat input simulating an AI agent
- **System Log** panel showing raw TOON request/response payloads
- Calls `POST /api/demo` on each message

### `/connect` — Merchant guide

`src/app/connect/page.tsx`:

- Lists all endpoint URLs (dynamically from `window.location.origin`)
- Step-by-step **Claude** connector instructions only
- Demo client ID and scopes

### `/login` — OAuth login

`src/app/login/page.tsx`:

- Username form (no password — demo only)
- Calls `POST /api/oauth/login`
- Redirects back to OAuth authorize flow via `returnUrl` query param

## Test scripts

Located in `apps/demo/scripts/`. Run with dev server on port 3000.

### `test-api.js`

Sends TOON `getProducts` request to `/api/agent`. No auth required.

### `test-oauth.js`

Full OAuth PKCE flow:

1. Login as `oauth-test-user`
2. Authorize with PKCE challenge
3. Exchange code for token
4. Call `addToCart` and `getCart` tools

### `test-mcp.js`

1. OAuth discovery (PRM + ASM)
2. Streamable HTTP: `initialize` → `tools/list` → `tools/call addToCart`
3. Legacy message endpoint: `tools/call getCart`

## Environment variables

| Variable | Default | File |
|---|---|---|
| `OAUTH_CLIENT_ID` | `lite-toon-demo` | `src/lib/auth.ts` |
| `BASE_URL` | `http://localhost:3000` | test scripts |

Copy `.env.example` to `apps/demo/.env.local` for overrides.

## What to copy vs what to replace

### Copy into your app

- Route wiring pattern (thin intercoms)
- `agent.ts` singleton structure
- `lib/auth.ts` OAuth configuration (with production hardening)
- Capability registration pattern

### Replace for production

- `InMemoryAuthStore` → persistent store
- Username-only login → real authentication
- `/api/demo` route → remove or protect
- Keyword parser → real LLM integration
- `Math.random()` tokens → cryptographic tokens

## Related

- [Getting Started](../getting-started.md)
- [Next.js Integration](../integration/nextjs.md)
- [API Reference](../reference/api.md)
- [Security](../security/overview.md)
