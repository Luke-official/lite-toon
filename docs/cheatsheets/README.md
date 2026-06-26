# Cheat Sheets

One-page quick references for every Lite-Toon topic. Designed to print or keep open while coding.

| Topic | Cheat sheet |
|---|---|
| Getting started | [getting-started.md](./getting-started.md) |
| Study guide | [study-guide.md](./study-guide.md) |
| Architecture | [architecture.md](./architecture.md) |
| Capabilities | [capabilities.md](./capabilities.md) |
| Capability flows | [capability-flows.md](./capability-flows.md) |
| TOON format | [toon.md](./toon.md) |
| OAuth | [oauth.md](./oauth.md) |
| MCP | [mcp.md](./mcp.md) |
| Security | [security.md](./security.md) |
| Next.js integration | [nextjs.md](./nextjs.md) |
| Connect agents | [connect-agents.md](./connect-agents.md) |
| API reference | [api.md](./api.md) |
| Packages | [packages.md](./packages.md) |
| Demo app | [demo-app.md](./demo-app.md) |

## Universal quick ref

```
YOU WRITE          →  Capability { name, description, schema, scopes, execute }
YOU REGISTER       →  UniversalAgent({ tokenResolver, capabilities })
SDK GENERATES      →  OpenAPI + MCP tools + Gemini declarations
AGENTS CALL        →  /api/tools/*  |  /api/mcp/message  |  /api/agent
AUTH               →  OAuth 2.0 + PKCE → Bearer token → ExecutionContext
```

## Import cheat line

```typescript
import { UniversalAgent, OAuthServer, formatToon } from '@lite-toon/bridge';
import { createNextAgentHandler } from '@lite-toon/bridge/next';
```

## Demo values

| Item | Value |
|---|---|
| Client ID | `lite-toon-demo` |
| Scopes | `cart:read cart:write` |
| Local URL | `http://localhost:3000` |
| Session cookie | `lite_toon_session` |

## Transport picker

| Need | Use |
|---|---|
| ChatGPT / Gemini | `GET /api/openapi.json` + `POST /api/tools/{name}` |
| Claude | `GET /api/mcp/sse` + `POST /api/mcp/message` |
| Token savings | `POST /api/agent` (TOON) |
| Local UI test | `POST /api/demo` |
