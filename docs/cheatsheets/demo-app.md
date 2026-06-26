# Demo App — Cheat Sheet

Location: `apps/demo/`

## Key files

| File | Role |
|---|---|
| `src/agent.ts` | UniversalAgent singleton |
| `src/lib/auth.ts` | OAuthServer config |
| `src/demo/capabilities.ts` | Business logic |
| `src/app/api/*/route.ts` | Thin adapters |
| `src/app/api/demo/route.ts` | AI simulator + TOON log |
| `src/app/page.tsx` | Chat UI |
| `src/app/connect/page.tsx` | Merchant guide |

## Agent wiring

```typescript
new UniversalAgent({
  tokenResolver: oauthServer,
  capabilities: [getProducts, getCart, addToCart, clearCart],
});
```

## Routes (all thin)

```
POST /api/agent          → createNextAgentHandler
POST /api/tools/[name]   → createNextToolsHandler
GET  /api/openapi.json   → createOpenApiSpecHandler
GET/POST /api/oauth/*    → OAuth handlers
GET  /api/mcp/sse        → createMCPSseHandler
POST /api/mcp/message    → createMCPMessageHandler
POST /api/demo           → keyword AI simulator (demo only)
```

## /api/demo flow

```
message → keyword match → formatToon → adapter handler → TOON response → UI log
```

## Chat keywords

| Phrase | Action |
|---|---|
| add + nike | addToCart p1 |
| add + adidas | addToCart p2 |
| add + puma | addToCart p3 |
| products/catalog | getProducts |
| clear cart | clearCart |
| cart (no add) | getCart |

## Test scripts

```bash
npm run test:api -w @lite-toon/demo
npm run test:oauth -w @lite-toon/demo
npm run test:mcp -w @lite-toon/demo
```

## Env

`OAUTH_CLIENT_ID` · `BASE_URL` (optional)

## Copy to your app

✅ agent.ts pattern · ✅ thin routes · ✅ capability registration

## Replace for prod

❌ InMemoryAuthStore · ❌ /api/demo · ❌ keyword parser · ❌ username login

## URLs

`/` chat · `/connect` setup · `/login` OAuth
