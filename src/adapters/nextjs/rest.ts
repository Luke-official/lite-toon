import { NextRequest, NextResponse } from 'next/server';
import { UniversalAgent } from '@/core/agent';
import { formatToon } from '@/core/toon/formatter';
import { parseToon } from '@/core/toon/parser';

/**
 * Creates a Next.js App Router API handler (POST) for standard REST/Webhook interactions.
 * Parses incoming TOON/JSON requests, enforces security, and executes capabilities.
 * 
 * @param agent The UniversalAgent instance.
 * @returns A Next.js API route handler function.
 */
export function createNextAgentHandler(agent: UniversalAgent) {
  return async function POST(req: NextRequest) {
    try {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const agentId = req.headers.get('x-agent-id') || 'anonymous-agent';
      const apiKey = req.headers.get('authorization')?.replace('Bearer ', '') || undefined;

      // 1. Security Gatekeeper check
      await agent.gatekeeper.checkAccess({ ip, agentId, apiKey });

      const rawBody = await req.text();
      let action: string;
      let params: any;

      // 2. Parse request
      if (req.headers.get('content-type')?.includes('application/json') || rawBody.trim().startsWith('{')) {
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
          throw new Error("Empty TOON payload: missing records.");
        }

        action = records[0].action;
        let rawParams = records[0].params;

        if (typeof rawParams === 'string' && (rawParams.startsWith('{') || rawParams.startsWith('['))) {
          try { rawParams = JSON.parse(rawParams); } catch(e) {}
        }
        params = rawParams;
      }

      if (!action) {
        throw new Error("Missing 'action' field in the request payload.");
      }

      // 3. Execute Capability
      const response = await agent.registry.execute(action, params);
      
      if (!response.success) {
        throw new Error(response.message || `Failed to execute action '${action}'.`);
      }

      let resultRecords: any[] = [];
      let entityName = "Result";

      if (response.data) {
        resultRecords = Array.isArray(response.data) ? response.data : [response.data];
        entityName = action.charAt(0).toUpperCase() + action.slice(1) + "Result";
      }

      // 4. Format and Return TOON
      const toonResponse = formatToon(entityName, resultRecords);

      return new NextResponse(toonResponse, { 
        status: 200, 
        headers: { 'Content-Type': 'text/plain' } 
      });

    } catch (error: any) {
      const errorMessage = error.message || "Unknown internal server error.";
      const errorRecords = [{ message: errorMessage }];
      const errorToon = formatToon("error", errorRecords);

      return new NextResponse(errorToon, { 
        status: 400, 
        headers: { 'Content-Type': 'text/plain' } 
      });
    }
  };
}
