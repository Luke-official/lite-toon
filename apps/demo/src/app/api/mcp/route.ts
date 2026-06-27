import { createMCPStreamableHttpHandler } from '@lite-toon/bridge/next';
import { agent } from '@/agent';

const handler = createMCPStreamableHttpHandler(agent);

export const GET = handler;
export const POST = handler;
