# API Reference

> **Cheat sheet:** [api.md](../cheatsheets/api.md)

Complete reference for all HTTP endpoints exposed by the Lite-Toon demo app. Your own app wired with the SDK will expose the same routes if you follow [Next.js Integration](../integration/nextjs.md).

**Base URL (local):** `http://localhost:3000`

## Common headers

| Header | Endpoints | Description |
|---|---|---|
| `Authorization: Bearer <token>` | Tools, MCP, Agent (optional) | OAuth access token |
| `x-agent-id` | All agent endpoints | Rate-limit key + audit identifier. Default: `anonymous-agent` |
| `Content-Type: text/plain` | `/api/agent` | TOON request body |
| `Content-Type: application/json` | Tools, MCP, OAuth, Agent | JSON request body |
| `Accept: application/json` | `/api/agent` | Request JSON response instead of TOON |

## Error format

### JSON endpoints

```json
{ "success": false, "message": "TOON_UNAUTHORIZED: Bearer access token is required." }
```

### TOON endpoint (`/api/agent`)

```
error[1]{message}:
  "TOON_UNAUTHORIZED: Bearer access token is required."
```

### HTTP status codes

| Status | Meaning |
|---|---|
| `200` | Success |
| `204` | MCP `notifications/initialized` ack |
| `400` | Bad request, parse error, capability failure |
| `401` | Missing or invalid Bearer token |
| `403` | Missing required OAuth scopes |
| `404` | Unknown capability name (tools route) |
| `429` | Rate limit exceeded (`TOON_RATE_LIMIT_EXCEEDED`) |
| `500` | Internal server error |

---

## Agent endpoints

### `POST /api/agent`

Direct agent access with TOON or JSON. Used for token-efficient integrations and internal tooling.

**Auth:** Optional. Anonymous users can call capabilities that don't require auth (demo: `getProducts` works; cart operations need a token in practice via gatekeeper context).

**Rate limit:** 100 req/min per `x-agent-id` (default).

#### TOON request

```http
POST /api/agent
Content-Type: text/plain
x-agent-id: my-agent

request[1]{action, params}:
  "getProducts", "{}"
```

#### TOON response

```http
HTTP/1.1 200 OK
Content-Type: text/plain

GetProductsResult[3]{id, name, price}:
  p1, "Nike Shoes", 120
  p2, "Adidas T-Shirt", 35
  p3, "Puma Socks", 15
```

#### JSON request

```http
POST /api/agent
Content-Type: application/json
Accept: application/json
x-agent-id: my-agent

{"action":"getProducts","params":{}}
```

#### JSON response

```json
{
  "success": true,
  "data": [
    { "id": "p1", "name": "Nike Shoes", "price": 120 },
    { "id": "p2", "name": "Adidas T-Shirt", "price": 35 },
    { "id": "p3", "name": "Puma Socks", "price": 15 }
  ]
}
```

#### Add to cart (authenticated TOON)

```http
POST /api/agent
Content-Type: text/plain
Authorization: Bearer <access_token>
x-agent-id: my-agent

request[1]{action, params}:
  "addToCart", "{\"productId\":\"p1\",\"quantity\":2}"
```

---

## Tools endpoints (ChatGPT / Gemini)

### `POST /api/tools/{name}`

Execute a single capability by name. **Auth required.** JSON only.

**Path parameters:**

| Param | Description |
|---|---|
| `name` | Capability name (e.g. `addToCart`, `getCart`) |

#### Example: addToCart

```http
POST /api/tools/addToCart
Authorization: Bearer <access_token>
Content-Type: application/json
x-agent-id: chatgpt-gpt

{"productId": "p1", "quantity": 2}
```

#### Success response

```json
{
  "success": true,
  "data": [
    { "productId": "p1", "quantity": 2 }
  ]
}
```

#### Error response (missing scope)

```http
HTTP/1.1 403 Forbidden

{"success": false, "message": "TOON_FORBIDDEN: Missing scopes: cart:write"}
```

#### Example: getCart

```http
POST /api/tools/getCart
Authorization: Bearer <access_token>
Content-Type: application/json

{}
```

#### Example: getProducts

```http
POST /api/tools/getProducts
Authorization: Bearer <access_token>
Content-Type: application/json

{}
```

#### Example: clearCart

```http
POST /api/tools/clearCart
Authorization: Bearer <access_token>
Content-Type: application/json

{}
```

### `GET /api/openapi.json`

Auto-generated OpenAPI 3.1 document for ChatGPT Actions and Gemini Extensions.

**Auth:** None

**Response:** OpenAPI JSON with one `POST` path per registered capability, OAuth2 security scheme, and JSON Schema request bodies.

```http
GET /api/openapi.json
```

Import this URL directly in the Custom GPT Actions builder.

---

## OAuth endpoints

### `POST /api/oauth/login`

Demo login — creates a user and session cookie.

**Auth:** None

#### Request

```json
{ "username": "alice" }
```

#### Response

```json
{ "success": true, "userId": "user_abc123" }
```

