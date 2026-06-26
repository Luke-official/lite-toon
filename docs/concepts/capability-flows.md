# Capability Flows

> **Cheat sheet:** [capability-flows.md](../cheatsheets/capability-flows.md)

Per-capability sequence diagrams for every demo tool across all transports: **ChatGPT/Gemini** (`/api/tools`), **Claude MCP**, **TOON agent** (`/api/agent`), and the **demo UI** (`/api/demo`).

See also: [Capabilities guide](./capabilities.md) · [Capabilities cheat sheet](../cheatsheets/capabilities.md)

## Quick reference

| Capability | Scopes | Auth required | Params | Returns |
|---|---|---|---|---|
| `getProducts` | `cart:read` | Tools/MCP: yes. Agent: optional | none | `Product[]` |
| `getCart` | `cart:read` | Yes | none | `CartItem[]` |
| `addToCart` | `cart:write` | Yes | `productId`, `quantity` | `CartItem[]` |
| `clearCart` | `cart:write` | Yes | none | `[]` |

---

## `getProducts`

Returns the static product catalog. Does not touch per-user cart state.

### Via ChatGPT / Gemini (`POST /api/tools/getProducts`)

```mermaid
sequenceDiagram
    participant GPT as ChatGPT
    participant Route as /api/tools/getProducts
    participant GK as SecurityGatekeeper
    participant OAuth as OAuthServer
    participant Reg as CapabilityRegistry
    participant Cap as getProducts.execute
    participant DB as productsDB

    GPT->>Route: POST {} + Bearer token
    Route->>GK: checkAccess(requireAuth, cart:read)
    GK->>OAuth: resolve(token)
    OAuth-->>GK: {userId, scopes}
    GK-->>Route: ResolvedAccess
    Route->>Reg: execute("getProducts", {}, context)
    Reg->>Cap: execute({}, context)
    Cap->>DB: read productsDB
    DB-->>Cap: Product[3]
    Cap-->>Reg: {success: true, data: products}
    Reg-->>Route: AgentResponse
    Route-->>GPT: JSON {success, data}
```

### Via Claude MCP (`tools/call`)

```mermaid
sequenceDiagram
    participant Claude as MCP Client
    participant Msg as /api/mcp/message
    participant GK as SecurityGatekeeper
    participant Reg as CapabilityRegistry
    participant Cap as getProducts.execute

    Claude->>Msg: JSON-RPC tools/call {name: getProducts}
    Msg->>GK: checkAccess + cart:read scope
    GK-->>Msg: ResolvedAccess
    Msg->>Reg: execute("getProducts", {}, context)
    Reg->>Cap: execute
    Cap-->>Reg: {success, data: Product[]}
    Reg-->>Msg: AgentResponse
    Msg-->>Claude: JSON-RPC result (data as text JSON)
```

### Via TOON agent (`POST /api/agent`)

```mermaid
sequenceDiagram
    participant Client
    participant Handler as createNextAgentHandler
    participant Toon as parseToon
    participant GK as SecurityGatekeeper
    participant Reg as CapabilityRegistry
    participant Cap as getProducts.execute

    Client->>Handler: TOON request[1]{action,params}: "getProducts","{}"
    Handler->>GK: checkAccess (anonymous OK)
    GK-->>Handler: {userId: anonymous, scopes: []}
    Handler->>Toon: parse body
    Handler->>Reg: execute("getProducts", {}, context)
    Reg->>Cap: execute (no scope check for anonymous)
    Cap-->>Reg: {success, data}
    Handler->>Toon: formatToon("GetProductsResult", data)
    Handler-->>Client: TOON text/plain
```

### Business logic (internal)

```mermaid
flowchart LR
    A[execute called] --> B[Ignore context]
    B --> C[Return productsDB array]
    C --> D["{success: true, data}"]
```

**Key file:** `apps/demo/src/demo/capabilities.ts` lines 64–72

### Example payloads

**Request (tools):**
```http
POST /api/tools/getProducts
Authorization: Bearer lt_abc123
Content-Type: application/json

{}
```

**Response:**
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

**TOON response:**
```
GetProductsResult[3]{id, name, price}:
  p1, "Nike Shoes", 120
  p2, "Adidas T-Shirt", 35
  p3, "Puma Socks", 15
```

### Error paths

| Condition | Result |
|---|---|
| Missing Bearer on `/api/tools` | 401 `TOON_UNAUTHORIZED` |
| Token without `cart:read` | 403 `TOON_FORBIDDEN` |
| Rate limit exceeded | 429 `TOON_RATE_LIMIT_EXCEEDED` |

---

## `getCart`

Returns the authenticated user's cart from in-memory `cartsByUser` map.

### Via ChatGPT / Gemini

