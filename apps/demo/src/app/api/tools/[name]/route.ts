import { createNextToolsHandler } from '@lite-toon/bridge/next';
import { agent } from '@/agent';

const handler = createNextToolsHandler(agent);

export async function POST(
  req: Request,
  context: { params: Promise<{ name: string }> }
) {
  return handler(req as any, context);
}
