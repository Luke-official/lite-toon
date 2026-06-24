import { Capability, AgentResponse, ExecutionContext, OpenApiExportOptions } from './types';
import { buildOpenApiDocument } from './openapi';

/**
 * Registry for managing and executing agent capabilities.
 */
export class CapabilityRegistry {
  private capabilities: Map<string, Capability> = new Map();

  /**
   * Registers a new capability in the registry.
   * @param capability The capability to register.
   */
  register(capability: Capability): void {
    if (this.capabilities.has(capability.name)) {
      console.warn(`Capability '${capability.name}' is already registered and will be overwritten.`);
    }
    this.capabilities.set(capability.name, capability);
  }

  /**
   * Returns all registered capabilities.
   */
  list(): Capability[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Checks whether a capability exists.
   */
  has(name: string): boolean {
    return this.capabilities.has(name);
  }

  /**
   * Executes a capability by name.
   * @param name The name of the capability to execute.
   * @param params The parameters to pass to the capability's execute method.
   * @param context Optional execution context with user identity.
   * @returns A promise resolving to an AgentResponse.
   */
  async execute(name: string, params: any, context?: ExecutionContext): Promise<AgentResponse> {
    const capability = this.capabilities.get(name);

    if (!capability) {
      return {
        success: false,
        message: `Capability '${name}' not found or not implemented yet. Please check the capability name.`,
      };
    }

    if (
      context &&
      context.userId !== 'anonymous' &&
      capability.scopes &&
      capability.scopes.length > 0
    ) {
      const missing = capability.scopes.filter((scope) => !context.scopes.includes(scope));
      if (missing.length > 0) {
        return {
          success: false,
          message: `Missing required scopes: ${missing.join(', ')}`,
        };
      }
    }

    try {
      return await capability.execute(params, context);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || `An error occurred while executing capability '${name}'.`,
      };
    }
  }

  /**
   * Translates and exports all registered capabilities into the official MCP tool JSON schema format.
   * This allows MCP-compliant agents to discover available tools.
   *
   * @returns An array of MCP tool definitions.
   */
  exportMcpTools(): any[] {
    const tools: any[] = [];
    for (const capability of this.capabilities.values()) {
      tools.push({
        name: capability.name,
        description: capability.description,
        inputSchema: capability.schema || {
          type: 'object',
          properties: {},
        },
      });
    }
    return tools;
  }

  /**
   * Exports Gemini-compatible function declarations (same JSON Schema as MCP tools).
   */
  exportGeminiFunctionDeclarations(): Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }> {
    return this.exportMcpTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    }));
  }

  /**
   * Generates an OpenAPI 3.1 document for ChatGPT Actions and Gemini Extensions.
   */
  exportOpenApiDocument(options: OpenApiExportOptions): Record<string, unknown> {
    return buildOpenApiDocument(this.list(), options);
  }
}