```mermaid
sequenceDiagram
    participant GPT as ChatGPT
    participant Route as /api/tools/getCart
    participant GK as SecurityGatekeeper
    participant OAuth as OAuthServer
    participant Reg as CapabilityRegistry
    participant Cap as getCart.execute
    participant Map as cartsByUser

    GPT->>Route: POST {} + Bearer
    Route->>GK: checkAccess(requireAuth, cart:read)
    GK->>OAuth: resolve(token) → userId
    Route->>Reg: execute("getCart", {}, {userId, scopes})
    Reg->>Cap: execute({}, context)
    Cap->>Cap: requireUserId(context)
    Cap->>Map: getUserCart(userId)
    Map-->>Cap: CartItem[]
    Cap-->>Route: {success, data: cart}
    Route-->>GPT: JSON
```

### Via TOON agent (authenticated)

```mermaid
sequenceDiagram
    participant Client
    participant Handler as createNextAgentHandler
    participant GK as SecurityGatekeeper
    participant Reg as CapabilityRegistry
    participant Cap as getCart.execute

    Client->>Handler: TOON + Bearer token
    Handler->>GK: checkAccess
    GK-->>Handler: {userId: user_abc, scopes}
    Handler->>Reg: execute("getCart", {}, context)
    Reg->>Reg: verify cart:read scope
    Reg->>Cap: execute
    Cap->>Cap: requireUserId → throws if anonymous
    Cap-->>Handler: {success, data}
    Handler-->>Client: GetCartResult TOON
```

### Via demo UI

```mermaid
sequenceDiagram
    participant UI as Chat "Show my cart"
    participant Demo as /api/demo
    participant Adapter as createNextAgentHandler
    participant Cap as getCart.execute

    UI->>Demo: POST {message: "show my cart"}
    Demo->>Demo: keyword → action=getCart
    Demo->>Adapter: TOON request + demo Bearer token
    Adapter->>Cap: execute via registry
    Cap-->>Adapter: cart data
    Adapter-->>Demo: TOON response
    Demo->>Demo: buildAssistantMessage + enrichCart
    Demo-->>UI: JSON + toonRequest + toonResponse
```

### Business logic (internal)

```mermaid
flowchart LR
    A[execute] --> B{context.userId?}
    B -->|anonymous| X[throw: Auth required]
    B -->|valid| C[getUserCart userId]
    C --> D[Return cart array]
```

### Example response (empty cart)

```json
{ "success": true, "data": [] }
```

### Error paths

| Condition | Result |
|---|---|
| Anonymous call on agent | `throw` → `{success: false, message: "Authenticated user is required..."}` |
| Missing `cart:read` scope | 403 or registry scope error |
| User never added items | `{success: true, data: []}` (not an error) |

---

## `addToCart`

Adds or increments a product in the user's cart.

### Via ChatGPT / Gemini

```mermaid
sequenceDiagram
    participant GPT as ChatGPT
    participant Route as /api/tools/addToCart
    participant GK as SecurityGatekeeper
    participant Reg as CapabilityRegistry
    participant Cap as addToCart.execute
    participant Map as cartsByUser
    participant DB as productsDB

    GPT->>Route: POST {productId, quantity} + Bearer
    Route->>GK: checkAccess(requireAuth, cart:write)
    GK-->>Route: {userId, scopes}
    Route->>Reg: execute("addToCart", params, context)
    Reg->>Reg: verify cart:write scope
    Reg->>Cap: execute(params, context)
    Cap->>Cap: requireUserId
    Cap->>Cap: validate productId + quantity
    Cap->>DB: find product
    alt product not found
        Cap-->>Reg: throw Error
    end
    Cap->>Map: getUserCart(userId)
    alt item exists
        Cap->>Map: increment quantity
    else new item
        Cap->>Map: push {productId, quantity}
    end
    Cap-->>Route: {success, data: updatedCart}
    Route-->>GPT: JSON
```

### Full end-to-end (user says "Add 2 Nike shoes")

```mermaid
sequenceDiagram
    participant User
    participant GPT as ChatGPT
    participant OAuth as OAuth Server
    participant OpenAPI as /api/openapi.json
    participant Tools as /api/tools/addToCart
    participant Cap as addToCart

    User->>GPT: "Add 2 pairs of Nike shoes"
    Note over GPT,OpenAPI: GPT already has OAuth token + schema
    GPT->>GPT: Decide tool: addToCart
    GPT->>GPT: Map "Nike" → productId p1, qty 2
    GPT->>Tools: POST {productId:"p1", quantity:2} + Bearer
    Tools->>Cap: execute
    Cap-->>Tools: updated cart
    Tools-->>GPT: JSON success
    GPT-->>User: "Done! Added 2x Nike Shoes..."
```

