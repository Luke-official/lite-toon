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
 * Runtime context passed to capability handlers after authentication.
 */
export interface ExecutionContext {
  userId: string;
  agentId: string;
  scopes: string[];
  approvalToken?: string;
}

/**
 * Resolves a bearer access token into user identity and scopes.
 */
export interface TokenResolver {
  resolve(accessToken: string): Promise<ResolvedToken | null>;
}

/**
 * Result of a successful token resolution.
 */
export interface ResolvedToken {
  userId: string;
  scopes: string[];
}

/**
 * Risk classification for a capability.
 * - `read`        No side effects — safe to call without user confirmation.
 * - `write`       Modifies user state (cart, profile, preferences).
 * - `destructive` Irreversible mutation (delete, checkout, refund, revoke).
 *
 * Defaults to `'write'` when not specified.
 */
export type CapabilityRiskLevel = 'read' | 'write' | 'destructive';

/**
 * Represents a single capability that an agent can execute.
 */
export interface Capability {
  name: string;
  description: string;
  schema?: Record<string, any>;
  /** OAuth scopes required to invoke this capability. Use `[]` for public (no login) tools. */
  scopes?: string[];
  /**
   * Risk level of this capability.
   * Defaults to `'write'` when omitted — conservative posture.
   * Set explicitly to `'read'` for side-effect-free capabilities.
   * Set to `'destructive'` for irreversible mutations.
   */
  riskLevel?: CapabilityRiskLevel;
  execute(params: any, context?: ExecutionContext): Promise<AgentResponse>;
}

/**
 * Context provided by the framework adapter to the Security Gatekeeper.
 */
export interface SecurityContext {
  apiKey?: string;
  accessToken?: string;
  ip?: string;
  agentId: string;
}

/**
 * Options for access checks performed by the gatekeeper.
 */
export interface AccessCheckOptions {
  requireAuth?: boolean;
  requiredScopes?: string[];
}

/**
 * Successful access check result with resolved user identity.
 */
export interface ResolvedAccess {
  userId: string;
  scopes: string[];
  agentId: string;
}

/**
 * OAuth URLs used when exporting OpenAPI documents.
 */
export interface OpenApiOAuthConfig {
  authorizationUrl: string;
  tokenUrl: string;
  scopes?: Record<string, string>;
}

/**
 * Options for generating an OpenAPI document from the registry.
 */
export interface OpenApiExportOptions {
  baseUrl: string;
  title?: string;
  version?: string;
  oauth: OpenApiOAuthConfig;
  toolsPathPrefix?: string;
}

/**
 * Global configuration for the Universal Agent API Core.
 */
export interface UniversalAgentConfig {
  capabilities: Capability[];
  tokenResolver?: TokenResolver;
  hitlStore?: HitlStore;
}

/**
 * Status of a Human-in-the-Loop approval request.
 */
export type HitlStatus = 'pending' | 'approved' | 'rejected' | 'expired';

/**
 * Represents a pending execution that requires human approval.
 */
export interface HitlRequest {
  id: string;
  capabilityName: string;
  params: any;
  context?: ExecutionContext;
  status: HitlStatus;
  createdAt: number;
}

/**
 * Interface for persisting HITL approval requests.
 */
export interface HitlStore {
  create(request: Omit<HitlRequest, 'id' | 'createdAt' | 'status'>): Promise<HitlRequest>;
  get(id: string): Promise<HitlRequest | null>;
  updateStatus(id: string, status: HitlStatus): Promise<boolean>;
  listPending(): Promise<HitlRequest[]>;
}
