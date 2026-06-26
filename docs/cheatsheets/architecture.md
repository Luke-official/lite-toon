# Architecture — Cheat Sheet

## Monorepo layout

```
packages/toon          → TOON parser/formatter
packages/core          → UniversalAgent, registry, security
packages/auth          → OAuthServer, AuthStore
packages/adapter-next  → Next.js route factories
packages/bridge        → public SDK facade
apps/demo              → reference app
```

## Dependency rule

```
adapters → auth, core, toon
core, toon → NOTHING from frameworks
apps/demo → @lite-toon/bridge only
```

## UniversalAgent

```typescript
const agent = new UniversalAgent({
  tokenResolver: oauthServer,   // TokenResolver
  capabilities: [...],          // Capability[]
});
// agent.registry  → CapabilityRegistry
// agent.gatekeeper → SecurityGatekeeper
```

## Layers

| Layer | Package | Role |
|---|---|---|
| Translation | `toon` | parse/format TOON |
| Platform | `core` + `auth` | registry, security, OAuth |
| Transport | `adapter-next` | HTTP/MCP/SSE handlers |
| Application | your app | capabilities |

## Route factories

| Factory | Endpoint |
|---|---|
| `createNextAgentHandler` | `POST /api/agent` |
| `createNextToolsHandler` | `POST /api/tools/{name}` |
| `createMCPMessageHandler` | `POST /api/mcp/message` |
| `createMCPSseHandler` | `GET /api/mcp/sse` |
| `createOAuthAuthorizeHandler` | `GET /api/oauth/authorize` |
| `createOAuthTokenHandler` | `POST /api/oauth/token` |
| `createOAuthLoginHandler` | `POST /api/oauth/login` |
| `createOpenApiSpecHandler` | `GET /api/openapi.json` |

## Schema export (one registry)

```
registry.exportMcpTools()                  → Claude
registry.exportOpenApiDocument(opts)       → ChatGPT, Gemini
registry.exportGeminiFunctionDeclarations()  → Gemini API
```

## Request flow (tools)

```
HTTP → gatekeeper.checkAccess → registry.execute → capability.execute → JSON
```

## Build

`npm run build` · Turbo `dependsOn: ^build` · tsup → `dist/`

## Anti-patterns

❌ Business logic in routes · ❌ core imports next · ❌ TOON for ChatGPT
