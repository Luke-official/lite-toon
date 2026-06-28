import { NextRequest, NextResponse } from 'next/server';
import { SecurityError, SecurityErrorCode, UniversalAgent } from '@lite-toon/core';
import { extractBearerToken, getRequestBaseUrl } from '../http/request';
import { isSecurityAuthError } from '../http/errors';
import { handleMcpJsonRpc, JsonRpcRequest, mcpToolCallRequiresAuth } from './core';
import { jsonRpcResponse } from './json-rpc';
import { createMcpUnauthorizedResponse } from './oauth-metadata';

export interface MCPHttpHandlerOptions {
  requireAuthForToolsCall?: boolean;
}

/**
 * Streamable HTTP MCP handler (POST /api/mcp).
 * Also suitable for legacy JSON-RPC POST clients.
 */
export function createMCPStreamableHttpHandler(
  agent: UniversalAgent,
  options: MCPHttpHandlerOptions = {}
) {
  const requireAuthForToolsCall = options.requireAuthForToolsCall ?? true;

  return async function handler(req: NextRequest) {
    if (req.method === 'GET') {
      const accept = req.headers.get('accept') ?? '';
      if (!accept.includes('text/event-stream')) {
        return NextResponse.json(
          { error: 'Use POST for JSON-RPC or GET with Accept: text/event-stream.' },
          { status: 405 }
        );
      }

      const accessToken = extractBearerToken(req);
      if (!accessToken) {
        return createMcpUnauthorizedResponse(req);
      }

      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      const encoder = new TextEncoder();

      req.signal.addEventListener('abort', () => {
        writer.close().catch(() => {});
      });

      Promise.resolve()
        .then(async () => {
          await writer.write(
            encoder.encode(`event: endpoint\ndata: ${getRequestBaseUrl(req)}/api/mcp\n\n`)
          );
        })
        .catch(console.error);

      return new NextResponse(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    if (req.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    let payload: JsonRpcRequest;

    try {
      payload = (await req.json()) as JsonRpcRequest;
    } catch {
      return NextResponse.json(
        { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
        { status: 400 }
      );
    }

    const accessToken = extractBearerToken(req);
    if (
      requireAuthForToolsCall &&
      payload.method === 'tools/call' &&
      mcpToolCallRequiresAuth(agent, payload.params) &&
      !accessToken
    ) {
      return createMcpUnauthorizedResponse(req);
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const agentId = req.headers.get('x-agent-id') || 'mcp-client';

    try {
      const outcome = await handleMcpJsonRpc(agent, payload, {
        ip,
        agentId,
        accessToken,
      });
      const response = jsonRpcResponse(outcome);
      const sessionId = req.headers.get('mcp-session-id') ?? crypto.randomUUID();
      response.headers.set('Mcp-Session-Id', sessionId);
      return response;
    } catch (error: unknown) {
      if (isSecurityAuthError(error)) {
        return createMcpUnauthorizedResponse(req);
      }

      const message = error instanceof Error ? error.message : 'Internal error';
      const code =
        error instanceof SecurityError && error.code === SecurityErrorCode.UNAUTHORIZED
          ? -32001
          : -32603;
      return NextResponse.json({
        jsonrpc: '2.0',
        id: payload.id ?? null,
        error: { code, message },
      });
    }
  };
}
