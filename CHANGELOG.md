# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- GitHub Actions CI (build, lint, integration tests)
- `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue/PR templates, Dependabot config
- Package metadata (`license`, `repository`, descriptions) across the monorepo

## [0.1.0] - 2026-06-28

### Added

- `@lite-toon/toon` — TOON parser and formatter
- `@lite-toon/core` — `UniversalAgent`, capability registry, security gatekeeper
- `@lite-toon/auth` — OAuth 2.0 server with PKCE and in-memory store
- `@lite-toon/adapter-next` — Next.js App Router route factories
- `@lite-toon/bridge` — public SDK entry point
- Demo app (`apps/demo`) — LiteShop e-commerce PoC with `/connect` guide
- Claude integration via MCP Streamable HTTP at `/api/mcp`
- OAuth discovery (`/.well-known/oauth-*`) and dynamic client registration
- Documentation library under `docs/`

[Unreleased]: https://github.com/Luke-official/lite-toon/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Luke-official/lite-toon/releases/tag/v0.1.0
