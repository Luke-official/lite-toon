# Architecture

> **Cheat sheet:** [architecture.md](../cheatsheets/architecture.md)

Deep dive into Lite-Toon's monorepo structure, dependency rules, runtime layers, and data flows.

## Design principles

1. **Framework-agnostic core** — `packages/core` and `packages/toon` have zero framework imports
2. **Adapters are thin** — transport logic lives in `packages/adapter-next`; demo routes are 3–10 lines
3. **One registry, many exports** — register capabilities once; auto-generate OpenAPI, MCP, Gemini schemas
4. **Inward dependencies only** — adapters → auth/core/toon; core never imports adapters
5. **TOON by default** — `/api/agent` uses TOON unless JSON is requested; agent platforms use JSON

## High-level diagram

```mermaid
flowchart TB
    subgraph users ["End Users"]
        U["Natural language"]
    end

    subgraph agents ["AI Agents"]
        GPT["ChatGPT"]
        Claude["Claude MCP"]
        Gemini["Gemini"]
    end

    subgraph network ["HTTP API Layer"]
        OpenAPI["GET /api/openapi.json"]
        Tools["POST /api/tools/*"]
        OAuth["OAuth authorize + token"]
        MCPsse["GET /api/mcp/sse"]
        MCPmsg["POST /api/mcp/message"]
        Agent["POST /api/agent"]
        Demo["POST /api/demo"]
    end

    subgraph packages ["@lite-toon/* Packages"]
        Bridge["bridge — public SDK"]
        Adapter["adapter-next"]
        Auth["auth — OAuth + PKCE"]
        Core["core — agent + registry"]
        Toon["toon — parser + formatter"]
    end

    subgraph app ["Business Logic"]
        Cap["Capabilities"]
    end

    U --> agents
    GPT --> OpenAPI
    GPT --> Tools
    Gemini --> OpenAPI
    Gemini --> Tools
    Claude --> MCPsse
    Claude --> MCPmsg
    agents --> OAuth
    Tools --> Adapter
    MCPmsg --> Adapter
    Agent --> Adapter
    Demo --> Adapter
    Adapter --> Auth
    Adapter --> Core
    Core --> Toon
    Core --> Cap
    Bridge --> Adapter
    Bridge --> Auth
    Bridge --> Core
```

## Monorepo layout

```
lite-toon/
├── package.json              Root workspace + Turbo scripts
├── turbo.json                Build pipeline (dependsOn: ^build)
├── tsconfig.json             Shared TypeScript base
│
├── packages/
│   ├── toon/                 @lite-toon/toon
│   │   └── src/
│   │       ├── parser.ts     TOON string → { entity, records }
│   │       ├── formatter.ts  objects → TOON string
│   │       ├── types.ts      ToonParseResult, ToonObject
│   │       └── index.ts
│   │
│   ├── core/                 @lite-toon/core
│   │   └── src/
│   │       ├── agent.ts      UniversalAgent hub
│   │       ├── registry.ts   CapabilityRegistry
│   │       ├── security.ts   SecurityGatekeeper + rate limiter
│   │       ├── openapi.ts    OpenAPI 3.1 document builder
│   │       ├── types.ts      Capability, ExecutionContext, …
│   │       └── index.ts
│   │
│   ├── auth/                 @lite-toon/auth
│   │   └── src/
│   │       ├── server.ts     OAuthServer (implements TokenResolver)
│   │       ├── store.ts      InMemoryAuthStore
│   │       ├── types.ts      AuthStore interface, OAuth types
│   │       └── index.ts
│   │
│   ├── adapter-next/         @lite-toon/adapter-next
│   │   └── src/
│   │       ├── rest.ts       createNextAgentHandler
│   │       ├── tools.ts      createNextToolsHandler
│   │       ├── mcp-message.ts createMCPMessageHandler
│   │       ├── sse.ts        createMCPSseHandler
│   │       ├── oauth.ts      OAuth route factories
│   │       ├── openapi.ts    createOpenApiSpecHandler
│   │       └── index.ts
│   │
│   └── bridge/               @lite-toon/bridge
│       └── src/
│           ├── index.ts      Re-exports core + toon + auth
│           ├── next.ts       Re-exports adapter-next
│           └── toon.ts       Re-exports toon (subpath)
│
└── apps/
    └── demo/                 @lite-toon/demo
        └── src/
            ├── agent.ts              UniversalAgent singleton
            ├── lib/auth.ts           OAuthServer config
            ├── demo/capabilities.ts  E-commerce business logic
            └── app/
                ├── page.tsx          Chat UI + TOON log
                ├── connect/page.tsx  Merchant setup guide
                ├── login/page.tsx    OAuth login form
                └── api/              Thin route intercoms
                    ├── agent/route.ts
                    ├── demo/route.ts
                    ├── openapi.json/route.ts
                    ├── tools/[name]/route.ts
                    ├── oauth/
                    │   ├── authorize/route.ts
                    │   ├── token/route.ts
                    │   └── login/route.ts
                    └── mcp/
                        ├── sse/route.ts
                        └── message/route.ts
```

## Package dependency graph

```mermaid
flowchart LR
    bridge["@lite-toon/bridge"]
    adapter["@lite-toon/adapter-next"]
    auth["@lite-toon/auth"]
    core["@lite-toon/core"]
    toon["@lite-toon/toon"]
    demo["apps/demo"]

    bridge --> adapter
    bridge --> auth
    bridge --> core
    bridge --> toon
    adapter --> auth
    adapter --> core
    adapter --> toon
    auth --> core
    demo --> bridge
```

