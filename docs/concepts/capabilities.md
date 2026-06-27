# Capabilities

Capabilities are the fundamental unit of Lite-Toon. Each capability is a named, schema-described function that AI agents can discover and invoke.

> **Sequence diagrams:** [Capability Flows](./capability-flows.md) · **Cheat sheet:** [capabilities cheat sheet](../cheatsheets/capabilities.md)

## Anatomy of a capability

```typescript
import { Capability, ExecutionContext } from '@lite-toon/bridge';

export const addToCart: Capability = {
  name: 'addToCart',
  description: 'Adds a product to the user cart.',
  scopes: ['cart:write'],
  schema: {
    type: 'object',
    properties: {
      productId: { type: 'string', description: 'Product ID from getProducts' },
      quantity: { type: 'number', description: 'Number of items to add' },
    },
    required: ['productId', 'quantity'],
  },
  execute: async (params, context) => {
    const userId = context!.userId;
    // your business logic here
    return { success: true, data: updatedCart };
  },
};
```

### Fields

| Field | Required | Purpose |
|---|---|---|
| `name` | Yes | Unique identifier. Becomes tool name in OpenAPI/MCP |
| `description` | Yes | Shown to AI models for tool selection. Write clearly — models rely on this |
| `schema` | No | JSON Schema for input parameters. Default: empty object |
| `scopes` | No | OAuth scopes required. Enforced by gatekeeper + registry |
| `execute` | Yes | Async handler returning `AgentResponse` |

### Response shape

```typescript
interface AgentResponse {
  success: boolean;
  message?: string;   // Error description (shown to AI on failure)
  data?: any;         // Result payload
}
```

**Always return descriptive `message` on failure** — AI agents use it to self-correct.

## Execution context

Every authenticated call receives:

```typescript
interface ExecutionContext {
  userId: string;    // From OAuth token resolution
  agentId: string;   // From x-agent-id header
  scopes: string[];  // From OAuth token
}
```

Anonymous calls (only on `/api/agent` without Bearer token) receive:

```typescript
{ userId: 'anonymous', agentId: '...', scopes: [] }
```

### Requiring authentication in your handler

```typescript
function requireUserId(context?: ExecutionContext): string {
  if (!context?.userId || context.userId === 'anonymous') {
    throw new Error('Authenticated user is required for this operation.');
  }
  return context.userId;
}
```

Thrown errors are caught by the registry and returned as `{ success: false, message }`.

## OAuth scopes

Declare scopes on each capability:

```typescript
scopes: ['cart:read']   // read-only
scopes: ['cart:write']  // mutating
scopes: ['cart:read', 'cart:write']  // both
```

### Enforcement layers

1. **Gatekeeper** (on `/api/tools/*` and MCP `tools/call`):
   - `requireAuth: true`
   - `requiredScopes: capability.scopes`

2. **Registry** (on `execute()`):
   - If `context.userId !== 'anonymous'` and capability has scopes,
   - Check all capability scopes are in `context.scopes`

### Demo scopes

| Scope | Description | Capabilities |
|---|---|---|
| `cart:read` | Read catalog and cart | `getProducts`, `getCart` |
| `cart:write` | Modify cart | `addToCart`, `clearCart` |

## Registering capabilities

### At construction time

```typescript
import { UniversalAgent } from '@lite-toon/bridge';

const agent = new UniversalAgent({
  tokenResolver: oauthServer,
  capabilities: [getProducts, getCart, addToCart, clearCart],
});
```

### Dynamically

```typescript
agent.registry.register(myNewCapability);
```

Duplicate names log a warning and overwrite.

## Schema export (automatic)

Once registered, capabilities appear in export formats without additional code. **MCP export is supported today** (Claude). OpenAPI and Gemini exports exist in the SDK but those platforms are **not supported yet**.

```typescript
// MCP tools for Claude (supported)
agent.registry.exportMcpTools();

// Gemini function declarations (not supported yet)
agent.registry.exportGeminiFunctionDeclarations();

// OpenAPI 3.1 for ChatGPT Actions (not supported yet)
agent.registry.exportOpenApiDocument({
  baseUrl: 'https://my-app.com',
  oauth: {
    authorizationUrl: 'https://my-app.com/api/oauth/authorize',
    tokenUrl: 'https://my-app.com/api/oauth/token',
  },
});
```

