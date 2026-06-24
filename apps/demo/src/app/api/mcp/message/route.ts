import { createMCPMessageHandler } from '@lite-toon/bridge/next';
import { agent } from '@/agent';

export const POST = createMCPMessageHandler(agent);
