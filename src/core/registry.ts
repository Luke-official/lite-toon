import { Capability, AgentResponse } from './types';

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
   * Executes a capability by name.
   * @param name The name of the capability to execute.
   * @param params The parameters to pass to the capability's execute method.
   * @returns A promise resolving to an AgentResponse.
   */
  async execute(name: string, params: any): Promise<AgentResponse> {
    const capability = this.capabilities.get(name);
    
    if (!capability) {
      return {
        success: false,
        message: `Capability '${name}' not found or not implemented yet. Please check the capability name.`
      };
    }

    try {
      return await capability.execute(params);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || `An error occurred while executing capability '${name}'.`
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
    for (const [_, capability] of this.capabilities) {
      tools.push({
        name: capability.name,
        description: capability.description,
        inputSchema: capability.schema || {
          type: "object",
          properties: {}
        }
      });
    }
    return tools;
  }
}
