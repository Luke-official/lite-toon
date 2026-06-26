# Security — Cheat Sheet

## Gatekeeper checks (order)

```
1. Rate limit (agentId or IP)
2. API key (legacy placeholder)
3. Bearer token resolve (if requireAuth or token present)
4. Scope check (if requiredScopes set)
```

## Error prefixes

| Prefix | HTTP |
|---|---|
| `TOON_RATE_LIMIT_EXCEEDED` | 429 |
| `TOON_UNAUTHORIZED` | 401 |
| `TOON_FORBIDDEN` | 403 |

## Rate limit defaults

- **100 req / 60s** per `x-agent-id` → IP → `"anonymous"`
- Store: in-memory (per process)

## Endpoint auth matrix

| Path | Demo | Production |
|---|---|---|
| `/api/tools/*` | Bearer + scopes | ✅ keep |
| `/api/mcp/message` tools/call | Bearer + scopes | ✅ keep |
| `/api/agent` | Optional | **Require auth** |
| `/api/demo` | Auto token | **Remove** |
| `/api/openapi.json` | Public | Public OK |

## Demo-only ⚠️

| Issue | Fix |
|---|---|
| Username-only login | Real IdP |
| `Math.random()` tokens | `crypto.randomBytes` / JWT |
| In-memory store | Redis / DB |
| No `secure` cookie | HTTPS + secure flag |
| Anonymous /api/agent | requireAuth |

## Per-user isolation rule

```
userId comes from token resolution ONLY — never from request body
```

## Scope principle

Grant minimum scopes. Read-only agents → `cart:read` only.

## Production checklist

- [ ] Persistent AuthStore
- [ ] Crypto-secure tokens
- [ ] HTTPS + secure cookies
- [ ] Shared rate limiter (Redis)
- [ ] Remove / protect /api/demo
- [ ] requireAuth on /api/agent
- [ ] Validate redirect URIs
- [ ] Redact tokens in logs

## Safe to publish

`lite-toon-demo` client ID · source code · OpenAPI spec

## Never commit

`.env` · `.env.local` · API keys · client secrets