### Via MCP

```mermaid
sequenceDiagram
    participant Claude
    participant Msg as /api/mcp/message
    participant Cap as addToCart.execute

    Claude->>Msg: tools/call {name:addToCart, arguments:{productId:p2, quantity:1}}
    Msg->>Msg: auth + cart:write check
    Msg->>Cap: execute via registry
    Cap-->>Msg: {success, data}
    Msg-->>Claude: MCP text content block (JSON string)
```

### Business logic (internal)

```mermaid
flowchart TD
    A[execute params, context] --> B[requireUserId]
    B --> C{valid productId + quantity?}
    C -->|no| E[throw Invalid parameters]
    C -->|yes| D{product in productsDB?}
    D -->|no| F["throw Product not found"]
    D -->|yes| G[getUserCart]
    G --> H{existing line?}
    H -->|yes| I[quantity += n]
    H -->|no| J[push new item]
    I --> K[return cart]
    J --> K
```

### Example request / response

```http
POST /api/tools/addToCart
Authorization: Bearer lt_xyz
Content-Type: application/json

{"productId": "p1", "quantity": 2}
```

```json
{
  "success": true,
  "data": [{ "productId": "p1", "quantity": 2 }]
}
```

### Error paths

| Condition | Message |
|---|---|
| Missing params | `Invalid parameters for addToCart.` |
| Unknown productId | `Product with ID xyz not found.` |
| Anonymous user | `Authenticated user is required for this operation.` |
| Missing `cart:write` | `Missing required scopes: cart:write` |

---

## `clearCart`

Empties the authenticated user's cart.

### Via ChatGPT / Gemini

```mermaid
sequenceDiagram
    participant GPT as ChatGPT
    participant Route as /api/tools/clearCart
    participant GK as SecurityGatekeeper
    participant Reg as CapabilityRegistry
    participant Cap as clearCart.execute
    participant Map as cartsByUser

    GPT->>Route: POST {} + Bearer
    Route->>GK: checkAccess(requireAuth, cart:write)
    Route->>Reg: execute("clearCart", {}, context)
    Reg->>Cap: execute
    Cap->>Cap: requireUserId
    Cap->>Map: cartsByUser.set(userId, [])
    Cap-->>Route: {success, data: []}
    Route-->>GPT: JSON
```

### Via TOON agent

```mermaid
sequenceDiagram
    participant Client
    participant Handler as createNextAgentHandler
    participant Cap as clearCart.execute

    Client->>Handler: action=clearCart + Bearer
    Handler->>Cap: execute via registry
    Cap->>Cap: set empty array for userId
    Cap-->>Handler: {success, data: []}
    Handler-->>Client: ClearCartResult[0]{}:
```

### Business logic (internal)

```mermaid
flowchart LR
    A[execute] --> B[requireUserId]
    B --> C["cartsByUser.set(userId, [])"]
    C --> D["return {success, data: []}"]
```

### Error paths

| Condition | Result |
|---|---|
| Anonymous | Auth required error |
| Already empty | `{success: true, data: []}` (idempotent) |
| Missing `cart:write` | 403 Forbidden |

---

## Cross-capability user journey

Typical shopping session:

```mermaid
sequenceDiagram
    participant User
    participant Agent as AI Agent
    participant API as Lite-Toon API

    User->>Agent: "What do you sell?"
    Agent->>API: getProducts
    API-->>Agent: 3 products
    Agent-->>User: Lists Nike, Adidas, Puma

    User->>Agent: "Add 2 Nike shoes"
    Agent->>API: addToCart {p1, 2}
    API-->>Agent: cart updated
    Agent-->>User: Confirms addition

    User->>Agent: "What's in my cart?"
    Agent->>API: getCart
    API-->>Agent: [{p1, qty:2}]
    Agent-->>User: 2x Nike Shoes, €240

    User->>Agent: "Clear my cart"
    Agent->>API: clearCart
    API-->>Agent: []
    Agent-->>User: Cart cleared
```

## Per-user isolation

```mermaid
flowchart TB
    subgraph tokens ["OAuth Tokens"]
        T1["Token A → user_1"]
        T2["Token B → user_2"]
    end

    subgraph carts ["cartsByUser Map"]
        C1["user_1 → [{p1, 2}]"]
        C2["user_2 → [{p2, 1}]"]
    end

    T1 --> C1
    T2 --> C2
```

`getProducts` ignores userId. All cart capabilities use `context.userId` from token resolution — never from request body.

## Related

- [Capabilities guide](./capabilities.md)
- [API Reference](../reference/api.md)
- [Capabilities cheat sheet](../cheatsheets/capabilities.md)
- [Demo capabilities source](../../apps/demo/src/demo/capabilities.ts)
