import { NextRequest, NextResponse } from 'next/server';
import { UniversalAgent } from '@/core/agent';

/**
 * Creates a Next.js App Router API handler (GET) for the Model Context Protocol (MCP) SSE connection.
 * Opens a streaming connection and sends the required 'endpoint' event.
 * 
 * @param agent The UniversalAgent instance.
 * @returns A Next.js API route handler function.
 */
export function createMCPSseHandler(agent: UniversalAgent) {
  return async function GET(req: NextRequest) {
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    // Gracefully handle client disconnect to prevent memory leaks
    req.signal.addEventListener('abort', () => {
      writer.close().catch(() => {});
    });

    const sendEvent = async (event: string, data: any) => {
      const message = `event: ${event}\ndata: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    };

    // Determine the host and protocol to build the absolute callback URL for MCP messages
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const endpoint = `${protocol}://${host}/api/mcp/message`;

    // Non-blocking initialization of the SSE stream
    Promise.resolve().then(async () => {
      // MCP requires the server to send an 'endpoint' event as soon as the SSE opens
      await sendEvent('endpoint', endpoint);
    }).catch(console.error);

    return new NextResponse(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  };
}
