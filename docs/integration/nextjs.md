# Next.js Integration

> **Cheat sheet:** [nextjs.md](../cheatsheets/nextjs.md)

Step-by-step guide to wire Lite-Toon into a Next.js App Router application.

## Prerequisites

- Next.js 16+ with App Router
- TypeScript
- Lite-Toon monorepo packages (or `@lite-toon/bridge` from npm when published)

## Overview

Integration requires four pieces:

1. **OAuth server** — `OAuthServer` + `AuthStore`
2. **Agent singleton** — `UniversalAgent` with capabilities + token resolver
3. **API routes** — thin delegates to adapter factories
4. **Login page** — for OAuth authorize flow (browser redirect)

## Step 1: Install dependencies

In a monorepo workspace:

```json
{
  "dependencies": {
    "@lite-toon/bridge": "*"
  }
}
```

Run `npm install` and `npm run build` from the monorepo root.

## Step 2: Configure OAuth

Create `src/lib/auth.ts`:

```typescript
import { InMemoryAuthStore, OAuthServer } from '@lite-toon/bridge';

const authStore = new InMemoryAuthStore();

export const oauthServer = new OAuthServer({
  store: authStore,
  clientId: process.env.OAUTH_CLIENT_ID ?? 'my-app',
  allowedRedirectUris: [
    'https://chat.openai.com/aip/oauth/callback',
    'https://chatgpt.com/aip/oauth/callback',
    'https://your-domain.com/oauth/callback',
  ],
});
```

For production, replace `InMemoryAuthStore` with your own `AuthStore` implementation. See [Security](../security/overview.md).

## Step 3: Define capabilities

Create `src/capabilities/index.ts`:

```typescript
import { Capability } from '@lite-toon/bridge';

export const getProducts: Capability = {
  name: 'getProducts',
  description: 'Returns the list of available products.',
  scopes: ['catalog:read'],
  execute: async () => {
    const products = await db.products.findMany();
    return { success: true, data: products };
  },
};

// ... more capabilities
```

See [Capabilities Guide](../concepts/capabilities.md) for patterns and best practices.

## Step 4: Create agent singleton

Create `src/agent.ts`:

```typescript
import { UniversalAgent } from '@lite-toon/bridge';
import { getProducts, addToCart } from '@/capabilities';
import { oauthServer } from '@/lib/auth';

export const agent = new UniversalAgent({
  tokenResolver: oauthServer,
  capabilities: [getProducts, addToCart],
});
```

Import this singleton in all API routes — never create multiple agent instances.

## Step 5: Wire API routes

### Agent endpoint (TOON/JSON)

`src/app/api/agent/route.ts`:

```typescript
import { createNextAgentHandler } from '@lite-toon/bridge/next';
import { agent } from '@/agent';

export const POST = createNextAgentHandler(agent);
```

### Tools endpoint (ChatGPT / Gemini)

`src/app/api/tools/[name]/route.ts`:

```typescript
import { createNextToolsHandler } from '@lite-toon/bridge/next';
import { agent } from '@/agent';

const handler = createNextToolsHandler(agent);
export const POST = (req: Request, ctx: { params: Promise<{ name: string }> }) =>
  handler(req as any, ctx);
```

### OpenAPI spec

`src/app/api/openapi.json/route.ts`:

```typescript
import { createOpenApiSpecHandler } from '@lite-toon/bridge/next';
import { agent } from '@/agent';

function getBaseUrl(req: Request): string {
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}

export const GET = createOpenApiSpecHandler(agent, {
  getExportOptions: (req) => ({
    baseUrl: getBaseUrl(req),
    title: 'My App Agent API',
    version: '1.0.0',
    oauth: {
      authorizationUrl: `${getBaseUrl(req)}/api/oauth/authorize`,
      tokenUrl: `${getBaseUrl(req)}/api/oauth/token`,
      scopes: {
        'catalog:read': 'Read product catalog',
        'cart:write': 'Modify cart',
      },
    },
  }),
});
```

### OAuth routes

`src/app/api/oauth/authorize/route.ts`:

