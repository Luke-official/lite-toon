import { NextRequest, NextResponse } from 'next/server';
import { UniversalAgent } from '@lite-toon/core';
import { getRequestBaseUrl } from '../http/request';

/**
 * Creates a Next.js App Router API handler (GET) for the Model Context Protocol (MCP) SSE connection.
 * Opens a streaming connection and sends the required 'endpoint' event.
 */
export function createMCPSseHandler(_agent: UniversalAgent) {
  return async function GET(req: NextRequest) {
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    req.signal.addEventListener('abort', () => {
      writer.close().catch(() => {});
    });

    const sendEvent = async (event: string, data: string) => {
      const message = `event: ${event}\ndata: ${data}\n\n`;
      await writer.write(encoder.encode(message));
    };

    const endpoint = `${getRequestBaseUrl(req)}/api/mcp/message`;

    Promise.resolve()
      .then(async () => {
        await sendEvent('endpoint', endpoint);
      })
      .catch(console.error);

    return new NextResponse(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  };
}
