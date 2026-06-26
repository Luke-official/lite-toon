# Capability Flows — Cheat Sheet

Full diagrams: [capability-flows.md](../concepts/capability-flows.md)

## Transport matrix

| Capability | `/api/tools` | MCP | `/api/agent` | `/api/demo` |
|---|---|---|---|---|
| `getProducts` | JSON + Bearer | tools/call | TOON, anon OK | keyword: "products" |
| `getCart` | JSON + Bearer | tools/call | TOON + Bearer | keyword: "cart" |
| `addToCart` | JSON + Bearer | tools/call | TOON + Bearer | keyword: "add nike/adidas/puma" |
| `clearCart` | JSON + Bearer | tools/call | TOON + Bearer | keyword: "clear cart" |

## Universal execution path

```
HTTP/MCP → adapter → gatekeeper → registry.execute(name, params, context) → cap.execute()
```

## getProducts (1 line)

`productsDB` → return array. No userId. No cart mutation.

## getCart (1 line)

`requireUserId` → `cartsByUser.get(userId)` → return.

## addToCart (logic)

```
validate params → find product → getUserCart(userId)
→ increment existing OR push new → return cart
```

## clearCart (1 line)

`cartsByUser.set(userId, [])` → return `[]`.

## Product IDs (demo)

| ID | Product | Price |
|---|---|---|
| `p1` | Nike Shoes | €120 |
| `p2` | Adidas T-Shirt | €35 |
| `p3` | Puma Socks | €15 |

## Typical user journey

```
getProducts → addToCart → getCart → clearCart
```

## Per-user isolation

Token → `userId` → `cartsByUser[userId]`. Never trust body for userId.

## Common errors

| Error | Capability |
|---|---|
| `Authenticated user is required` | cart ops without token |
| `Product with ID x not found` | addToCart bad id |
| `Missing required scopes: cart:write` | addToCart/clearCart |
| `Invalid parameters for addToCart` | missing productId/qty |
