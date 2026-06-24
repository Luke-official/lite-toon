import { NextRequest, NextResponse } from 'next/server';
import { UniversalAgent } from '@lite-toon/core';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: any;
}

function extractBearerToken(req: NextRequest): string | undefined {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return undefined;
  return auth.replace('Bearer ', '');
}

function jsonRpcResult(id: string | number | null | undefined, result: unknown) {
  return NextResponse.json({
    jsonrpc: '2.0',
    id: id ?? null,
    result,
  });
}

function jsonRpcError(
  id: string | number | null | undefined,
  code: number,
  message: string,
  data?: unknown
) {
  return NextResponse.json({
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code, message, data },
  });
}

function formatToolResult(response: { success: boolean; message?: string; data?: unknown }) {
  if (!response.success) {
    return {
      content: [{ type: 'text', text: response.message || 'Capability execution failed.' }],
      isError: true,
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(response.data ?? null) }],
    isError: false,
  };
}

/**
 * Handles MCP JSON-RPC messages over HTTP POST.
 */
export function createMCPMessageHandler(agent: UniversalAgent) {
  return async function POST(req: NextRequest) {
    let payload: JsonRpcRequest;

    try {
      payload = (await req.json()) as JsonRpcRequest;
    } catch {
      return jsonRpcError(null, -32700, 'Parse error');
    }

    const { id, method, params } = payload;

    try {
      if (method === 'initialize') {
        return jsonRpcResult(id, {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'lite-toon-mcp',
            version: '0.1.0',
          },
        });
      }

      if (method === 'ping') {
        return jsonRpcResult(id, {});
      }

      if (method === 'notifications/initialized') {
        return new NextResponse(null, { status: 204 });
      }

      if (method === 'tools/list') {
        return jsonRpcResult(id, {
          tools: agent.registry.exportMcpTools(),
        });
      }

      if (method === 'tools/call') {
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const agentId = req.headers.get('x-agent-id') || 'mcp-client';
        const accessToken = extractBearerToken(req);
        const toolName = params?.name;
        const toolArgs = params?.arguments ?? {};

        if (!toolName || typeof toolName !== 'string') {
          return jsonRpcError(id, -32602, 'Invalid params: tool name is required.');
        }

        const capability = agent.registry.list().find((item) => item.name === toolName);
        if (!capability) {
          return jsonRpcResult(id, formatToolResult({
            success: false,
            message: `Capability '${toolName}' not found.`,
          }));
        }

        const access = await agent.gatekeeper.checkAccess(
          { ip, agentId, accessToken },
          {
            requireAuth: true,
            requiredScopes: capability.scopes,
          }
        );

        const response = await agent.registry.execute(toolName, toolArgs, {
          userId: access.userId,
          agentId: access.agentId,
          scopes: access.scopes,
        });

        return jsonRpcResult(id, formatToolResult(response));
      }

      return jsonRpcError(id, -32601, `Method not found: ${method}`);
    } catch (error: any) {
      const message = error.message || 'Internal error';
      const code = message.includes('UNAUTHORIZED') ? -32001 : -32603;
      return jsonRpcError(id, code, message);
    }
  };
}
