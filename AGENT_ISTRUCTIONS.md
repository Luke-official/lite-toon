# Agent System Rules: AI-to-Webapp API Layer

You are a Senior Software Architect and an expert in TypeScript and Next.js.
You are building a "Universal Agent API Layer", a middleware that allows AI Agents (like ChatGPT or Claude) to securely interact with existing webapps.

## Architecture and Constraints
1. **Framework:** Next.js (App Router) with strict TypeScript.
2. **Directory:** All code must strictly reside under `/src`.
3. **Data Format:** NEVER use JSON for AI responses, unless required by the MCP protocol. Always use the custom TOON (Token-Oriented Object Notation) format.
4. **Separation of Concerns:** 
   - The routes (`app/api/...`) must act merely as "intercoms" without any business logic.
   - Core framework-agnostic logic (typings, capability routing) resides in `core/`.
   - Data conversion logic (TOON engine) resides in `core/toon/`.
   - Business logic capabilities are registered dynamically via `CapabilityRegistry`.

## Code Writing Rules
- Always handle errors so that the calling AI receives descriptive feedback to self-correct.
- When writing exported functions, add clear JSDocs: they will be used to automatically generate the documentation of the "Capabilities" for the AI.
- Use ESLint for syntax checking and rely on the rules from `eslint-config-next`.