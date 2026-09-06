import { Context } from 'hono';
import { UniversalAgent } from '@lite-toon/core';
import { formatToon, parseToon } from '@lite-toon/toon';

function wantsJsonResponse(c: Context, isJsonRequest: boolean): boolean {
  const accept = c.req.header('accept') ?? '';
  return isJsonRequest || accept.includes('application/json');
}

/**
 * Creates a Hono handler for standard REST/Webhook interactions.
 * Parses incoming TOON/JSON requests, enforces security, and executes capabilities.
 */
export function createHonoAgentHandler(agent: UniversalAgent) {
  return async function (c: Context) {
    try {
      const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
      const agentId = c.req.header('x-agent-id') || 'anonymous-agent';
      const authHeader = c.req.header('authorization');
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

      const rawBody = await c.req.text();
      let action: string;
      let params: unknown;
      const contentType = c.req.header('content-type') || '';
      const isJsonRequest =
        contentType.includes('application/json') || rawBody.trim().startsWith('{');

      if (isJsonRequest) {
        const body = JSON.parse(rawBody);
        action = body.action;
        params = body.params;
      } else {
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

      if (wantsJsonResponse(c, isJsonRequest)) {
        return c.json(response, 200);
      }

      let resultRecords: Record<string, unknown>[] = [];
      let entityName = 'Result';

      if (response.data) {
        resultRecords = Array.isArray(response.data) ? response.data : [response.data];
        entityName = action.charAt(0).toUpperCase() + action.slice(1) + 'Result';
      }

      const toonResponse = formatToon(entityName, resultRecords);

      c.header('Content-Type', 'text/plain');
      return c.body(toonResponse, 200);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown internal server error.';
      const isJson =
        c.req.header('content-type')?.includes('application/json') ||
        (c.req.header('accept') ?? '').includes('application/json');

      const status = error?.code === 'UNAUTHORIZED' ? 401 : error?.code === 'FORBIDDEN' ? 403 : error?.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 400;

      if (isJson) {
        return c.json({ error: errorMessage }, status);
      }

      const errorRecords = [{ message: errorMessage }];
      const errorToon = formatToon('error', errorRecords);

      c.header('Content-Type', 'text/plain');
      return c.body(errorToon, status);
    }
  };
}
