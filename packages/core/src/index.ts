export { UniversalAgent } from './agent';
export { CapabilityRegistry } from './registry';
export { buildOpenApiDocument } from './openapi';
export { capabilityRequiresAuth } from './capability-auth';
export { SecurityError, SecurityErrorCode } from './errors/SecurityError';
export {
  SecurityGatekeeper,
  InMemoryRateLimiterStore,
} from './security';
export type { RateLimiterStore, SecurityGatekeeperOptions } from './security';
export type {
  AgentRequest,
  AgentResponse,
  Capability,
  SecurityContext,
  UniversalAgentConfig,
  ExecutionContext,
  TokenResolver,
  ResolvedToken,
  AccessCheckOptions,
  ResolvedAccess,
  OpenApiOAuthConfig,
  OpenApiExportOptions,
} from './types';
