import { Context } from 'hono';
import { UniversalAgent, capabilityRequiresAuth } from '@lite-toon/core';

/**
 * Creates a dynamic tools route handler for OpenAPI-based agent integrations.
 * Expects POST /api/tools/:name with JSON body params.
 */
export function createHonoToolsHandler(agent: UniversalAgent) {
  return async function (c: Context) {
    try {
      const name = c.req.param('name');
      if (!name) {
        return c.json({ error: 'Tool name parameter is required.' }, 400);
      }

      const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
      const agentId = c.req.header('x-agent-id') || 'external-agent';
      const authHeader = c.req.header('authorization');
      const accessToken = authHeader?.startsWith('Bearer ')
        ? authHeader.replace('Bearer ', '')
        : undefined;

      const capability = agent.registry.list().find((item) => item.name === name);
      if (!capability) {
        return c.json({ error: `Capability '${name}' not found.` }, 404);
      }

      const requiresAuth = capabilityRequiresAuth(capability);
      const access = await agent.gatekeeper.checkAccess(
        { ip, agentId, accessToken },
        {
          requireAuth: requiresAuth,
          requiredScopes: capability.scopes,
        }
      );

      const params = await c.req.json().catch(() => ({}));
      const response = await agent.registry.execute(name, params, {
        userId: access.userId,
        agentId: access.agentId,
        scopes: access.scopes,
      });

      if (!response.success) {
        return c.json({ error: response.message || `Failed to execute '${name}'.` }, 400);
      }

      return c.json(response, 200);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unknown internal server error.';
      const status = error?.code === 'UNAUTHORIZED' ? 401 : error?.code === 'FORBIDDEN' ? 403 : error?.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 400;
      return c.json({ error: message }, status);
    }
  };
}
