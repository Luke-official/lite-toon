# Packages — Cheat Sheet

## Import map

```typescript
import { UniversalAgent, OAuthServer, formatToon } from '@lite-toon/bridge';
import { createNextAgentHandler } from '@lite-toon/bridge/next';
import { parseToon } from '@lite-toon/toon';           // or bridge
import { CapabilityRegistry } from '@lite-toon/core';   // internal only
```

## Package roles

| Package | Import as | Contains |
|---|---|---|
| `toon` | `@lite-toon/toon` | formatToon, parseToon |
| `core` | `@lite-toon/core` | UniversalAgent, Registry, Gatekeeper |
| `auth` | `@lite-toon/auth` | OAuthServer, InMemoryAuthStore |
| `adapter-next` | `@lite-toon/adapter-next` | Route factories |
| `bridge` | `@lite-toon/bridge` | **Use this in apps** |

## Dependency graph

```
bridge → adapter-next, auth, core, toon
adapter-next → auth, core, toon
auth → core
demo → bridge
```

## core exports

`UniversalAgent` · `CapabilityRegistry` · `SecurityGatekeeper` · `InMemoryRateLimiterStore` · `buildOpenApiDocument`

## auth exports

`OAuthServer` · `InMemoryAuthStore` · `AuthStore` (interface)

## adapter-next exports

`createNextAgentHandler` · `createNextToolsHandler` · `createMCPMessageHandler` · `createMCPSseHandler` · `createOAuth*Handler` · `createOpenApiSpecHandler`

## Key types (core)

`Capability` · `AgentResponse` · `ExecutionContext` · `TokenResolver` · `SecurityContext` · `OpenApiExportOptions`

## Registry methods

```
register(cap) · list() · has(name) · execute(name, params, ctx)
exportMcpTools() · exportOpenApiDocument(opts) · exportGeminiFunctionDeclarations()
```

## Gatekeeper

```typescript
await gatekeeper.checkAccess(context, { requireAuth, requiredScopes });
```

## Build

```bash
npm run build   # tsup → packages/*/dist/
```

## Extend

| Need | Implement |
|---|---|
| Custom auth store | `AuthStore` |
| Custom rate limit | `RateLimiterStore` |
| New framework | New `adapter-*` package |
| Custom tokens | Replace OAuthServer token gen |
