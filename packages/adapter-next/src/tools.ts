import { NextRequest, NextResponse } from 'next/server';
import { UniversalAgent, capabilityRequiresAuth } from '@lite-toon/core';

function extractBearerToken(req: NextRequest): string | undefined {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return undefined;
  return auth.replace('Bearer ', '');
}

function jsonError(message: string, status: number = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

/**
 * Creates a dynamic tools route handler for OpenAPI-based agent integrations.
 * Expects POST /api/tools/{capabilityName} with JSON body params.
 */
export function createNextToolsHandler(agent: UniversalAgent) {
  return async function POST(
    req: NextRequest,
    context: { params: Promise<{ name: string }> }
  ) {
    try {
      const { name } = await context.params;
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const agentId = req.headers.get('x-agent-id') || 'external-agent';
      const accessToken = extractBearerToken(req);

      const capability = agent.registry.list().find((item) => item.name === name);
      if (!capability) {
        return jsonError(`Capability '${name}' not found.`, 404);
      }

      const requiresAuth = capabilityRequiresAuth(capability);
      const access = await agent.gatekeeper.checkAccess(
        { ip, agentId, accessToken },
        {
          requireAuth: requiresAuth,
          requiredScopes: capability.scopes,
        }
      );

      const params = await req.json().catch(() => ({}));
      const response = await agent.registry.execute(name, params, {
        userId: access.userId,
        agentId: access.agentId,
        scopes: access.scopes,
      });

      if (!response.success) {
        return jsonError(response.message || `Failed to execute '${name}'.`, 400);
      }

      return NextResponse.json(response, { status: 200 });
    } catch (error: any) {
      const message = error.message || 'Unknown internal server error.';
      const status = message.includes('UNAUTHORIZED')
        ? 401
        : message.includes('FORBIDDEN')
          ? 403
          : message.includes('RATE_LIMIT')
            ? 429
            : 400;
      return jsonError(message, status);
    }
  };
}
