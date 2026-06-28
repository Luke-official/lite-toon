# Security Policy

## Supported Versions

Lite-Toon is in early development (pre-1.0). Security fixes are applied to the latest commit on the default branch.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅        |
| < 0.1   | ❌        |

## Reporting a Vulnerability

**Do not open public GitHub issues for security vulnerabilities.**

Please report them privately using one of these channels:

1. **[GitHub Security Advisories](https://github.com/Luke-official/lite-toon/security/advisories/new)** (preferred)
2. Open a draft security advisory from the repository **Security** tab

Include:

- A description of the vulnerability and its impact
- Steps to reproduce
- Affected endpoints, packages, or configuration
- Any suggested fix (optional)

We aim to acknowledge reports within **72 hours** and will coordinate on disclosure timing once a fix is ready.

## Demo vs Production

The bundled demo app (`apps/demo`) uses in-memory auth, username-only login, and other shortcuts documented in the [README](README.md#-security--demo-limitations). **Do not deploy the demo as-is for production workloads.**

For production hardening guidance, see [docs/security/overview.md](docs/security/overview.md).

## Scope

Reports are in scope when they affect:

- `@lite-toon/*` packages (core, auth, adapter-next, bridge, toon)
- OAuth, MCP, or agent endpoint handling in the reference demo
- Token generation, session handling, or scope enforcement

Out of scope: vulnerabilities in third-party dependencies already tracked by Dependabot, or issues that require modifying deployed application code outside this repository.
