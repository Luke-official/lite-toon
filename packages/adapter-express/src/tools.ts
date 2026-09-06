import { Request, Response } from 'express';
import { UniversalAgent, capabilityRequiresAuth } from '@lite-toon/core';

/**
 * Creates a dynamic tools route handler for OpenAPI-based agent integrations.
 * Expects POST /api/tools/:name with JSON body params.
 */
export function createExpressToolsHandler(agent: UniversalAgent) {
  return async function (req: Request, res: Response) {
    try {
      const name = req.params.name as string;
      if (!name) {
        res.status(400).json({ error: 'Tool name parameter is required.' });
        return;
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
        res.status(404).json({ error: `Capability '${name}' not found.` });
        return;
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
        res.status(400).json({ error: response.message || `Failed to execute '${name}'.` });
        return;
      }

      res.status(200).json(response);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unknown internal server error.';
      const status = error?.code === 'UNAUTHORIZED' ? 401 : error?.code === 'FORBIDDEN' ? 403 : error?.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 400;
      res.status(status).json({ error: message });
    }
  };
}
