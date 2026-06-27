import { NextRequest, NextResponse } from 'next/server';

export interface McpOAuthOptions {
  resourcePath?: string;
  scopes?: string[];
}

export function getRequestBaseUrl(req: NextRequest): string {
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}

export function buildProtectedResourceMetadata(baseUrl: string, options: McpOAuthOptions = {}) {
  const resourcePath = options.resourcePath ?? '/api/mcp';
  const resource = `${baseUrl}${resourcePath}`;
  const scopes = options.scopes ?? ['cart:read', 'cart:write'];

  return {
    resource,
    authorization_servers: [baseUrl],
    scopes_supported: scopes,
    bearer_methods_supported: ['header'],
    resource_documentation: `${baseUrl}/connect`,
  };
}

export function buildAuthorizationServerMetadata(baseUrl: string) {
  return {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/oauth/token`,
    registration_endpoint: `${baseUrl}/api/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['cart:read', 'cart:write'],
  };
}

export function buildWwwAuthenticateHeader(baseUrl: string, options: McpOAuthOptions = {}) {
  const resourcePath = options.resourcePath ?? '/api/mcp';
  const metadataPath =
    resourcePath === '/api/mcp'
      ? `${baseUrl}/.well-known/oauth-protected-resource`
      : `${baseUrl}/.well-known/oauth-protected-resource${resourcePath}`;
  const scopes = (options.scopes ?? ['cart:read', 'cart:write']).join(' ');

  return `Bearer resource_metadata="${metadataPath}", scope="${scopes}"`;
}

/**
 * Returns HTTP 401 with RFC 9728 discovery headers for MCP clients.
 */
export function createMcpUnauthorizedResponse(req: NextRequest, options: McpOAuthOptions = {}) {
  const baseUrl = getRequestBaseUrl(req);
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': buildWwwAuthenticateHeader(baseUrl, options),
    },
  });
}

/**
 * Serves OAuth 2.0 Protected Resource Metadata (RFC 9728).
 */
export function createOAuthProtectedResourceHandler(options: McpOAuthOptions = {}) {
  return async function GET(req: NextRequest) {
    const baseUrl = getRequestBaseUrl(req);
    return NextResponse.json(buildProtectedResourceMetadata(baseUrl, options));
  };
}

/**
 * Serves OAuth 2.0 Authorization Server Metadata (RFC 8414).
 */
export function createOAuthAuthorizationServerMetadataHandler() {
  return async function GET(req: NextRequest) {
    const baseUrl = getRequestBaseUrl(req);
    return NextResponse.json(buildAuthorizationServerMetadata(baseUrl));
  };
}
