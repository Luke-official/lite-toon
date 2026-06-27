import { NextRequest, NextResponse } from 'next/server';
import { UniversalAgent } from '@lite-toon/core';
import { handleMcpJsonRpc, JsonRpcRequest, mcpToolCallRequiresAuth } from './mcp-core';
import { createMcpUnauthorizedResponse } from './mcp-oauth';

function extractBearerToken(req: NextRequest): string | undefined {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return undefined;
  return auth.replace('Bearer ', '');
}

function jsonRpcResponse(outcome: Awaited<ReturnType<typeof handleMcpJsonRpc>>) {
  if (outcome.kind === 'no-content') {
    return new NextResponse(null, { status: 204 });
  }

  if (outcome.kind === 'error') {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: outcome.id ?? null,
      error: { code: outcome.code, message: outcome.message, data: outcome.data },
    });
  }

  return NextResponse.json({
    jsonrpc: '2.0',
    id: outcome.id ?? null,
    result: outcome.result,
  });
}

/**
 * Handles MCP JSON-RPC messages over HTTP POST (legacy SSE companion endpoint).
 */
export function createMCPMessageHandler(agent: UniversalAgent) {
  return async function POST(req: NextRequest) {
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
      payload.method === 'tools/call' &&
      mcpToolCallRequiresAuth(agent, payload.params) &&
      !accessToken
    ) {
      return createMcpUnauthorizedResponse(req, { resourcePath: '/api/mcp/message' });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const agentId = req.headers.get('x-agent-id') || 'mcp-client';

    try {
      const outcome = await handleMcpJsonRpc(agent, payload, {
        ip,
        agentId,
        accessToken,
      });
      return jsonRpcResponse(outcome);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal error';
      if (message.includes('UNAUTHORIZED') || message.includes('FORBIDDEN')) {
        return createMcpUnauthorizedResponse(req, { resourcePath: '/api/mcp/message' });
      }

      const code = message.includes('UNAUTHORIZED') ? -32001 : -32603;
      return NextResponse.json({
        jsonrpc: '2.0',
        id: payload.id ?? null,
        error: { code, message },
      });
    }
  };
}
