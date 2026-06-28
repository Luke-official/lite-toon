import { createNextToolsHandler } from '@lite-toon/bridge/next';
import type { NextRequest } from 'next/server';
import { agent } from '@/agent';

const handler = createNextToolsHandler(agent);

export async function POST(
  req: Request,
  context: { params: Promise<{ name: string }> }
) {
  return handler(req as NextRequest, context);
}
