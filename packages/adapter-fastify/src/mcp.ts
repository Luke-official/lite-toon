import { FastifyRequest, FastifyReply } from 'fastify';
import { UniversalAgent } from '@lite-toon/core';
import { handleMcpJsonRpc, JsonRpcRequest, mcpToolCallRequiresAuth } from '@lite-toon/adapter-next';

export interface MCPHttpHandlerOptions {
  requireAuthForToolsCall?: boolean;
}

function getRequestBaseUrl(req: FastifyRequest): string {
  const host = (req.headers.host as string) || 'localhost:3000';
  const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  return `${protocol}://${host}`;
}

export function createMcpUnauthorizedResponse(reply: FastifyReply) {
  reply.header('WWW-Authenticate', 'Bearer realm="mcp", error="invalid_token"');
  return reply.status(401).send({ error: 'Unauthorized. Bearer token required.' });
}

/**
 * Streamable HTTP MCP handler for Fastify.
 * Handles both GET (SSE) and POST (JSON-RPC).
 */
export function createMCPStreamableHttpHandler(
  agent: UniversalAgent,
  options: MCPHttpHandlerOptions = {}
) {
  const requireAuthForToolsCall = options.requireAuthForToolsCall ?? true;

  return async function (req: FastifyRequest, reply: FastifyReply) {
    if (req.method === 'GET') {
      const accept = (req.headers.accept as string) ?? '';
      if (!accept.includes('text/event-stream')) {
        return reply.status(405).send({ error: 'Use POST for JSON-RPC or GET with Accept: text/event-stream.' });
      }

      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ')
        ? authHeader.replace('Bearer ', '')
        : undefined;

      if (!accessToken) {
        return createMcpUnauthorizedResponse(reply);
      }

      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');

      // Fastify reply Hijacking for raw streaming
      reply.hijack();

      // Ensure stream is closed if client disconnects
      req.raw.on('close', () => {
        reply.raw.end();
      });

      reply.raw.write(`event: endpoint\ndata: ${getRequestBaseUrl(req)}/api/mcp\n\n`);
      return;
    }

    if (req.method !== 'POST') {
      return reply.status(405).send({ error: 'Method not allowed' });
    }

    let payload: JsonRpcRequest;
    try {
      payload = req.body as JsonRpcRequest;
      if (!payload || typeof payload !== 'object' || payload.jsonrpc !== '2.0') {
        throw new Error('Invalid JSON-RPC payload');
      }
    } catch {
      return reply.status(400).send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
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
      return createMcpUnauthorizedResponse(reply);
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
      reply.header('Mcp-Session-Id', sessionId);

      if (status === 204) {
        return reply.status(204).send();
      } else {
        return reply.status(status).send(body);
      }
    } catch (error: any) {
      if (error?.code === 'UNAUTHORIZED') {
        return createMcpUnauthorizedResponse(reply);
      }

      const message = error instanceof Error ? error.message : 'Internal error';
      const code = error?.code === 'UNAUTHORIZED' ? -32001 : -32603;
      return reply.status(200).send({
        jsonrpc: '2.0',
        id: payload.id ?? null,
        error: { code, message },
      });
    }
  };
}
