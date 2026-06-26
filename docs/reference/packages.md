# Packages Reference

> **Cheat sheet:** [packages.md](../cheatsheets/packages.md)

Per-package API surface for all `@lite-toon/*` workspace packages.

## Import guide

| You are building… | Import from |
|---|---|
| Any application | `@lite-toon/bridge` |
| Next.js route handlers | `@lite-toon/bridge/next` |
| TOON only | `@lite-toon/bridge` or `@lite-toon/toon` |
| Contributing to core | `@lite-toon/core` (internal) |

---

## `@lite-toon/toon`

Framework-agnostic TOON parser and formatter.

**Location:** `packages/toon/`

### Exports

```typescript
import { formatToon, parseToon } from '@lite-toon/toon';
import type { ToonObject, ToonParseResult } from '@lite-toon/toon';
```

### `formatToon(entityName, records?)`

Formats an array of objects into a TOON string.

```typescript
formatToon('Users', [{ id: 'u1', name: 'Alice' }]);
// Users[1]{id, name}:
//   u1, "Alice"
```

Returns `EntityName[0]{}:` for null/empty arrays.

### `parseToon(input)`

Parses a TOON string.

```typescript
const result = parseToon(toonString);
// { success: true, data: { entity: 'Users', records: [...] } }
// { success: false, error: '...' }
```

### Types

```typescript
interface ToonParseResult {
  success: boolean;
  data?: { entity: string; records: Record<string, any>[] };
  error?: string;
}
```

See [TOON Format](../concepts/toon.md) for the full specification.

---

## `@lite-toon/core`

Framework-agnostic agent platform: registry, security, OpenAPI builder.

**Location:** `packages/core/`

### Exports

```typescript
import {
  UniversalAgent,
  CapabilityRegistry,
  SecurityGatekeeper,
  InMemoryRateLimiterStore,
  buildOpenApiDocument,
} from '@lite-toon/core';
```

### `UniversalAgent`

Central hub bundling registry + gatekeeper.

```typescript
const agent = new UniversalAgent({
  tokenResolver: myOAuthServer,       // optional TokenResolver
  capabilities: [cap1, cap2],         // optional initial capabilities
});

agent.registry   // CapabilityRegistry
agent.gatekeeper // SecurityGatekeeper
```

### `CapabilityRegistry`

| Method | Description |
|---|---|
| `register(capability)` | Add or overwrite a capability |
| `list()` | All registered capabilities |
| `has(name)` | Check if capability exists |
| `execute(name, params, context?)` | Run capability with scope checks |
| `exportMcpTools()` | MCP tool schema array |
| `exportGeminiFunctionDeclarations()` | Gemini function declarations |
| `exportOpenApiDocument(options)` | OpenAPI 3.1 document |

### `SecurityGatekeeper`

```typescript
const gatekeeper = new SecurityGatekeeper({
  store: new InMemoryRateLimiterStore(60000),  // optional
  maxRequests: 100,                               // default
  windowMs: 60000,                                // default
  tokenResolver: oauthServer,                     // optional
});

const access = await gatekeeper.checkAccess(
  { agentId: 'my-agent', accessToken: '...', ip: '1.2.3.4' },
  { requireAuth: true, requiredScopes: ['cart:write'] }
);
// → { userId, scopes, agentId }
```

Throws on denial:

| Error prefix | Meaning |
|---|---|
| `TOON_RATE_LIMIT_EXCEEDED` | Too many requests |
| `TOON_UNAUTHORIZED` | Missing/invalid token or API key |
| `TOON_FORBIDDEN` | Missing scopes |

### `InMemoryRateLimiterStore`

```typescript
new InMemoryRateLimiterStore(windowMs: number)
```

Implements `RateLimiterStore` with in-memory sliding window.

### `buildOpenApiDocument(capabilities, options)`

Low-level OpenAPI builder. Prefer `registry.exportOpenApiDocument()`.

### Types

| Type | Purpose |
|---|---|
| `Capability` | Tool definition |
| `AgentRequest` | `{ action, params? }` |
| `AgentResponse` | `{ success, message?, data? }` |
| `ExecutionContext` | `{ userId, agentId, scopes }` |
| `TokenResolver` | `{ resolve(token) → ResolvedToken \| null }` |
| `SecurityContext` | `{ apiKey?, accessToken?, ip?, agentId }` |
| `AccessCheckOptions` | `{ requireAuth?, requiredScopes? }` |
| `ResolvedAccess` | `{ userId, scopes, agentId }` |
| `OpenApiExportOptions` | `{ baseUrl, oauth, title?, version?, toolsPathPrefix? }` |
| `RateLimiterStore` | `{ increment(key), reset(key) }` |

---

## `@lite-toon/auth`

OAuth 2.0 authorization server with PKCE.

**Location:** `packages/auth/`

### Exports

