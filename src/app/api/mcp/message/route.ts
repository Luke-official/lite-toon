import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/mcp/message
 * Receives JSON-RPC commands from the MCP client (Claude/Agent).
 */
export async function POST(req: NextRequest) {
  // TODO: Implement handling of incoming JSON-RPC messages
  return NextResponse.json({ error: "Message endpoint not yet implemented" }, { status: 501 });
}
