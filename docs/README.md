# Lite-Toon Documentation

Complete documentation for the Lite-Toon SDK — a framework-agnostic TypeScript toolkit that connects AI agents (ChatGPT, Claude, Gemini) to your web application's business logic via OAuth, OpenAPI, MCP, and the TOON wire format.

## Quick links

| I want to… | Start here |
|---|---|
| Run the demo in 5 minutes | [Getting Started](./getting-started.md) |
| Understand the whole codebase | [Study Guide](./guide/study-guide.md) |
| Wire ChatGPT / Claude / Gemini | [Connect Agents](./integration/connect-agents.md) |
| Add a new tool to my app | [Capabilities](./concepts/capabilities.md) |
| Integrate into a Next.js app | [Next.js Integration](./integration/nextjs.md) |
| Look up an HTTP endpoint | [API Reference](./reference/api.md) |
| Print a one-page summary | [Cheat Sheets](./cheatsheets/README.md) |

## Documentation map

### Foundations

| Document | Description |
|---|---|
| [Getting Started](./getting-started.md) | Prerequisites, install, run, test, first curl |
| [Study Guide](./guide/study-guide.md) | End-to-end learning path with exercises |
| [Architecture](./architecture/overview.md) | Monorepo layout, layers, dependency rules, data flows |

### Core concepts

| Document | Description |
|---|---|
| [TOON Format](./concepts/toon.md) | Token-Oriented Object Notation specification |
| [Capabilities](./concepts/capabilities.md) | Defining, registering, and scoping agent tools |
| [Capability Flows](./concepts/capability-flows.md) | Per-capability sequence diagrams (all transports) |
| [OAuth & Authentication](./concepts/oauth.md) | PKCE flow, sessions, tokens, scopes |
| [MCP Integration](./concepts/mcp.md) | Claude / Model Context Protocol over SSE + JSON-RPC |
| [Security](./security/overview.md) | Gatekeeper, rate limits, production checklist |

### Integration & reference

| Document | Description |
|---|---|
| [Connect Agents](./integration/connect-agents.md) | Merchant setup for ChatGPT, Claude, Gemini |
| [Next.js Integration](./integration/nextjs.md) | Step-by-step wiring of all routes |
| [API Reference](./reference/api.md) | Every endpoint, header, status code, example |
| [Packages](./reference/packages.md) | `@lite-toon/*` package-by-package API surface |
| [Demo App](./guide/demo-app.md) | Reference app walkthrough (`apps/demo`) |

### Cheat sheets (printable)

| Document | Description |
|---|---|
| [Cheat Sheets Index](./cheatsheets/README.md) | One-page quick refs for every topic |

## Folder structure

```
docs/
├── README.md                 ← you are here
├── getting-started.md
├── guide/
│   ├── study-guide.md        Learning path
│   └── demo-app.md           Reference app walkthrough
├── architecture/
│   └── overview.md           Monorepo design
├── concepts/
│   ├── capabilities.md       Agent tools
│   ├── capability-flows.md   Per-capability sequence diagrams
│   ├── toon.md               Wire format
│   ├── oauth.md              Authentication
│   └── mcp.md                Claude protocol
├── integration/
│   ├── nextjs.md             Next.js wiring
│   └── connect-agents.md     ChatGPT / Claude / Gemini
├── reference/
│   ├── api.md                HTTP endpoints
│   └── packages.md           SDK packages
├── security/
│   └── overview.md           Production hardening
└── cheatsheets/              One-page printable quick refs
    ├── README.md
    ├── getting-started.md
    ├── architecture.md
    ├── capabilities.md
    ├── capability-flows.md
    ├── toon.md · oauth.md · mcp.md · security.md
    ├── nextjs.md · connect-agents.md
    └── api.md · packages.md · demo-app.md
```

## Mental model

Lite-Toon has three concentric rings:

```
┌─────────────────────────────────────────┐
│  Transport (adapters)                   │  REST, MCP, OAuth, OpenAPI
│  ┌───────────────────────────────────┐  │
│  │  Platform (core + auth)           │  │  Registry, security, OAuth
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Your app (capabilities)    │  │  │  getProducts, addToCart, …
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

You write the inner ring. The SDK generates schemas and route handlers for the outer rings.

## Monorepo at a glance

```
lite-toon/
├── packages/
│   ├── toon/           @lite-toon/toon         — TOON parser & formatter
│   ├── core/           @lite-toon/core         — UniversalAgent, registry, security
│   ├── auth/           @lite-toon/auth         — OAuth 2.0 server + PKCE
│   ├── adapter-next/   @lite-toon/adapter-next — Next.js route factories
│   └── bridge/         @lite-toon/bridge       — public SDK entry point
└── apps/
    └── demo/           Reference Next.js e-commerce PoC
```

**Golden rule:** `packages/core` and `packages/toon` never import from adapters or frameworks.

## Suggested reading order

### For application developers

1. [Getting Started](./getting-started.md)
2. [Capabilities](./concepts/capabilities.md)
3. [Next.js Integration](./integration/nextjs.md)
4. [Connect Agents](./integration/connect-agents.md)
5. [Security](./security/overview.md)

### For SDK contributors

1. [Study Guide](./guide/study-guide.md)
2. [Architecture](./architecture/overview.md)
3. [Packages](./reference/packages.md)
4. [TOON Format](./concepts/toon.md)
5. [OAuth](./concepts/oauth.md) + [MCP](./concepts/mcp.md)

### For operators / DevOps

1. [Security](./security/overview.md)
2. [API Reference](./reference/api.md)
3. [Connect Agents](./integration/connect-agents.md)

## External resources

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [OAuth 2.0 PKCE (RFC 7636)](https://datatracker.ietf.org/doc/html/rfc7636)
- [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0)
- [Next.js App Router](https://nextjs.org/docs/app)
