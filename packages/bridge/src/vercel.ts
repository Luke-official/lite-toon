import { UniversalAgent } from '@lite-toon/core';

export interface VercelToolOptions {
  /**
   * Optional bound user ID for the execution context
   */
  userId?: string;
  /**
   * The Agent ID triggering this tool (defaults to 'vercel-ai-sdk')
   */
  agentId?: string;
  /**
   * The granted scopes to execute the tool with
   */
  scopes?: string[];
}

/**
 * Creates a Vercel AI SDK compatible tool from a Lite-Toon capability.
 * 
 * Note: When using this with the Vercel AI SDK (>= 3.3.0), you should wrap the parameters
 * with the `jsonSchema` utility from the `ai` package if you are not using Zod.
 * 
 * Example:
 * ```ts
 * import { jsonSchema, tool } from 'ai';
 * import { createVercelToolDefinition } from '@lite-toon/bridge/vercel';
 * 
 * const rawTool = createVercelToolDefinition(agent, 'view_cart', { userId });
 * const vercelTool = tool({
 *   description: rawTool.description,
 *   parameters: jsonSchema(rawTool.schema),
 *   execute: rawTool.execute
 * });
 * ```
 */
export function createVercelToolDefinition(
  agent: UniversalAgent,
  capabilityName: string,
  options: VercelToolOptions = {}
) {
  const capability = agent.registry.list().find((c) => c.name === capabilityName);

  if (!capability) {
    throw new Error(`Capability '${capabilityName}' not found in the registry.`);
  }

  return {
    description: capability.description,
    parameters: capability.schema,
    execute: async (args: any) => {
      const response = await agent.registry.execute(capabilityName, args, {
        userId: options.userId || 'anonymous-agent',
        agentId: options.agentId || 'vercel-ai-sdk',
        scopes: options.scopes || [],
      });

      if (!response.success) {
        throw new Error(response.message || `Execution of '${capabilityName}' failed.`);
      }

      return response.data;
    },
  };
}
