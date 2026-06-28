# Demo App

Walkthrough of `apps/demo` — a reference **Next.js App Router** e-commerce PoC with Lite-Toon bridge routes for **Claude MCP**, OAuth, and TOON.

## Purpose

The demo app shows how a **real webapp** and a **Lite-Toon bridge** coexist:

1. **Webapp channel** — humans shop in the browser (session auth, normal REST)
2. **Bridge channel** — external AI assistants call the same capabilities (OAuth + MCP/TOON)
3. Merchant/developer setup at `/connect` for wiring Claude

## Two-channel architecture

| Channel | Routes | Auth |
|---|---|---|
| Webapp | `GET /api/products`, `GET/POST/DELETE /api/cart`, `GET /api/me` | Session cookie |
| Lite-Toon bridge | `POST /api/mcp`, `POST /api/agent`, `POST /api/tools/*` | OAuth Bearer |

Both channels call the same functions in `src/demo/capabilities.ts`. Web routes use `agent.registry.execute` directly — no TOON, no MCP adapter.

## File map

```
apps/demo/
├── package.json
├── scripts/
│   ├── test-api.js       # TOON /api/agent test
│   ├── test-oauth.js     # OAuth + tools flow test
│   └── test-mcp.js       # MCP Streamable HTTP test
└── src/
    ├── agent.ts                    # UniversalAgent singleton
    ├── lib/
    │   ├── auth.ts                 # OAuthServer configuration
    │   ├── session.ts              # Session user resolution for webapp routes
    │   └── demo-fetch.ts           # Fetch helper (ngrok header)
    ├── demo/capabilities.ts        # E-commerce business logic
    ├── components/shop/              # Shop UI components
    │   ├── Header.tsx
    │   ├── ProductGrid.tsx
    │   ├── CartSidebar.tsx
    │   └── types.ts
    └── app/
        ├── layout.tsx
        ├── page.tsx                # Shop orchestrator
        ├── connect/page.tsx        # Claude setup guide
        ├── login/page.tsx          # Session login
        ├── .well-known/            # OAuth discovery
        └── api/
            ├── agent/route.ts      # Bridge: TOON agent
            ├── cart/route.ts       # Webapp: cart CRUD
            ├── products/route.ts   # Webapp: catalog
            ├── me/route.ts         # Webapp: session user
            ├── openapi.json/route.ts
            ├── tools/[name]/route.ts
            ├── oauth/…
            └── mcp/route.ts        # Bridge: Streamable HTTP MCP
```

## Agent singleton

`src/agent.ts` — the single `UniversalAgent` instance used by bridge routes and webapp cart API:

```typescript
import { UniversalAgent } from '@lite-toon/bridge';
import { getProducts, getCart, addToCart, removeFromCart, clearCart } from '@/demo/capabilities';
import { oauthServer } from '@/lib/auth';

export const agent = new UniversalAgent({
  tokenResolver: oauthServer,
  capabilities: [getProducts, getCart, addToCart, removeFromCart, clearCart],
});
```

## Business logic

`src/demo/capabilities.ts` holds all cart/catalog state and capability definitions. See [Capabilities](../concepts/capabilities.md).

## Webapp API routes

These are **your app's own REST API** — not Lite-Toon bridge endpoints.

### `api/products/route.ts`

Public catalog — no login required.

### `api/cart/route.ts`

Session-authenticated cart operations:

| Method | Action |
|---|---|
| `GET` | Read cart (empty if logged out) |
| `POST` | `{ productId, quantity }` → add to cart |
| `DELETE` | `?productId=p1` → remove line; no query → clear cart |

Calls `agent.registry.execute` with `{ userId, agentId: 'webapp', scopes: [...] }`.

### `api/me/route.ts`

Returns `{ authenticated, userId, username }` for the current session.

## Bridge API routes (thin intercoms)

Every bridge route delegates to an adapter factory. No business logic in route files.

| Route | Factory |
|---|---|
| `api/agent/route.ts` | `createNextAgentHandler(agent)` |
| `api/mcp/route.ts` | `createMCPStreamableHttpHandler(agent)` |
| `api/tools/[name]/route.ts` | `createNextToolsHandler(agent)` |
| `api/oauth/*.ts` | `createOAuth*Handler({ oauth: oauthServer })` |

## UI pages

### `/` — Shop

- Product catalog with **Add to cart** buttons
- Cart sidebar with remove/clear actions
- Sign-in required for cart mutations
- Cart syncs on window focus (picks up Claude changes)

### `/connect` — Developer guide

Lists bridge endpoint URLs and Claude connector setup steps.

### `/login` — Session login

Username form (demo only). Same username should be used during Claude OAuth.

## Test scripts

| Script | Tests |
|---|---|
| `test-api.js` | TOON `getProducts` via `/api/agent` |
| `test-oauth.js` | Full OAuth PKCE + tools |
| `test-mcp.js` | OAuth discovery + Streamable HTTP MCP |

## What to copy vs what to replace

### Copy into your app

- Capability definitions + registry pattern
- Bridge route wiring (thin intercoms)
- Your own webapp REST routes calling the same capabilities
- `lib/auth.ts` OAuth configuration (with production hardening)

### Replace for production

- `InMemoryAuthStore` → persistent store
- Username-only login → real authentication
- In-memory cart storage → database

## Related

- [Getting Started](../getting-started.md)
- [Next.js Integration](../integration/nextjs.md)
- [API Reference](../reference/api.md)
- [Security](../security/overview.md)
