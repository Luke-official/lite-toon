import { Capability } from './types';
import { OpenApiExportOptions } from './types';

const DEFAULT_SCOPES: Record<string, string> = {
  'cart:read': 'Read cart and product catalog',
  'cart:write': 'Modify cart contents',
};

/**
 * Builds scopes required by a capability for OpenAPI security requirements.
 */
function capabilityScopes(capability: Capability): string[] {
  if (capability.scopes) {
    return capability.scopes;
  }
  return ['cart:read'];
}

/**
 * Generates an OpenAPI 3.1 document for ChatGPT Actions and Gemini tool use.
 */
export function buildOpenApiDocument(
  capabilities: Capability[],
  options: OpenApiExportOptions
): Record<string, unknown> {
  const prefix = options.toolsPathPrefix ?? '/api/tools';
  const scopes = { ...DEFAULT_SCOPES, ...options.oauth.scopes };
  const paths: Record<string, unknown> = {};

  for (const capability of capabilities) {
    const pathKey = `${prefix}/${capability.name}`;
    const requiredScopes = capabilityScopes(capability);

    const operation: Record<string, unknown> = {
      operationId: capability.name,
      summary: capability.description,
      description: capability.description,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: capability.schema ?? {
              type: 'object',
              properties: {},
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Successful capability execution',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'object' },
                },
              },
            },
          },
        },
        '400': {
          description: 'Execution error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized',
        },
      },
    };

    if (requiredScopes.length > 0) {
      operation.security = [{ oauth2: requiredScopes }];
    }

    paths[pathKey] = { post: operation };
  }

  return {
    openapi: '3.1.0',
    info: {
      title: options.title ?? 'Lite-Toon Agent API',
      version: options.version ?? '1.0.0',
      description: 'Auto-generated API for AI agent integrations (ChatGPT, Gemini).',
    },
    servers: [{ url: options.baseUrl }],
    paths,
    components: {
      securitySchemes: {
        oauth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: options.oauth.authorizationUrl,
              tokenUrl: options.oauth.tokenUrl,
              scopes,
            },
          },
        },
      },
    },
  };
}