```typescript
import { createOAuthAuthorizeHandler } from '@lite-toon/bridge/next';
import { oauthServer } from '@/lib/auth';

export const GET = createOAuthAuthorizeHandler({ oauth: oauthServer });
```

`src/app/api/oauth/token/route.ts`:

```typescript
import { createOAuthTokenHandler } from '@lite-toon/bridge/next';
import { oauthServer } from '@/lib/auth';

export const POST = createOAuthTokenHandler({ oauth: oauthServer });
```

`src/app/api/oauth/login/route.ts`:

```typescript
import { createOAuthLoginHandler } from '@lite-toon/bridge/next';
import { oauthServer } from '@/lib/auth';

export const POST = createOAuthLoginHandler({ oauth: oauthServer });
```

### MCP routes (Claude)

`src/app/api/mcp/sse/route.ts`:

```typescript
import { createMCPSseHandler } from '@lite-toon/bridge/next';
import { agent } from '@/agent';

export const GET = createMCPSseHandler(agent);
```

`src/app/api/mcp/message/route.ts`:

```typescript
import { createMCPMessageHandler } from '@lite-toon/bridge/next';
import { agent } from '@/agent';

export const POST = createMCPMessageHandler(agent);
```

## Step 6: Login page

OAuth authorize redirects unauthenticated users to `/login`. Create a page that:

1. Shows a login form
2. Calls `POST /api/oauth/login` with `{ username }`
3. Redirects to `returnUrl` query parameter

See `apps/demo/src/app/login/page.tsx` for the demo implementation.

## Step 7: Build and test

```bash
npm run build
npm run dev
```

Verify:

```bash
# OpenAPI spec loads
curl http://localhost:3000/api/openapi.json

# TOON agent works
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: text/plain" \
  -d 'request[1]{action, params}:
  "getProducts", "{}"'

# OAuth + tools (use test script or manual flow)
npm run test:oauth -w @lite-toon/demo
```

## Route summary

| File | Handler | Method |
|---|---|---|
| `api/agent/route.ts` | `createNextAgentHandler` | POST |
| `api/tools/[name]/route.ts` | `createNextToolsHandler` | POST |
| `api/openapi.json/route.ts` | `createOpenApiSpecHandler` | GET |
| `api/oauth/authorize/route.ts` | `createOAuthAuthorizeHandler` | GET |
| `api/oauth/token/route.ts` | `createOAuthTokenHandler` | POST |
| `api/oauth/login/route.ts` | `createOAuthLoginHandler` | POST |
| `api/mcp/sse/route.ts` | `createMCPSseHandler` | GET |
| `api/mcp/message/route.ts` | `createMCPMessageHandler` | POST |

## Deployment notes

### HTTPS

OAuth redirect URIs and session cookies require HTTPS in production. Set `secure: true` on cookies.

### Base URL detection

OpenAPI and MCP SSE build URLs from request headers:

- `host` — set by your reverse proxy
- `x-forwarded-proto` — must be `https` behind TLS termination

### Environment variables

```bash
OAUTH_CLIENT_ID=my-production-app
```

### ChatGPT setup

1. Deploy your app with HTTPS
2. Import `https://your-domain/api/openapi.json` in Custom GPT Actions
3. Configure OAuth with your authorize/token URLs
4. Enable PKCE

See [Connect Agents](./connect-agents.md) for platform-specific instructions.

## Adding capabilities later

1. Define new `Capability` object
2. Add to `UniversalAgent` capabilities array (or `agent.registry.register()`)
3. No route changes needed — tools, MCP, and OpenAPI auto-discover

## Common mistakes

| Mistake | Fix |
|---|---|
| Business logic in route files | Move to capability `execute()` handlers |
| Multiple `UniversalAgent` instances | Use one singleton |
| Importing `@lite-toon/core` directly | Use `@lite-toon/bridge` |
| Forgetting login page | OAuth authorize needs session cookie |
| Using TOON for ChatGPT | ChatGPT Actions need JSON on `/api/tools/*` |

## Related

- [Demo App](../guide/demo-app.md) — reference implementation
- [Capabilities](../concepts/capabilities.md)
- [Connect Agents](./connect-agents.md)
- [Security](../security/overview.md)
