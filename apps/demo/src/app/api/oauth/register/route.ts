import { createOAuthRegisterHandler } from '@lite-toon/bridge/next';
import { oauthServer } from '@/lib/auth';

export const POST = createOAuthRegisterHandler({ oauth: oauthServer });
