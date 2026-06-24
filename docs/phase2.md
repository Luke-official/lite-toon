Role: Expert TypeScript Developer & SDK Architect.

Context: We are building an open-source, framework-agnostic SDK called "Universal Agent API Core" that connects AI Agents to web applications. We are currently in "Phase 2: Security & Universalization". The core must remain entirely agnostic of any specific HTTP framework (like Next.js or Express).

Objective: Implement a framework-agnostic Security Gatekeeper and a dynamic Capability Registry that natively supports the Model Context Protocol (MCP) by auto-generating JSON Schemas.

Actionable Tasks:
1. Agnostic Security Manager (`src/core/security.ts`): 
   - Create a `SecurityGatekeeper` class.
   - Define a `RateLimiterStore` interface to allow developers to inject custom stores (e.g., Redis) in the future.
   - Implement a default in-memory rate limiter and API Key validation.
   - CRITICAL: The gatekeeper must NOT read raw HTTP headers. It must accept a standardized agnostic object (e.g., `{ apiKey?: string, ip?: string, agentId: string }`) passed down from the framework adapters.
   - Throw specific custom errors (e.g., `TOON_RATE_LIMIT_EXCEEDED`) upon failure.

2. Dynamic Capability Registry (`src/core/registry.ts`):
   - Replace any hardcoded capability routing.
   - Build a `CapabilityRegistry` class that allows developers to dynamically register their own business logic functions (e.g., `registry.register({ name: 'addToCart', handler: myFunc, schema: mySchema })`).
   
3. MCP Schema Translator (Model Context Protocol):
   - Within or alongside the `CapabilityRegistry`, implement a translator that reads the registered capabilities and automatically generates the strict JSON Schema format required by MCP tools.
   - This ensures that when an MCP-compliant agent (like Claude) connects, the registry can instantly export the valid tool schemas.

Constraints:
- Strictly NO imports from `next`, `express`, or Node.js HTTP native modules.
- Ensure strict TypeScript typing for the Capability definitions to enforce type safety when developers register their functions.
- Maintain consistent English JSDoc comments for the new classes and interfaces.