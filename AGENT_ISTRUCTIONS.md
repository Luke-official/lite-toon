# Agent System Rules: AI-to-Webapp API Layer

You are a Senior Software Architect and an expert in TypeScript and Next.js.
You are building a "Universal Agent API Layer", a middleware that allows AI Agents (like ChatGPT or Claude) to securely interact with existing webapps.

## Architecture and Constraints

1. **Monorepo:** SDK code lives in `packages/`; the reference demo app lives in `apps/demo/`.
2. **Framework:** Next.js (App Router) with strict TypeScript for the demo app.
3. **Data Format:** NEVER use JSON for AI responses, unless required by the MCP protocol. Always use the custom TOON (Token-Oriented Object Notation) format.
4. **Separation of Concerns:**
   - SDK packages (`@lite-toon/toon`, `@lite-toon/core`, `@lite-toon/adapter-next`, `@lite-toon/bridge`) must remain framework-agnostic where specified.
   - Demo routes (`apps/demo/src/app/api/...`) act as thin "intercoms" without business logic.
   - Core framework-agnostic logic resides in `packages/core/`.
   - TOON engine resides in `packages/toon/`.
   - Next.js adapters reside in `packages/adapter-next/`.
   - Public consumer imports use `@lite-toon/bridge` (e.g. `import { UniversalAgent } from '@lite-toon/bridge'`).
   - Business logic capabilities are registered dynamically via `CapabilityRegistry`.

## Code Writing Rules

- Always handle errors so that the calling AI receives descriptive feedback to self-correct.
- When writing exported functions, add clear JSDocs: they will be used to automatically generate the documentation of the "Capabilities" for the AI.
- Use ESLint for syntax checking in `apps/demo` and rely on the rules from `eslint-config-next`.

# Terminal Commands on Windows (PowerShell Anti-Pattern)

When suggesting or executing terminal commands for a Windows environment, strictly AVOID using the `&&` operator to chain commands (e.g., `cd path && npm install`).

Older versions of Windows PowerShell (v5.1) do not support `&&` and will throw a parser error ("The token '&&' is not a valid statement separator").

Instead, use one of the following safe alternatives:

1. Execute commands sequentially on separate lines.
2. Use the semicolon `;` for basic sequential execution (e.g., `cd path ; npm install`).
3. If strict conditional chaining is required on a single line, wrap the execution in cmd: `cmd /c "cd path && npm install"`.
