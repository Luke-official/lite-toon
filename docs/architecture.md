lite-toon/
├── packages/
│   ├── toon/                    # @lite-toon/toon — [TRANSLATION LEVEL] TOON engine
│   │   └── src/
│   │       ├── parser.ts        # TOON string → JS Object
│   │       ├── formatter.ts     # JS Object/Array → TOON string
│   │       └── types.ts
│   │
│   ├── core/                    # @lite-toon/core — framework-agnostic agent core
│   │   └── src/
│   │       ├── agent.ts         # UniversalAgent hub
│   │       ├── registry.ts      # CapabilityRegistry + MCP schema export
│   │       ├── security.ts      # SecurityGatekeeper + rate limiting
│   │       └── types.ts         # AgentRequest, Capability, etc.
│   │
│   ├── adapter-next/            # @lite-toon/adapter-next — Next.js transport
│   │   └── src/
│   │       ├── rest.ts          # createNextAgentHandler()
│   │       └── sse.ts           # createMCPSseHandler()
│   │
│   └── bridge/                  # @lite-toon/bridge — public SDK facade
│       └── src/
│           ├── index.ts         # re-exports core + toon
│           ├── toon.ts          # @lite-toon/bridge/toon
│           └── next.ts          # @lite-toon/bridge/next
│
└── apps/
    └── demo/                    # Next.js PoC — consumes @lite-toon/bridge
        └── src/
            ├── app/
            │   └── api/
            │       ├── mcp/                 # [NETWORK LEVEL] Claude/MCP
            │       │   ├── sse/route.ts
            │       │   └── message/route.ts
            │       ├── agent/route.ts       # [NETWORK LEVEL] Custom GPTs
            │       └── demo/route.ts        # Interactive chatbot demo
            ├── demo/
            │   └── capabilities.ts          # Mock e-commerce capabilities
            ├── agent.ts                     # Agent singleton
            └── types/                       # App-specific type declarations
