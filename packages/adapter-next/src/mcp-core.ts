export interface McpAgent {
  registry: {
    exportMcpTools(): unknown[];
    list(): Array<{ name: string; scopes?: string[] }>;
    execute(
      name: string,
      params: Record<string, unknown>,
      context?: { userId: string; agentId: string; scopes: string[] }
    ): Promise<{ success: boolean; message?: string; data?: unknown }>;
  };
  gatekeeper: {
    checkAccess(
      context: { ip?: string; agentId: string; accessToken?: string },
      options?: { requireAuth?: boolean; requiredScopes?: string[] }
    ): Promise<{ userId: string; agentId: string; scopes: string[] }>;
  };
}

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface McpRpcContext {
  ip: string;
  agentId: string;
  accessToken?: string;
}

export interface McpRpcSuccess {
  kind: 'result';
  id: string | number | null | undefined;
  result: unknown;
}

export interface McpRpcErrorResult {
  kind: 'error';
  id: string | number | null | undefined;
  code: number;
  message: string;
  data?: unknown;
}

export interface McpRpcNoContent {
  kind: 'no-content';
}

export type McpRpcOutcome = McpRpcSuccess | McpRpcErrorResult | McpRpcNoContent;

function formatToolResult(response: { success: boolean; message?: string; data?: unknown }) {
  if (!response.success) {
    return {
      content: [{ type: 'text', text: response.message || 'Capability execution failed.' }],
      isError: true,
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(response.data ?? null) }],
    isError: false,
  };
}

function isAuthError(message: string): boolean {
  return message.includes('UNAUTHORIZED') || message.includes('FORBIDDEN');
}

function capabilityRequiresAuth(capability: { scopes?: string[] }): boolean {
  if (!capability.scopes) {
    return true;
  }
  return capability.scopes.length > 0;
}

export function mcpToolCallRequiresAuth(
  agent: McpAgent,
  params?: Record<string, unknown>
): boolean {
  const toolName = params?.name;
  if (!toolName || typeof toolName !== 'string') {
    return false;
  }

  const capability = agent.registry.list().find((item) => item.name === toolName);
  if (!capability) {
    return false;
  }

  return capabilityRequiresAuth(capability);
}

/**
 * Processes a single MCP JSON-RPC request against the agent registry.
 */
export async function handleMcpJsonRpc(
  agent: McpAgent,
  payload: JsonRpcRequest,
  context: McpRpcContext
): Promise<McpRpcOutcome> {
  const { id, method, params } = payload;

  if (method === 'initialize') {
    return {
      kind: 'result',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'lite-toon-mcp',
          version: '0.1.0',
        },
      },
    };
  }

  if (method === 'ping') {
    return { kind: 'result', id, result: {} };
  }

  if (method === 'notifications/initialized') {
    return { kind: 'no-content' };
  }

  if (method === 'tools/list') {
    return {
      kind: 'result',
      id,
      result: {
        tools: agent.registry.exportMcpTools(),
      },
    };
  }

  if (method === 'tools/call') {
    const toolName = params?.name;
    const toolArgs = (params?.arguments as Record<string, unknown> | undefined) ?? {};

    if (!toolName || typeof toolName !== 'string') {
      return {
        kind: 'error',
        id,
        code: -32602,
        message: 'Invalid params: tool name is required.',
      };
    }

    const capability = agent.registry.list().find((item) => item.name === toolName);
    if (!capability) {
      return {
        kind: 'result',
        id,
        result: formatToolResult({
          success: false,
          message: `Capability '${toolName}' not found.`,
        }),
      };
    }

    try {
      const requiresAuth = capabilityRequiresAuth(capability);
      const access = await agent.gatekeeper.checkAccess(
        { ip: context.ip, agentId: context.agentId, accessToken: context.accessToken },
        {
          requireAuth: requiresAuth,
          requiredScopes: capability.scopes,
        }
      );

      const response = await agent.registry.execute(toolName, toolArgs, {
        userId: access.userId,
        agentId: access.agentId,
        scopes: access.scopes,
      });

      return {
        kind: 'result',
        id,
        result: formatToolResult(response),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Capability execution failed.';
      if (isAuthError(message)) {
        throw error;
      }

      return {
        kind: 'result',
        id,
        result: formatToolResult({ success: false, message }),
      };
    }
  }

  return {
    kind: 'error',
    id,
    code: -32601,
    message: `Method not found: ${method}`,
  };
}

export function mcpMethodRequiresAuth(method: string): boolean {
  return method === 'tools/call';
}