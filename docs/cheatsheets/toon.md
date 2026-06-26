# TOON — Cheat Sheet

## Header format

```
EntityName[count]{field1, field2, ...}:
```

## Row format

```
  value1, value2, value3
```

(2-space indent, comma-separated, aligned to header fields)

## Value encoding

| Type | Example |
|---|---|
| String | `"Nike Shoes"` (always quoted) |
| Number | `120` |
| Boolean | `true` / `false` |
| null | `null` |
| Object/Array | JSON string in cell |

## Empty result

```
Products[0]{}:
```

## Request template

```
request[1]{action, params}:
  "capabilityName", "{\"key\":\"val\"}"
```

## Response naming (adapter)

```
getProducts → GetProductsResult
addToCart   → AddToCartResult
```

## API usage

```typescript
import { formatToon, parseToon } from '@lite-toon/bridge';

const toon = formatToon('Products', [{ id: 'p1', name: 'Shoe', price: 120 }]);
const result = parseToon(toon);  // { success, data: { entity, records } }
```

## Content negotiation (/api/agent)

| Send | Receive |
|---|---|
| `Content-Type: text/plain` | TOON (default) |
| `Content-Type: application/json` | JSON if `Accept: application/json` |
| `Accept: application/json` | JSON response |

## Size example

JSON 142 chars → TOON 98 chars (~31% smaller on 3-row table)

## When to use

| Use TOON | Use JSON |
|---|---|
| `/api/agent` direct integrations | ChatGPT Actions |
| Token-sensitive pipelines | MCP protocol |
| Internal service-to-service | Gemini tools |

## curl

```bash
curl -X POST localhost:3000/api/agent \
  -H "Content-Type: text/plain" \
  -d 'request[1]{action, params}:
  "getProducts", "{}"'
```

## Limitations

Flat rows only · one table per string · nested = JSON in cell
