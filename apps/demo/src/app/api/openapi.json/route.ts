import { createOpenApiSpecHandler } from '@lite-toon/bridge/next';
import { agent } from '@/agent';

function getBaseUrl(req: Request): string {
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}

export const GET = createOpenApiSpecHandler(agent, {
  getExportOptions: (req) => {
    const baseUrl = getBaseUrl(req);
    return {
      baseUrl,
      title: 'Lite-Toon Demo Shop API',
      version: '1.0.0',
      oauth: {
        authorizationUrl: `${baseUrl}/api/oauth/authorize`,
        tokenUrl: `${baseUrl}/api/oauth/token`,
        scopes: {
          'cart:read': 'Read cart and product catalog',
          'cart:write': 'Modify cart contents',
        },
      },
    };
  },
});
