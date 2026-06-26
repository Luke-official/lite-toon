# Next.js Integration — Cheat Sheet

## 4 pieces to wire

```
1. lib/auth.ts      → OAuthServer
2. agent.ts         → UniversalAgent singleton
3. capabilities/    → business logic
4. app/api/*        → thin routes
```

## auth.ts

```typescript
import { InMemoryAuthStore, OAuthServer } from '@lite-toon/bridge';
export const oauthServer = new OAuthServer({
  store: new InMemoryAuthStore(),
  clientId: 'my-app',
  allowedRedirectUris: ['https://chat.openai.com/aip/oauth/callback', ...],
});
```

## agent.ts

```typescript
import { UniversalAgent } from '@lite-toon/bridge';
export const agent = new UniversalAgent({
  tokenResolver: oauthServer,
  capabilities: [/* ... */],
});
```

## Route map

| File | Export |
|---|---|
| `api/agent/route.ts` | `POST = createNextAgentHandler(agent)` |
| `api/tools/[name]/route.ts` | `createNextToolsHandler(agent)` |
| `api/openapi.json/route.ts` | `createOpenApiSpecHandler(agent, opts)` |
| `api/oauth/authorize/route.ts` | `createOAuthAuthorizeHandler({oauth})` |
| `api/oauth/token/route.ts` | `createOAuthTokenHandler({oauth})` |
| `api/oauth/login/route.ts` | `createOAuthLoginHandler({oauth})` |
| `api/mcp/sse/route.ts` | `createMCPSseHandler(agent)` |
| `api/mcp/message/route.ts` | `createMCPMessageHandler(agent)` |

## Imports

```typescript
import { UniversalAgent, OAuthServer } from '@lite-toon/bridge';
import { createNextAgentHandler } from '@lite-toon/bridge/next';
```

## OpenAPI handler pattern

```typescript
createOpenApiSpecHandler(agent, {
  getExportOptions: (req) => ({
    baseUrl: `${proto}://${host}`,
    oauth: { authorizationUrl, tokenUrl, scopes },
  }),
});
```

## Add capability later

Register on agent → **no route changes**

## Deploy headers

Reverse proxy must set: `host`, `x-forwarded-proto: https`

## Verify

```bash
npm run build
curl localhost:3000/api/openapi.json
npm run test:oauth -w @lite-toon/demo
```

## Mistakes

❌ Logic in routes · ❌ Multiple agents · ❌ `@lite-toon/core` in app · ❌ TOON for GPT
