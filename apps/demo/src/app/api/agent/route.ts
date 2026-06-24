import { createNextAgentHandler } from '@lite-toon/bridge/next';
import { agent } from '@/agent';

/**
 * POST /api/agent
 * Standard REST/Webhook endpoint for Custom GPT interactions.
 * This route simply delegates to the Next.js REST adapter, keeping the route file clean.
 */
export const POST = createNextAgentHandler(agent);
