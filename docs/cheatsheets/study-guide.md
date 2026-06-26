# Study Guide — Cheat Sheet

## 8-day map

| Day | Focus | Key files |
|---|---|---|
| 1 | Run demo, 4 capabilities | `capabilities.ts`, `agent.ts` |
| 2 | TOON format | `packages/toon/src/*` |
| 3 | Registry + gatekeeper | `registry.ts`, `security.ts`, `types.ts` |
| 4 | OAuth + per-user carts | `auth/server.ts`, `lib/auth.ts` |
| 5 | Adapters / routes | `adapter-next/src/*`, `app/api/*` |
| 6 | Schema export | `registry.ts`, `openapi.ts` |
| 7 | Security / production | `security.md`, README limits |
| 8 | Add new capability | `capabilities.md` |

## Three rings

```
Transport (adapters)  →  Platform (core+auth)  →  Your capabilities
```

## Glossary (30 sec)

| Term | Meaning |
|---|---|
| Capability | Named tool with schema + execute() |
| Registry | Stores + runs + exports capabilities |
| Gatekeeper | Rate limit + token + scopes |
| ExecutionContext | `{userId, agentId, scopes}` |
| Bridge | Public import `@lite-toon/bridge` |
| Thin route | 3-line API route → adapter factory |

## Demo capabilities

`getProducts` · `getCart` · `addToCart` · `clearCart`

## Endpoint formats

| Path | Format |
|---|---|
| `/api/agent` | TOON (default) or JSON |
| `/api/tools/*` | JSON only |
| `/api/mcp/message` | JSON-RPC |
| `/api/demo` | JSON + TOON log |

## Exercises checklist

- [ ] Run all 3 test scripts
- [ ] Trace `addToCart` from GPT → capability
- [ ] Read `POST /api/demo/route.ts` end-to-end
- [ ] Open `/api/openapi.json` and match to registry
- [ ] List 3 demo-only security shortcuts

## Ignore

Root `src/` = legacy pre-monorepo. Use `packages/*` + `apps/demo/*`.
