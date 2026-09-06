import { FastifyRequest, FastifyReply } from 'fastify';
import { UniversalAgent, capabilityRequiresAuth } from '@lite-toon/core';

/**
 * Creates a dynamic tools route handler for OpenAPI-based agent integrations.
 * Expects POST /api/tools/:name with JSON body params.
 */
export function createFastifyToolsHandler(agent: UniversalAgent) {
  return async function (req: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) {
    try {
      const name = req.params.name;
      if (!name) {
        return reply.status(400).send({ error: 'Tool name parameter is required.' });
      }

      const xForwardedFor = req.headers['x-forwarded-for'];
      const ip = ((Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor) as string) || req.socket.remoteAddress || '127.0.0.1';
      const xAgentId = req.headers['x-agent-id'];
      const agentId = ((Array.isArray(xAgentId) ? xAgentId[0] : xAgentId) as string) || 'external-agent';
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ')
        ? authHeader.replace('Bearer ', '')
        : undefined;

      const capability = agent.registry.list().find((item) => item.name === name);
      if (!capability) {
        return reply.status(404).send({ error: `Capability '${name}' not found.` });
      }

      const requiresAuth = capabilityRequiresAuth(capability);
      const access = await agent.gatekeeper.checkAccess(
        { ip, agentId, accessToken },
        {
          requireAuth: requiresAuth,
          requiredScopes: capability.scopes,
        }
      );

      const params = req.body || {};
      const response = await agent.registry.execute(name, params, {
        userId: access.userId,
        agentId: access.agentId,
        scopes: access.scopes,
      });

      if (!response.success) {
        return reply.status(400).send({ error: response.message || `Failed to execute '${name}'.` });
      }

      return reply.status(200).send(response);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unknown internal server error.';
      const status = error?.code === 'UNAUTHORIZED' ? 401 : error?.code === 'FORBIDDEN' ? 403 : error?.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 400;
      return reply.status(status).send({ error: message });
    }
  };
}
