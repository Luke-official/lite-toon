import { NextRequest, NextResponse } from 'next/server';
import { SecurityError, SecurityErrorCode, UniversalAgent } from '@lite-toon/core';
import { extractBearerToken } from '../http/request';
import { isSecurityAuthError } from '../http/errors';
import { handleMcpJsonRpc, JsonRpcRequest, mcpToolCallRequiresAuth } from './core';
import { jsonRpcResponse } from './json-rpc';
import { createMcpUnauthorizedResponse } from './oauth-metadata';

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
      if (isSecurityAuthError(error)) {
        return createMcpUnauthorizedResponse(req, { resourcePath: '/api/mcp/message' });
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
