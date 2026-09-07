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
      title: 'TaskFlow API — lite-toon Demo',
      version: '1.0.0',
      oauth: {
        authorizationUrl: `${baseUrl}/api/oauth/authorize`,
        tokenUrl: `${baseUrl}/api/oauth/token`,
        scopes: {
          'tasks:read': 'Read tasks',
          'tasks:write': 'Create and update tasks',
          'tasks:admin': 'Delete tasks (requires HITL approval)',
        },
      },
    };
  },
});
