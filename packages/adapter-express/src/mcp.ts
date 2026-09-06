import { Request, Response } from 'express';
import { UniversalAgent } from '@lite-toon/core';
import { handleMcpJsonRpc, JsonRpcRequest, mcpToolCallRequiresAuth } from '@lite-toon/adapter-next';

export interface MCPHttpHandlerOptions {
  requireAuthForToolsCall?: boolean;
}

function getRequestBaseUrl(req: Request): string {
  const host = req.headers.host || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return `${protocol}://${host}`;
}

export function createMcpUnauthorizedResponse(res: Response) {
  res.setHeader('WWW-Authenticate', 'Bearer realm="mcp", error="invalid_token"');
  res.status(401).json({ error: 'Unauthorized. Bearer token required.' });
}

/**
 * Streamable HTTP MCP handler for Express.
 * Handles both GET (SSE) and POST (JSON-RPC).
 */
export function createMCPStreamableHttpHandler(
  agent: UniversalAgent,
  options: MCPHttpHandlerOptions = {}
) {
  const requireAuthForToolsCall = options.requireAuthForToolsCall ?? true;

  return async function (req: Request, res: Response) {
    if (req.method === 'GET') {
      const accept = req.headers.accept ?? '';
      if (!accept.includes('text/event-stream')) {
        res.status(405).json({ error: 'Use POST for JSON-RPC or GET with Accept: text/event-stream.' });
        return;
      }

      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ')
        ? authHeader.replace('Bearer ', '')
        : undefined;

      if (!accessToken) {
        createMcpUnauthorizedResponse(res);
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Ensure stream is closed if client disconnects
      req.on('close', () => {
        res.end();
      });

      res.write(`event: endpoint\ndata: ${getRequestBaseUrl(req)}/api/mcp\n\n`);
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    let payload: JsonRpcRequest;
    try {
      payload = req.body as JsonRpcRequest;
      if (!payload || typeof payload !== 'object' || payload.jsonrpc !== '2.0') {
        throw new Error('Invalid JSON-RPC payload');
      }
    } catch {
      res.status(400).json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
      return;
    }

    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : undefined;

    if (
      requireAuthForToolsCall &&
      payload.method === 'tools/call' &&
      mcpToolCallRequiresAuth(agent as any, payload.params) &&
      !accessToken
    ) {
      createMcpUnauthorizedResponse(res);
      return;
    }

    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip = ((Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor) as string) || req.socket.remoteAddress || '127.0.0.1';
    const xAgentId = req.headers['x-agent-id'];
    const agentId = ((Array.isArray(xAgentId) ? xAgentId[0] : xAgentId) as string) || 'mcp-client';

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

      const sessionId = (req.headers['mcp-session-id'] as string) ?? crypto.randomUUID();
      res.setHeader('Mcp-Session-Id', sessionId);

      if (status === 204) {
        res.status(204).end();
      } else {
        res.status(status).json(body);
      }
    } catch (error: any) {
      if (error?.code === 'UNAUTHORIZED') {
        createMcpUnauthorizedResponse(res);
        return;
      }

      const message = error instanceof Error ? error.message : 'Internal error';
      const code = error?.code === 'UNAUTHORIZED' ? -32001 : -32603;
      res.status(200).json({
        jsonrpc: '2.0',
        id: payload.id ?? null,
        error: { code, message },
      });
    }
  };
}
