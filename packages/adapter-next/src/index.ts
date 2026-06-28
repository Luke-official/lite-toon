export { createNextAgentHandler } from './rest/agent';
export { createNextToolsHandler } from './rest/tools';
export { createOpenApiSpecHandler } from './openapi';
export type { OpenApiHandlerOptions } from './openapi';
export { createOAuthAuthorizeHandler } from './oauth/authorize';
export { createOAuthTokenHandler } from './oauth/token';
export { createOAuthLoginHandler } from './oauth/login';
export { createOAuthRegisterHandler } from './oauth/register';
export { SESSION_COOKIE } from './oauth/constants';
export type { OAuthAdapterOptions } from './oauth/types';
export { createMCPStreamableHttpHandler } from './mcp/http';
export type { MCPHttpHandlerOptions } from './mcp/http';
export {
  createOAuthProtectedResourceHandler,
  createOAuthAuthorizationServerMetadataHandler,
  createMcpUnauthorizedResponse,
  buildProtectedResourceMetadata,
  buildAuthorizationServerMetadata,
} from './mcp/oauth-metadata';
export type { McpOAuthOptions } from './mcp/oauth-metadata';
export { getRequestBaseUrl } from './http/request';
export { handleMcpJsonRpc, mcpMethodRequiresAuth, mcpToolCallRequiresAuth } from './mcp/core';
export type { JsonRpcRequest, McpRpcContext, McpAgent } from './mcp/core';
