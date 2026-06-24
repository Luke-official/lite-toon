/**
 * Represents the base interface for an incoming agent request.
 */
export interface AgentRequest {
  action: string;
  params?: any;
}

/**
 * Represents the base interface for an agent response.
 */
export interface AgentResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Represents a single capability that an agent can execute.
 */
export interface Capability {
  name: string;
  description: string;
  schema?: Record<string, any>;
  execute(params: any): Promise<AgentResponse>;
}

/**
 * Context provided by the framework adapter to the Security Gatekeeper.
 */
export interface SecurityContext {
  apiKey?: string;
  ip?: string;
  agentId: string;
}

/**
 * Global configuration for the Universal Agent API Core.
 */
export interface UniversalAgentConfig {
  capabilities: Capability[];
}
