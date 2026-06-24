Role: Expert TypeScript Developer & SDK Architect.

Context: We are executing "Phase 3: Transport Adapters" for the "Universal Agent API Core" SDK. The core logic (`src/core/`) is now completely decoupled and framework-agnostic. We need to build the "connectors" (Adapters) that allow specific HTTP frameworks and protocols to interface with our Universal Core.

Objective: Build the Next.js REST/Webhook Adapter for standard AI interactions (like Custom GPTs) and the Next.js SSE Adapter for the Model Context Protocol (MCP) used by Claude.

Actionable Tasks:
1. Adapter Directory Setup (`src/adapters/nextjs/`):
   - Create a new directory for Next.js specific adapters to keep them strictly separated from `src/core/`.

2. Next.js REST/Webhook Adapter (`src/adapters/nextjs/rest.ts`):
   - Create a factory function (e.g., `createNextAgentHandler(agent: UniversalAgent)`).
   - This function must take a `NextRequest`, extract headers and the JSON/TOON body, and map them into the agnostic `AgentRequest` format required by the core.
   - Pass the request to the core, await the result, and construct a `NextResponse` that returns the optimized TOON payload.
   - Refactor the existing `src/app/api/agent/route.ts` to simply use this adapter, removing all direct parsing/formatting logic from the route file.

3. Next.js SSE Adapter for MCP (`src/adapters/nextjs/sse.ts`):
   - Create a factory function (e.g., `createMCPSseHandler(registry: CapabilityRegistry)`).
   - Implement the Server-Sent Events (SSE) stream required by the Model Context Protocol.
   - It must return a `NextResponse` configured with headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.
   - Setup the logic to keep the stream open, handle the `endpoint` URL dissemination, and gracefully handle client disconnects.
   - Scaffold `src/app/api/mcp/sse/route.ts` to implement this new handler.

Constraints:
- Architectural Boundary: The `src/core/` must NEVER import from `src/adapters/`. Dependencies flow inwards (Adapters depend on Core, Core depends on nothing).
- Ensure streams in the SSE adapter are handled safely to prevent memory leaks in serverless/edge environments.
- Maintain strict TypeScript typings and English JSDoc comments.