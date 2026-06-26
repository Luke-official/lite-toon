# Capabilities — Cheat Sheet

## Interface

```typescript
interface Capability {
  name: string;
  description: string;              // AI reads this!
  schema?: Record<string, any>;     // JSON Schema
  scopes?: string[];
  execute(params, context?): Promise<AgentResponse>;
}

interface AgentResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface ExecutionContext {
  userId: string;
  agentId: string;
  scopes: string[];
}
```

## Register

```typescript
// Option A: constructor
new UniversalAgent({ capabilities: [cap1, cap2] });

// Option B: dynamic
agent.registry.register(newCap);
```

## Demo capabilities

| Name | Scopes | Params | Auth |
|---|---|---|---|
| `getProducts` | `cart:read` | — | optional on /api/agent |
| `getCart` | `cart:read` | — | required |
| `addToCart` | `cart:write` | `productId`, `quantity` | required |
| `clearCart` | `cart:write` | — | required |

## Scope enforcement

1. **Gatekeeper** — `/api/tools`, MCP `tools/call`
2. **Registry** — `execute()` checks `context.scopes`

## Add new capability (3 steps)

1. Define `Capability` object with `execute()`
2. Register on `UniversalAgent`
3. Done — OpenAPI/MCP/tools auto-discover (no route change)

## Error patterns

```typescript
// Business error (preferred)
return { success: false, message: 'Product xyz not found. Call getProducts.' };

// Unexpected
throw new Error('DB down');  // registry catches → {success:false, message}
```

## Require auth in handler

```typescript
if (!context?.userId || context.userId === 'anonymous') {
  throw new Error('Authenticated user is required.');
}
```

## Test

```bash
curl -X POST localhost:3000/api/tools/addToCart \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"p1","quantity":1}'
```

## Sequence diagrams

→ [capability-flows.md](../concepts/capability-flows.md)

## Description tips

✅ `"Adds product to cart. Use getProducts for valid productId."`  
❌ `"Adds to cart."`
