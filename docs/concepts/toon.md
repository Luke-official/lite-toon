# TOON Format

> **Cheat sheet:** [toon.md](../cheatsheets/toon.md)

**TOON** (Token-Oriented Object Notation) is a compact, human-readable wire format designed for AI agent round-trips. Arrays of homogeneous objects become a typed header plus tabular rows — like CSV with an inline schema.

Lite-Toon uses TOON on `POST /api/agent` by default. ChatGPT, Claude MCP, and Gemini integrations use JSON instead (those platforms don't natively parse TOON).

## Why TOON?

LLM API calls are priced per token. Tabular JSON repeats field names on every row:

**JSON** (142 characters):

```json
[
  { "id": "u1", "name": "Alice", "role": "admin" },
  { "id": "u2", "name": "Bob", "role": "user" },
  { "id": "u3", "name": "Charlie", "role": "editor" }
]
```

**TOON** (98 characters, ~31% smaller):

```
Users[3]{id, name, role}:
  u1, "Alice", admin
  u2, "Bob", user
  u3, "Charlie", editor
```

Savings scale with row count and field count. Typical agent payloads (product lists, cart lines, search results) see **40–70% reduction** vs equivalent JSON.

## Grammar

### Document structure

```
<header-line>
<data-line>*
```

### Header line

```
<EntityName>[<count>]{<field1>, <field2>, ...}:
```

| Part | Rule | Example |
|---|---|---|
| `EntityName` | Alphanumeric + underscore | `Users`, `GetProductsResult`, `request` |
| `count` | Non-negative integer | `3`, `0`, `1` |
| Fields | Comma-separated identifiers | `id, name, price` |
| Terminator | Colon `:` | Required |

### Data lines

- One row per record
- **2-space indentation** prefix
- Comma-separated values aligned to header field order
- Empty document body when `count` is 0

### Empty result

```
Products[0]{}:
```

No data lines follow.

## Value encoding

| Type | Encoding | Example |
|---|---|---|
| String | Double-quoted, `\"` escape | `"Nike Shoes"` |
| Number | Unquoted decimal | `120`, `35.5` |
| Boolean | Unquoted literal | `true`, `false` |
| null | Literal `null` | `null` |
| undefined | Literal `undefined` | `undefined` |
| Object / Array | JSON string (fallback) | `{"key":"val"}` |

### String rules

- Always wrap strings in double quotes in output
- Escape internal `"` as `\"`
- Parser strips quotes and unescapes on read

### Number rules

- Parser converts unquoted numeric tokens to JavaScript `Number`
- Empty string is not a number (stays string)

## Examples

### Product catalog response

```
GetProductsResult[3]{id, name, price}:
  p1, "Nike Shoes", 120
  p2, "Adidas T-Shirt", 35
  p3, "Puma Socks", 15
```

### Agent request (action dispatch)

```
request[1]{action, params}:
  "getProducts", "{}"
```

```
request[1]{action, params}:
  "addToCart", "{\"productId\":\"p1\",\"quantity\":2}"
```

Note: `params` is often a JSON-encoded string in the `action` row. The REST adapter (`createNextAgentHandler`) attempts `JSON.parse()` when the value looks like `{` or `[`.

### Error response

```
error[1]{message}:
  "Capability 'foo' not found or not implemented yet. Please check the capability name."
```

### Single object (wrapped as one-row table)

```
AddToCartResult[1]{productId, quantity}:
  p1, 2
```

## Parser behavior

Implementation: `packages/toon/src/parser.ts`

### Input

```typescript
parseToon(input: string): ToonParseResult
```

### Success result

```typescript
{
  success: true,
  data: {
    entity: "Users",        // from header
    records: [              // array of row objects
      { id: "u1", name: "Alice", role: "admin" },
      ...
    ]
  }
}
```

### Failure result

```typescript
{
  success: false,
  error: "Invalid TOON header format. Expected format: entityName[numRecords]{key1, key2}:"
}
```

### Validation rules

1. Input must be a non-empty string
2. First line must match header regex: `^([a-zA-Z0-9_]+)\[(\d+)\]\{([^}]*)\}:$`
3. Each data row must have exactly as many values as header fields
4. Blank lines in the body are skipped

## Formatter behavior

Implementation: `packages/toon/src/formatter.ts`

### Input

```typescript
formatToon(entityName: string, records?: Record<string, any>[] | null): string
```

### Key collection

The formatter collects the **union of all keys** across records (not just the first row). This handles sparse rows gracefully.

### REST adapter naming convention

`createNextAgentHandler` names response entities:

```typescript
entityName = action.charAt(0).toUpperCase() + action.slice(1) + 'Result';
// getProducts → GetProductsResult
// addToCart   → AddToCartResult
```

## Content negotiation

| Request `Content-Type` | Parsed as |
|---|---|
| `text/plain` | TOON |
| `application/json` | JSON `{ action, params }` |
| Body starts with `{` | JSON (even without Content-Type) |

| Response | Condition |
|---|---|
| TOON (`text/plain`) | Default |
| JSON (`application/json`) | `Accept: application/json` or JSON request |

## API usage

### Import

```typescript
import { formatToon, parseToon } from '@lite-toon/bridge';
// or
import { formatToon, parseToon } from '@lite-toon/toon';
```

### Format

```typescript
const toon = formatToon('Products', [
  { id: 'p1', name: 'Nike Shoes', price: 120 },
]);
```

### Parse

```typescript
const result = parseToon(toonString);
if (result.success) {
  const { entity, records } = result.data!;
}
```

## Limitations (current implementation)

| Limitation | Workaround |
|---|---|
| Flat tabular rows only | Nested objects serialized as JSON strings in cells |
| No multi-entity documents | One table per TOON string |
| Header `count` not enforced | Parser reads all data lines regardless of declared count |
| Entity names restricted to `[a-zA-Z0-9_]` | Use underscores, not hyphens |

## Testing

```bash
npm run test:api -w @lite-toon/demo
```

Sends a `getProducts` TOON request to `/api/agent` and prints the TOON response.

## Related

- [API Reference — /api/agent](../reference/api.md#post-apiagent)
- [Architecture — Translation layer](../architecture/overview.md#layer-1--translation-lite-toontoon)
