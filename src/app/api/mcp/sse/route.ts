import { createMCPSseHandler } from '@/adapters/nextjs/sse';
import { agent } from '@/agent';

/**
 * GET /api/mcp/sse
 * Server-Sent Events endpoint to establish an MCP stream with clients (like Claude).
 * This route delegates to the Next.js SSE adapter.
 */
export const GET = createMCPSseHandler(agent);
