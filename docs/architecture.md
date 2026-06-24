ai-agent-layer/
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── mcp/                 # [NETWORK LEVEL] Contact point for Claude/MCP
│   │       │   ├── sse/route.ts     # Handles the open streaming connection
│   │       │   └── message/route.ts # Receives JSON-RPC commands
│   │       └── agent/               # [NETWORK LEVEL] Direct test point for Custom GPTs
│   │           └── route.ts         
│   │
│   ├── core/
│   │   ├── toon/                    # [TRANSLATION LEVEL] The TOON engine
│   │   │   ├── parser.ts            # TOON string to JS Object
│   │   │   ├── formatter.ts         # JS Object/Array to TOON string
│   │   │   └── types.ts             # TOON types
│   │   ├── types.ts                 # [TYPE LEVEL] Universal Agent API contracts
│   │   └── registry.ts              # [ROUTING LEVEL] CapabilityRegistry class
│   │
│   ├── lib/
│   │   ├── mcp/                     # [TRANSLATION LEVEL] Protocol Adapter
│   │   │   ├── server.ts            # Initializes the MCP server
│   │   │   └── registry.ts          # Maps internal tools to the schema required by the AI
│   │   │
│   │   └── security/                # [SECURITY LEVEL] 
│   │       ├── auth.ts              # Token validation (OAuth/API keys)
│   │       └── rate-limit.ts        # Protection against infinite AI loops
│   │
│   └── types/                       # [TYPE LEVEL] Interface contracts
│       ├── toon.d.ts                # Types for TOON payloads
│       └── mcp.d.ts                 # Types for MCP requests