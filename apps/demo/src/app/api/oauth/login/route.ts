import { createOAuthLoginHandler } from '@lite-toon/bridge/next';
import { oauthServer } from '@/lib/auth';

export const POST = createOAuthLoginHandler({ oauth: oauthServer });
