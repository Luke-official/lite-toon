import { Context } from 'hono';
import { UniversalAgent } from '@lite-toon/core';
import { handleMcpJsonRpc, JsonRpcRequest, mcpToolCallRequiresAuth } from '@lite-toon/adapter-next';

export interface MCPHttpHandlerOptions {
  requireAuthForToolsCall?: boolean;
}

function getRequestBaseUrl(c: Context): string {
  const host = c.req.header('host') || 'localhost:3000';
  const protocol = c.req.header('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}

export function createMcpUnauthorizedResponse(c: Context) {
  c.header('WWW-Authenticate', 'Bearer realm="mcp", error="invalid_token"');
  return c.json({ error: 'Unauthorized. Bearer token required.' }, 401);
}

/**
 * Streamable HTTP MCP handler for Hono.
 * Handles both GET (SSE) and POST (JSON-RPC).
 */
export function createMCPStreamableHttpHandler(
  agent: UniversalAgent,
  options: MCPHttpHandlerOptions = {}
) {
  const requireAuthForToolsCall = options.requireAuthForToolsCall ?? true;

  return async function (c: Context) {
    if (c.req.method === 'GET') {
      const accept = c.req.header('accept') ?? '';
      if (!accept.includes('text/event-stream')) {
        return c.json(
          { error: 'Use POST for JSON-RPC or GET with Accept: text/event-stream.' },
          405
        );
      }

      const authHeader = c.req.header('authorization');
      const accessToken = authHeader?.startsWith('Bearer ')
        ? authHeader.replace('Bearer ', '')
        : undefined;

      if (!accessToken) {
        return createMcpUnauthorizedResponse(c);
      }

      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      const encoder = new TextEncoder();

      // Ensure stream is closed if client disconnects
      c.req.raw.signal.addEventListener('abort', () => {
        writer.close().catch(() => {});
      });

      Promise.resolve()
        .then(async () => {
          await writer.write(
            encoder.encode(`event: endpoint\ndata: ${getRequestBaseUrl(c)}/api/mcp\n\n`)
          );
        })
        .catch(console.error);

      c.header('Content-Type', 'text/event-stream');
      c.header('Cache-Control', 'no-cache');
      c.header('Connection', 'keep-alive');
      return c.body(stream.readable, 200);
    }

    if (c.req.method !== 'POST') {
      return c.json({ error: 'Method not allowed' }, 405);
    }

    let payload: JsonRpcRequest;
    try {
      payload = (await c.req.json()) as JsonRpcRequest;
    } catch {
      return c.json(
        { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
        400
      );
    }

    const authHeader = c.req.header('authorization');
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : undefined;

    // Use the MCP core logic from adapter-next (since it has no Next.js deps)
    if (
      requireAuthForToolsCall &&
      payload.method === 'tools/call' &&
      mcpToolCallRequiresAuth(agent as any, payload.params) &&
      !accessToken
    ) {
      return createMcpUnauthorizedResponse(c);
    }

    const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
    const agentId = c.req.header('x-agent-id') || 'mcp-client';

    try {
      const outcome = await handleMcpJsonRpc(agent as any, payload, {
        ip,
        agentId,
        accessToken,
      });

      let status = 200;
      let body: any = {};
      if (outcome.kind === 'no-content') {
        status = 204;
      } else if (outcome.kind === 'error') {
        body = {
          jsonrpc: '2.0',
          id: outcome.id ?? null,
          error: { code: outcome.code, message: outcome.message, data: outcome.data },
        };
      } else {
        body = {
          jsonrpc: '2.0',
          id: outcome.id ?? null,
          result: outcome.result,
        };
      }

      const sessionId = c.req.header('mcp-session-id') ?? crypto.randomUUID();
      c.header('Mcp-Session-Id', sessionId);

      if (status === 204) {
        return c.body(null, 204);
      }
      return c.json(body, status as any);
    } catch (error: any) {
      if (error?.code === 'UNAUTHORIZED') {
        return createMcpUnauthorizedResponse(c);
      }

      const message = error instanceof Error ? error.message : 'Internal error';
      const code = error?.code === 'UNAUTHORIZED' ? -32001 : -32603;
      return c.json({
        jsonrpc: '2.0',
        id: payload.id ?? null,
        error: { code, message },
      }, 200); // JSON-RPC errors typically return 200 HTTP status
    }
  };
}