| Package | Depends on | Must NOT depend on |
|---|---|---|
| `toon` | — | core, auth, adapters, next |
| `core` | — | toon (peer usage via adapters), auth, adapters, next |
| `auth` | `core` (TokenResolver types) | adapters, next |
| `adapter-next` | core, toon, auth | — (Next.js is expected) |
| `bridge` | all packages | — |
| `demo` | bridge | direct core imports (use bridge) |

## Runtime layers

### Layer 1 — Translation (`@lite-toon/toon`)

Serializes/deserializes the TOON wire format. Used by `createNextAgentHandler` for `/api/agent` request parsing and response formatting. See [TOON Format](../concepts/toon.md).

### Layer 2 — Platform (`@lite-toon/core` + `@lite-toon/auth`)

**UniversalAgent** bundles:

- `CapabilityRegistry` — register, execute, export schemas
- `SecurityGatekeeper` — rate limiting, token resolution, scope checks

**OAuthServer** implements `TokenResolver`:

- Login sessions (cookie-based)
- Authorization code + PKCE
- Bearer access tokens with scopes

### Layer 3 — Transport (`@lite-toon/adapter-next`)

Route factories that translate HTTP/MCP/SSE into core calls:

| Factory | Protocol |
|---|---|
| `createNextAgentHandler` | TOON/JSON REST |
| `createNextToolsHandler` | JSON REST per capability |
| `createMCPMessageHandler` | JSON-RPC 2.0 |
| `createMCPSseHandler` | Server-Sent Events |
| `createOAuthAuthorizeHandler` | OAuth 2.0 redirect |
| `createOAuthTokenHandler` | OAuth token exchange |
| `createOAuthLoginHandler` | Demo session login |
| `createOpenApiSpecHandler` | OpenAPI 3.1 JSON |

### Layer 4 — Application (`apps/demo`)

- **Capabilities** — business logic in `demo/capabilities.ts`
- **Routes** — thin delegates to adapter factories
- **UI** — chat simulator with TOON System Log

## Request lifecycle (tools endpoint)

```mermaid
sequenceDiagram
    participant Client as AI Agent
    participant Route as /api/tools/name
    participant GK as SecurityGatekeeper
    participant OAuth as OAuthServer
    participant Reg as CapabilityRegistry
    participant Cap as Capability.execute

    Client->>Route: POST + Bearer + JSON body
    Route->>GK: checkAccess(requireAuth, scopes)
    GK->>OAuth: resolve(accessToken)
    OAuth-->>GK: {userId, scopes}
    GK-->>Route: ResolvedAccess
    Route->>Reg: execute(name, params, context)
    Reg->>Cap: execute(params, context)
    Cap-->>Reg: AgentResponse
    Reg-->>Route: AgentResponse
    Route-->>Client: JSON
```

## Request lifecycle (/api/agent TOON)

```mermaid
sequenceDiagram
    participant Client
    participant Handler as createNextAgentHandler
    participant Toon as parseToon/formatToon
    participant GK as SecurityGatekeeper
    participant Reg as CapabilityRegistry

    Client->>Handler: POST text/plain TOON body
    Handler->>GK: checkAccess (optional auth)
    Handler->>Toon: parseToon(body)
    Toon-->>Handler: {action, params}
    Handler->>Reg: execute(action, params, context)
    Reg-->>Handler: AgentResponse
    Handler->>Toon: formatToon(entityName, data)
    Toon-->>Handler: TOON string
    Handler-->>Client: text/plain TOON
```

## Schema export pipeline

One `CapabilityRegistry` feeds three export methods:

```
CapabilityRegistry
├── exportMcpTools()                    → Claude MCP tools/list
├── exportGeminiFunctionDeclarations()  → Gemini function calling
└── exportOpenApiDocument(options)      → ChatGPT Actions / Gemini Extensions
```

OpenAPI generates one `POST` path per capability at `/api/tools/{name}` with:

- `operationId` = capability name
- `requestBody` schema from `capability.schema`
- `security` from `capability.scopes`

## Build system

- **npm workspaces** — `apps/*`, `packages/*`
- **Turbo** — orchestrates `dev`, `build`, `lint` with `dependsOn: ["^build"]`
- **tsup** — bundles each package to `dist/`
- **Next.js** — builds `apps/demo` to `.next/`

Build order: `toon` → `core` → `auth` → `adapter-next` → `bridge` → `demo`

## Extension points

| Want to… | Extend |
|---|---|
| Add business logic | New `Capability` objects |
| Custom auth store | Implement `AuthStore` interface |
| Custom rate limiter | Implement `RateLimiterStore` interface |
| Custom token resolver | Implement `TokenResolver` (or use OAuthServer) |
| New framework | New package like `adapter-express` depending on core |
| Production tokens | Replace `randomToken()` in OAuthServer |

## Anti-patterns

| Don't | Do instead |
|---|---|
| Put business logic in route files | Register capabilities, keep routes thin |
| Import `@lite-toon/core` in app code | Import from `@lite-toon/bridge` |
| Import Next.js in `packages/core` | Keep core framework-agnostic |
| Hardcode tool paths | Use dynamic `[name]` route + registry |
| Use TOON for ChatGPT Actions | JSON on `/api/tools/*` (ChatGPT doesn't parse TOON) |

## Related docs

- [Packages](../reference/packages.md) — per-package API surface
- [Capabilities](../concepts/capabilities.md) — defining tools
- [Security](../security/overview.md) — production hardening
- [Study Guide](../guide/study-guide.md) — learning path
