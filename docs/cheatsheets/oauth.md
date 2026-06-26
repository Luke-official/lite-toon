# OAuth — Cheat Sheet

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/oauth/login` | Session cookie |
| GET | `/api/oauth/authorize` | Auth code redirect |
| POST | `/api/oauth/token` | Code → access_token |

## Demo config

| Item | Value |
|---|---|
| Client ID | `lite-toon-demo` |
| Scopes | `cart:read cart:write` |
| Cookie | `lite_toon_session` |
| Token prefix | `lt_...` |

## PKCE flow (5 steps)

```
1. code_verifier = random(32) base64url
2. code_challenge = SHA256(verifier) base64url
3. GET /authorize?code_challenge&client_id&redirect_uri&scope
4. User logs in → redirect ?code=
5. POST /token {code, code_verifier, grant_type, client_id, redirect_uri}
```

## Token response

```json
{
  "access_token": "lt_...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "cart:read cart:write"
}
```

## Tool call

```http
Authorization: Bearer lt_...
```

## TTL defaults

| Record | TTL |
|---|---|
| Access token | 3600s |
| Auth code | 300s |
| Session | 86400s |

## Scopes → capabilities

| Scope | Tools |
|---|---|
| `cart:read` | getProducts, getCart |
| `cart:write` | addToCart, clearCart |

## OAuthServer key methods

```typescript
login(username)           → session
authorize(userId, req)    → redirectUrl + code
issueToken(req)           → TokenResponse (PKCE)
resolve(accessToken)      → {userId, scopes}  // TokenResolver
```

## ChatGPT OAuth fields

```
Authorization URL: https://domain/api/oauth/authorize
Token URL:         https://domain/api/oauth/token
Client ID:         lite-toon-demo
Scope:             cart:read cart:write
PKCE:              enabled
Client Secret:     (empty)
```

## Test

```bash
npm run test:oauth -w @lite-toon/demo
```

## Production ⚠️

Replace: `Math.random()` tokens · in-memory store · username-only login
