import * as readline from 'readline';
import { UniversalAgent } from '@lite-toon/core';
import { handleMcpJsonRpc, JsonRpcRequest } from '@lite-toon/adapter-next';

export interface StdioServerOptions {
  agentId?: string;
  userId?: string;
}

/**
 * Creates an MCP server that communicates over standard I/O (stdin/stdout).
 * This is primarily used for local CLI tools or IDE integrations.
 */
export function createMCPStdioServer(agent: UniversalAgent, options: StdioServerOptions = {}) {
  const agentId = options.agentId || 'stdio-client';
  const userId = options.userId;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const sendResponse = (response: any) => {
    process.stdout.write(JSON.stringify(response) + '\n');
  };

  const sendError = (id: string | number | null, code: number, message: string, data?: any) => {
    sendResponse({
      jsonrpc: '2.0',
      id,
      error: { code, message, data },
    });
  };

  rl.on('line', async (line) => {
    if (!line.trim()) return;

    let payload: JsonRpcRequest;
    try {
      payload = JSON.parse(line) as JsonRpcRequest;
      if (!payload || typeof payload !== 'object' || payload.jsonrpc !== '2.0') {
        throw new Error('Invalid JSON-RPC payload');
      }
    } catch (err: any) {
      sendError(null, -32700, 'Parse error', err.message);
      return;
    }

    try {
      // In stdio mode, we typically trust the local user/client,
      // but we can still pass a predefined userId if we want to bind sessions.
      const outcome = await handleMcpJsonRpc(agent as any, payload, {
        ip: '127.0.0.1',
        agentId,
        accessToken: undefined, // Stdio typically doesn't use OAuth bearers
      });

      if (outcome.kind === 'no-content') {
        // For notifications, we don't send a response
        return;
      } else if (outcome.kind === 'error') {
        sendError(outcome.id ?? null, outcome.code, outcome.message, outcome.data);
      } else {
        sendResponse({
          jsonrpc: '2.0',
          id: outcome.id ?? null,
          result: outcome.result,
        });
      }
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Internal error';
      const code = error?.code === 'UNAUTHORIZED' ? -32001 : -32603;
      sendError(payload.id ?? null, code, message);
    }
  });

  return {
    close: () => {
      rl.close();
    },
  };
}