### What the AI sees

The `description` and `schema` fields become:

| Export | `description` becomes | `schema` becomes |
|---|---|---|
| MCP | `tool.description` | `tool.inputSchema` |
| OpenAPI | `operation.summary` + `description` | `requestBody` JSON Schema |
| Gemini | `function.description` | `function.parameters` |

**Write JSDoc-quality descriptions** — they directly affect agent behavior.

## Writing good capability descriptions

### Do

```typescript
description: 'Adds a product to the user cart. Requires productId from getProducts and a positive quantity.',
```

### Don't

```typescript
description: 'Adds to cart.',
```

### Schema tips

- Use `description` on each property
- Mark `required` fields explicitly
- Use `enum` for fixed choices
- Include examples in descriptions when formats are non-obvious

```typescript
schema: {
  type: 'object',
  properties: {
    productId: {
      type: 'string',
      description: 'Product ID. Use getProducts to list valid IDs (e.g. "p1").',
    },
    quantity: {
      type: 'number',
      description: 'Positive integer quantity to add.',
      minimum: 1,
    },
  },
  required: ['productId', 'quantity'],
}
```

## Error handling patterns

### Return failure (preferred for business errors)

```typescript
return {
  success: false,
  message: `Product with ID ${productId} not found. Call getProducts to see available IDs.`,
};
```

### Throw (for unexpected errors)

```typescript
throw new Error('Database connection failed.');
```

The registry catches thrown errors and wraps them in `{ success: false, message }`.

## Example: adding a new capability

### 1. Define the capability

```typescript
// src/capabilities/removeFromCart.ts
export const removeFromCart: Capability = {
  name: 'removeFromCart',
  description: 'Removes a product from the user cart by productId.',
  scopes: ['cart:write'],
  schema: {
    type: 'object',
    properties: {
      productId: { type: 'string' },
    },
    required: ['productId'],
  },
  execute: async (params, context) => {
    const userId = requireUserId(context);
    const cart = getUserCart(userId);
    const index = cart.findIndex((item) => item.productId === params.productId);
    if (index === -1) {
      return { success: false, message: 'Product not in cart.' };
    }
    cart.splice(index, 1);
    return { success: true, data: cart };
  },
};
```

### 2. Register it

```typescript
const agent = new UniversalAgent({
  tokenResolver: oauthServer,
  capabilities: [getProducts, getCart, addToCart, clearCart, removeFromCart],
});
```

### 3. Done

No route changes needed. The tool is immediately available at:

- `POST /api/tools/removeFromCart`
- MCP `tools/call` with `name: "removeFromCart"`
- `GET /api/openapi.json` (new path auto-generated)

## Invocation paths

The same capability executes regardless of transport:

```
POST /api/agent          → registry.execute(action, params, context)
POST /api/tools/{name}   → registry.execute(name, body, context)
MCP tools/call           → registry.execute(name, arguments, context)
```

## Testing a capability

### Via tools endpoint

```bash
# After obtaining access_token (see test-oauth script)
curl -X POST http://localhost:3000/api/tools/addToCart \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"p1","quantity":1}'
```

### Via TOON agent endpoint

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: text/plain" \
  -H "Authorization: Bearer $TOKEN" \
  -d 'request[1]{action, params}:
  "addToCart", "{\"productId\":\"p1\",\"quantity\":1}"'
```

### Direct registry call (unit tests)

```typescript
const result = await agent.registry.execute(
  'addToCart',
  { productId: 'p1', quantity: 1 },
  { userId: 'test-user', agentId: 'test', scopes: ['cart:write'] }
);
```

## Related

- [Capability flows (sequence diagrams)](./capability-flows.md)
- [Next.js Integration](../integration/nextjs.md)
- [API Reference](../reference/api.md)
- [OAuth scopes](../concepts/oauth.md#scopes)
- [Demo capabilities source](../apps/demo/src/demo/capabilities.ts)
