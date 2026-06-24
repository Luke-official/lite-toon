Role: Expert TypeScript Developer & SDK Architect.

Context: We are building an open-source, framework-agnostic SDK called "Universal Agent API Core". It allows developers to securely connect AI Agents (ChatGPT, Claude, etc.) to their web apps using a highly compressed data format (TOON).

Objective: Execute "Phase 1: Core Extraction". Refactor the existing codebase to decouple the core logic from Next.js, creating a pure TypeScript foundation that can run on Edge, Node, or Browser.

Actionable Tasks:
1. Directory Restructuring: Create a new `src/core/` directory. Move the existing TOON engine from its current location into `src/core/toon/`.
2. Ensure Framework Independence: Refactor `formatter.ts` and `parser.ts`. Strip out ALL imports related to `next/server`, `fs`, or Node.js built-ins. They must be pure TS functions.
3. Global Typings: Create `src/core/types.ts`. Define the following strict, provider-agnostic interfaces: `AgentRequest`, `AgentResponse`, `Capability`, and `UniversalAgentConfig`. 
4. Capability Abstraction: Delete the hardcoded routing logic in `lib/capabilities/index.ts`. Create a new class `CapabilityRegistry` inside `src/core/registry.ts`. This class must act as a factory, exposing methods (e.g., `register()`, `execute()`) to allow downstream developers to inject their own business logic dynamically. Remove all references to mock files like `users.ts`.

Constraints:
- Strictly NO external dependencies or framework-specific code inside `src/core/`.
- Use strict TypeScript mode.
- Maintain consistent English JSDoc comments for all exported types and classes.