Plus `Set-Cookie: lite_toon_session=...; HttpOnly; SameSite=Lax`

### `GET /api/oauth/authorize`

OAuth 2.0 authorization endpoint. Requires session cookie.

#### Query parameters

| Param | Required | Description |
|---|---|---|
| `client_id` | Yes | Must match configured client ID |
| `redirect_uri` | Yes | Must be in allowed list |
| `response_type` | Yes | Must be `code` |
| `scope` | Yes | Space-separated scopes |
| `code_challenge` | Yes | PKCE challenge (base64url SHA-256) |
| `code_challenge_method` | No | Default `S256` |
| `state` | No | CSRF state returned to redirect |

#### Success

`302 Redirect` to `redirect_uri?code=<auth_code>&state=...`

#### No session

`302 Redirect` to `/login?returnUrl=...`

### `POST /api/oauth/token`

Exchange authorization code for access token.

#### Request (JSON)

```json
{
  "grant_type": "authorization_code",
  "code": "<auth_code>",
  "redirect_uri": "http://localhost:3000/oauth/callback",
  "client_id": "lite-toon-demo",
  "code_verifier": "<pkce_verifier>"
}
```

Also accepts `application/x-www-form-urlencoded`.

#### Success response

```json
{
  "access_token": "lt_...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "cart:read cart:write"
}
```

#### Error response

```json
{
  "error": "invalid_grant",
  "error_description": "invalid_grant"
}
```

---

## MCP endpoints

### `GET /api/mcp/sse`

Opens an SSE stream. Sends `endpoint` event with the message URL.

**Auth:** None

See [MCP Integration](../concepts/mcp.md) for full protocol details.

### `POST /api/mcp/message`

JSON-RPC 2.0 handler for MCP.

**Auth:** Required for `tools/call`; optional for `initialize`, `ping`, `tools/list`

#### Initialize

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": { "name": "test", "version": "1.0.0" }
  }
}
```

#### Tools list

```json
{ "jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {} }
```

#### Tools call

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "addToCart",
    "arguments": { "productId": "p1", "quantity": 2 }
  }
}
```

---

## Demo UI endpoint

### `GET /api/demo`

Returns initial shop state for the chat UI.

**Auth:** None (uses internal demo token for cart)

#### Response

```json
{
  "products": [{ "id": "p1", "name": "Nike Shoes", "price": 120 }, ...],
  "cart": [{ "productId": "p1", "quantity": 2, "name": "Nike Shoes", "price": 120, "subtotal": 240 }],
  "cartTotal": 240,
  "cartItemCount": 2
}
```

### `POST /api/demo`

Simulates an AI agent: parses natural language, routes through `/api/agent` adapter, returns TOON log.

**Auth:** None (auto-issues demo OAuth token internally)

#### Request

```json
{ "message": "Add 2 pairs of Nike shoes to my cart" }
```

#### Response

```json
{
  "aiDecision": { "action": "addToCart", "params": { "productId": "p1", "quantity": 2 } },
  "assistantMessage": "Done! I added 2x Nike Shoes to your cart. Current total: €240.00.",
  "products": [...],
  "cart": [...],
  "cartTotal": 240,
  "cartItemCount": 2,
  "toonRequest": "request[1]{action, params}:\n  \"addToCart\", \"{\\\"productId\\\":\\\"p1\\\",\\\"quantity\\\":2}\"",
  "toonResponse": "AddToCartResult[2]{productId, quantity}:\n  p1, 2\n  ..."
}
```

#### Supported phrases

| User message pattern | Action |
|---|---|
| `add` + `nike` | `addToCart` p1 |
| `add` + `adidas` | `addToCart` p2 |
| `add` + `puma` | `addToCart` p3 |
| `product` / `catalog` | `getProducts` |
| `clear cart` / `empty cart` / `clear` | `clearCart` |
| `cart` (without `add`) | `getCart` |

Quantity extracted from first number in message (default: 1).

---

## Demo capabilities reference

| Name | Scopes | Params | Returns |
|---|---|---|---|
| `getProducts` | `cart:read` | none | Product array |
| `getCart` | `cart:read` | none | CartItem array |
| `addToCart` | `cart:write` | `productId`, `quantity` | Updated cart |
| `clearCart` | `cart:write` | none | Empty array |

### Types

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
}

interface CartItem {
  productId: string;
  quantity: number;
}
```

---

## Rate limiting

- **Default:** 100 requests per 60 seconds
- **Key:** `x-agent-id` header, else `x-forwarded-for` IP, else `"anonymous"`
- **Error:** `TOON_RATE_LIMIT_EXCEEDED: Too many requests.` (HTTP 429 on JSON endpoints)

Configure via `SecurityGatekeeper` options: `maxRequests`, `windowMs`, custom `RateLimiterStore`.

---

## Related

- [TOON Format](../concepts/toon.md)
- [OAuth](../concepts/oauth.md)
- [MCP Integration](../concepts/mcp.md)
- [Connect Agents](../integration/connect-agents.md)
