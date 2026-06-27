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
| `createMCPStreamableHttpHandler` | `GET`+`POST /api/mcp` |
| `createMCPMessageHandler` | `POST /api/mcp/message` |
| `createMCPSseHandler` | `GET /api/mcp/sse` |
| `createNextToolsHandler` | `POST /api/tools/{name}` *(not supported yet)* |
| `createOAuthAuthorizeHandler` | `GET /api/oauth/authorize` |
| `createOAuthTokenHandler` | `POST /api/oauth/token` |
| `createOAuthLoginHandler` | `POST /api/oauth/login` |
| `createOAuthRegisterHandler` | `POST /api/oauth/register` |
| `createOAuthProtectedResourceHandler` | `GET /.well-known/oauth-protected-resource` |
| `createOAuthAuthorizationServerMetadataHandler` | `GET /.well-known/oauth-authorization-server` |
| `createOpenApiSpecHandler` | `GET /api/openapi.json` *(not supported yet)* |

## Schema export (one registry)

```
registry.exportMcpTools()                    → Claude ✅
registry.exportOpenApiDocument(opts)         → ChatGPT — not supported yet
registry.exportGeminiFunctionDeclarations()  → Gemini — not supported yet
```

## Supported today

Next.js App Router · Claude MCP (`/api/mcp`) · TOON (`/api/agent`)

## Request flow (tools)

```
HTTP → gatekeeper.checkAccess → registry.execute → capability.execute → JSON
```

## Build

`npm run build` · Turbo `dependsOn: ^build` · tsup → `dist/`

## Anti-patterns

❌ Business logic in routes · ❌ core imports next · ❌ TOON for ChatGPT
