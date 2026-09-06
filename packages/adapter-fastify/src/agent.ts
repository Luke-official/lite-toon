import { FastifyRequest, FastifyReply } from 'fastify';
import { UniversalAgent } from '@lite-toon/core';
import { formatToon, parseToon } from '@lite-toon/toon';

function wantsJsonResponse(req: FastifyRequest, isJsonRequest: boolean): boolean {
  const accept = (req.headers.accept as string) ?? '';
  return isJsonRequest || accept.includes('application/json');
}

/**
 * Creates a Fastify handler for standard REST/Webhook interactions.
 * Parses incoming TOON/JSON requests, enforces security, and executes capabilities.
 */
export function createFastifyAgentHandler(agent: UniversalAgent) {
  return async function (req: FastifyRequest, reply: FastifyReply) {
    try {
      const xForwardedFor = req.headers['x-forwarded-for'];
      const ip = ((Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor) as string) || req.socket.remoteAddress || '127.0.0.1';
      const xAgentId = req.headers['x-agent-id'];
      const agentId = ((Array.isArray(xAgentId) ? xAgentId[0] : xAgentId) as string) || 'anonymous-agent';
      const authHeader = req.headers.authorization;
      const apiKey = authHeader?.replace('Bearer ', '') || undefined;
      const accessToken = authHeader?.startsWith('Bearer ')
        ? authHeader.replace('Bearer ', '')
        : undefined;

      const access = await agent.gatekeeper.checkAccess({
        ip,
        agentId,
        apiKey: accessToken ? undefined : apiKey,
        accessToken,
      });

      const contentType = (req.headers['content-type'] as string) || '';
      const isJsonRequest = contentType.includes('application/json');

      let action: string;
      let params: unknown;

      if (isJsonRequest) {
        const body = req.body as any;
        if (!body || typeof body !== 'object') {
          throw new Error('Invalid JSON body');
        }
        action = body.action;
        params = body.params;
      } else {
        const rawBody = typeof req.body === 'string' ? req.body : (req.body as any)?.toString() || '';
        const parseResult = parseToon(rawBody);
        if (!parseResult.success) {
          throw new Error(`Failed to parse TOON request: ${parseResult.error}`);
        }

        const records = parseResult.data?.records || [];
        if (records.length === 0) {
          throw new Error('Empty TOON payload: missing records.');
        }

        action = records[0].action;
        let rawParams = records[0].params;

        if (
          typeof rawParams === 'string' &&
          (rawParams.startsWith('{') || rawParams.startsWith('['))
        ) {
          try {
            rawParams = JSON.parse(rawParams);
          } catch {
            // keep raw string
          }
        }
        params = rawParams;
      }

      if (!action) {
        throw new Error("Missing 'action' field in the request payload.");
      }

      const response = await agent.registry.execute(action, params, {
        userId: access.userId,
        agentId: access.agentId,
        scopes: access.scopes,
      });

      if (!response.success) {
        throw new Error(response.message || `Failed to execute action '${action}'.`);
      }

      if (wantsJsonResponse(req, isJsonRequest)) {
        return reply.status(200).send(response);
      }

      let resultRecords: Record<string, unknown>[] = [];
      let entityName = 'Result';

      if (response.data) {
        resultRecords = Array.isArray(response.data) ? response.data : [response.data];
        entityName = action.charAt(0).toUpperCase() + action.slice(1) + 'Result';
      }

      const toonResponse = formatToon(entityName, resultRecords);

      return reply.status(200).type('text/plain').send(toonResponse);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown internal server error.';
      const isJson =
        (req.headers['content-type'] as string)?.includes('application/json') ||
        ((req.headers.accept as string) ?? '').includes('application/json');

      const status = error?.code === 'UNAUTHORIZED' ? 401 : error?.code === 'FORBIDDEN' ? 403 : error?.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 400;

      if (isJson) {
        return reply.status(status).send({ error: errorMessage });
      }

      const errorRecords = [{ message: errorMessage }];
      const errorToon = formatToon('error', errorRecords);

      return reply.status(status).type('text/plain').send(errorToon);
    }
  };
}