```typescript
import { OAuthServer, InMemoryAuthStore } from '@lite-toon/auth';
import type { AuthStore, OAuthServerConfig, TokenResponse } from '@lite-toon/auth';
```

### `OAuthServer`

Implements `TokenResolver` from core.

```typescript
const oauth = new OAuthServer({
  store: new InMemoryAuthStore(),
  clientId: 'my-app',
  allowedRedirectUris: ['https://example.com/callback'],
  tokenTtlSeconds: 3600,    // optional
  codeTtlSeconds: 300,        // optional
  sessionTtlSeconds: 86400,   // optional
});
```

| Method | Description |
|---|---|
| `login(username)` | Create user + session → `{ sessionId, userId }` |
| `resolveSession(sessionId)` | Session → userId |
| `logout(sessionId)` | Delete session |
| `authorize(userId, request)` | Issue auth code → `{ redirectUrl }` |
| `issueToken(request)` | PKCE code exchange → `TokenResponse` |
| `issueAccessTokenForUser(userId, scopes)` | Direct token (demo/testing) |
| `resolve(accessToken)` | Token → `{ userId, scopes }` (TokenResolver) |

### `InMemoryAuthStore`

Demo store implementing `AuthStore`. All data in RAM.

### `AuthStore` interface

Implement for production (Redis, PostgreSQL, etc.). See [OAuth](../concepts/oauth.md#authstore-interface).

---

## `@lite-toon/adapter-next`

Next.js App Router route factories.

**Location:** `packages/adapter-next/`

### Exports

```typescript
import {
  createNextAgentHandler,
  createNextToolsHandler,
  createMCPMessageHandler,
  createMCPSseHandler,
  createOAuthAuthorizeHandler,
  createOAuthTokenHandler,
  createOAuthLoginHandler,
  createOpenApiSpecHandler,
  SESSION_COOKIE,
} from '@lite-toon/adapter-next';
```

### Route factories

| Factory | HTTP | Creates |
|---|---|---|
| `createNextAgentHandler(agent)` | `POST` | TOON/JSON agent endpoint |
| `createNextToolsHandler(agent)` | `POST` | Dynamic tools route handler |
| `createMCPMessageHandler(agent)` | `POST` | MCP JSON-RPC handler |
| `createMCPSseHandler(agent)` | `GET` | MCP SSE stream |
| `createOAuthAuthorizeHandler({ oauth })` | `GET` | OAuth authorize redirect |
| `createOAuthTokenHandler({ oauth })` | `POST` | OAuth token exchange |
| `createOAuthLoginHandler({ oauth })` | `POST` | Demo login + session cookie |
| `createOpenApiSpecHandler(agent, { getExportOptions })` | `GET` | OpenAPI JSON document |

### `SESSION_COOKIE`

Constant: `'lite_toon_session'`

### Options types

```typescript
interface OAuthAdapterOptions {
  oauth: OAuthServer;
  loginPath?: string;  // default '/login'
}

interface OpenApiHandlerOptions {
  getExportOptions: (req: NextRequest) => OpenApiExportOptions;
}
```

---

## `@lite-toon/bridge`

Public SDK facade — **this is what application developers import**.

**Location:** `packages/bridge/`

### Main entry

```typescript
import {
  UniversalAgent,
  CapabilityRegistry,
  SecurityGatekeeper,
  formatToon,
  parseToon,
  OAuthServer,
  InMemoryAuthStore,
} from '@lite-toon/bridge';
```

Re-exports everything from `core`, `toon`, and `auth`.

### Next.js subpath

```typescript
import {
  createNextAgentHandler,
  createNextToolsHandler,
  createMCPMessageHandler,
  createMCPSseHandler,
  createOAuthAuthorizeHandler,
  createOAuthTokenHandler,
  createOAuthLoginHandler,
  createOpenApiSpecHandler,
} from '@lite-toon/bridge/next';
```

### TOON subpath

```typescript
import { formatToon, parseToon } from '@lite-toon/bridge/toon';
```

---

## `@lite-toon/demo`

Reference Next.js application. Not published to npm.

**Location:** `apps/demo/`

See [Demo App](../guide/demo-app.md) for the full walkthrough.

### Test scripts

| Script | Command |
|---|---|
| `test:api` | `npm run test:api -w @lite-toon/demo` |
| `test:oauth` | `npm run test:oauth -w @lite-toon/demo` |
| `test:mcp` | `npm run test:mcp -w @lite-toon/demo` |

---

## Build outputs

All packages build to `dist/` via tsup:

```
packages/toon/dist/
packages/core/dist/
packages/auth/dist/
packages/adapter-next/dist/
packages/bridge/dist/
```

Run `npm run build` from the monorepo root to build all packages in dependency order (Turbo `dependsOn: ^build`).

---

## Related

- [Architecture](../architecture/overview.md)
- [Next.js Integration](../integration/nextjs.md)
- [Study Guide](../guide/study-guide.md)
