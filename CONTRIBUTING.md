# Contributing to Lite-Toon

Thank you for your interest in contributing! Lite-Toon is a TypeScript monorepo that connects AI agents to web application business logic via OAuth, OpenAPI, MCP, and the TOON wire format.

## Before you start

- Read the [README](README.md) for project goals and architecture.
- Browse the [documentation index](docs/README.md) for the full guide library.
- Read [Security](docs/security/overview.md) — the bundled demo is **not** production-ready auth.
- For learning the codebase, start with the [Study Guide](docs/guide/study-guide.md).
- For agent integration details, see [Connect Agents](docs/integration/connect-agents.md) and [Architecture](docs/architecture/overview.md).

## Development setup

### Prerequisites

- **Node.js** 18+
- **npm** 10+ (workspaces)

### Clone and run

```bash
git clone https://github.com/Luke-official/lite-toon.git
cd lite-toon
npm install
npm run build
npm run dev:clean
```

Optional environment overrides (see [`.env.example`](.env.example)):

```bash
cp .env.example apps/demo/.env.local
```

### Useful commands

| Command | Description |
|---|---|
| `npm run dev` | Start all workspaces via Turbo |
| `npm run dev:clean` | Free ports 3000–3002, then start dev |
| `npm run build` | Build all packages and the demo app |
| `npm run lint` | Lint via Turbo |
| `npm run test:api -w @lite-toon/demo` | Test `/api/agent` (TOON) |
| `npm run test:oauth -w @lite-toon/demo` | Full OAuth + tools flow |
| `npm run test:mcp -w @lite-toon/demo` | MCP initialize + tools/call |

Run test scripts with the dev server already running on port 3000.

On **Windows PowerShell**, avoid chaining with `&&` (unsupported on v5.1). Use separate lines or `;` instead.

## Project structure

```
lite-toon/
├── packages/
│   ├── toon/           @lite-toon/toon       — TOON parser & formatter (framework-agnostic)
│   ├── core/           @lite-toon/core       — UniversalAgent, registry, security
│   ├── auth/           @lite-toon/auth       — OAuth 2.0 server + in-memory store
│   ├── adapter-next/   @lite-toon/adapter-next — Next.js route factories
│   └── bridge/         @lite-toon/bridge     — public SDK entry point
└── apps/
    └── demo/           Reference Next.js app (e-commerce PoC)
```

### Dependency rules (required)

See [Architecture — dependency rules](docs/architecture/overview.md#package-dependency-graph) for the full graph.

1. **`packages/core` and `packages/toon` must stay framework-agnostic.** No imports from `next/*`, `react`, `fs`, or other runtime-specific APIs unless explicitly scoped to a non-core package.
2. **Adapters depend on core; core never depends on adapters.**
3. **Demo routes in `apps/demo/src/app/api/` are thin intercoms.** Business logic belongs in capabilities (`apps/demo/src/demo/`) or in reusable packages — not in route files.
4. **Public consumer imports use `@lite-toon/bridge`** (e.g. `import { UniversalAgent } from '@lite-toon/bridge'`).

## Documentation

When adding features, update the relevant doc in `docs/`:

| Change type | Update |
|---|---|
| New capability pattern | [concepts/capabilities.md](docs/concepts/capabilities.md) |
| New endpoint or header | [reference/api.md](docs/reference/api.md) |
| New package export | [reference/packages.md](docs/reference/packages.md) |
| Auth behavior change | [concepts/oauth.md](docs/concepts/oauth.md), [security/overview.md](docs/security/overview.md) |
| MCP method support | [concepts/mcp.md](docs/concepts/mcp.md) |
| TOON format change | [concepts/toon.md](docs/concepts/toon.md) |
| Capability flow diagrams | [concepts/capability-flows.md](docs/concepts/capability-flows.md) |
| Cheat sheet for a topic | [cheatsheets/](docs/cheatsheets/README.md) |

Full index: [docs/README.md](docs/README.md)

## How to contribute

### Reporting bugs

Open a [GitHub issue](https://github.com/Luke-official/lite-toon/issues) with:

- Steps to reproduce
- Expected vs actual behavior
- Node.js and npm versions
- Relevant logs or TOON/JSON payloads (redact tokens and personal data)

### Suggesting features

Open an issue describing the use case and which agent platform(s) it targets (ChatGPT, Claude MCP, Gemini, or direct `/api/agent`).

### Pull requests

1. Fork the repository.
2. Create a branch: `git checkout -b feat/short-description` or `fix/short-description`.
3. Make focused changes — one logical change per PR when possible.
4. Run `npm run build` and relevant test scripts before opening the PR.
5. Open a Pull Request with a clear description and test plan.

We welcome:

- Bug fixes
- New framework adapters (Express, Hono, Edge, …)
- Documentation improvements
- Tests for OAuth, MCP, TOON edge cases
- Security hardening **behind** clear production configuration (not breaking the demo without migration notes)

## Code style

- **TypeScript** with strict mode in packages.
- **JSDoc** on exported functions and types in `packages/*` — they feed auto-generated capability documentation for AI agents.
- Match existing naming, file layout, and import style in the area you edit.
- Demo app linting follows `eslint-config-next` in `apps/demo`.
- Prefer small, readable diffs over large refactors unless discussed in an issue first.

## Security

**Do not commit secrets.** Never open PRs containing:

- `.env`, `.env.local`, API keys, OAuth client secrets, or private keys
- Personal paths, emails, or internal URLs that are not meant to be public

The demo uses a public client ID (`lite-toon-demo`) and in-memory auth by design. If you improve security for production use, document the migration path in the PR and README.

Report security vulnerabilities privately to the repository maintainer rather than in a public issue.

## What we're especially looking for

- [ ] Publish `@lite-toon/bridge` to npm
- [ ] Express / Hono / Edge adapters
- [ ] Redis-backed auth store and rate limiter
- [ ] Cryptographically secure token generation for production configs
- [ ] CI workflow (build + test scripts)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
