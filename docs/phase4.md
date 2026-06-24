Role: Expert Full-Stack Developer & DevRel Engineer.

Context: We are executing "Phase 4: Proof of Concept (PoC) E-commerce" for our open-source SDK (LiteToon / Universal Agent API). The core and adapters are built. Now, we need a functional demo to showcase how seamlessly developers can connect AI agents to their web apps using our SDK and the highly-compressed TOON format.

Objective: Build a lightweight React-based Chatbot UI and mock e-commerce capabilities to simulate a complete, end-to-end AI agent interaction using our Next.js adapter.

Actionable Tasks:

1. Mock E-commerce Capabilities (`src/demo/capabilities.ts`):
   - Implement an in-memory mock database for products and a user cart.
   - Create and export three strict functions: `getProducts()`, `getCart()`, and `addToCart(productId, quantity)`.
   - Register these functions using the newly created `CapabilityRegistry` from `src/core/registry.ts`.

2. Chatbot UI Simulator (`src/app/page.tsx`):
   - Build a clean, minimalist React interface with a chat window and an input field.
   - Include a visual "System Log" panel alongside the chat to display the raw TOON payloads being sent and received, clearly demonstrating the token savings.
   - Example user input to support: "Aggiungi 2 paia di scarpe Nike al carrello".

3. E-to-E TOON Flow Integration (`src/app/api/demo/route.ts`):
   - Scaffold a route that simulates the AI provider's endpoint.
   - It must receive the natural language text, mock the AI's "decision" to call the `addToCart` tool, route it through our Next.js Adapter (`createNextAgentHandler`), execute the mocked capability, and return the updated cart state compressed in the TOON format.

Constraints:

- Ensure the PoC strictly imports from `src/core/` and `src/adapters/` as a consumer would (simulate library usage).
- Keep the UI styling simple (Tailwind CSS preferred) to focus on the data flow and SDK usage.
- Maintain clear TypeScript interfaces for the mock database and capabilities.
