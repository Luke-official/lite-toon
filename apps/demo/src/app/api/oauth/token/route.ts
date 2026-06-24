import { createOAuthTokenHandler } from '@lite-toon/bridge/next';
import { oauthServer } from '@/lib/auth';

export const POST = createOAuthTokenHandler({ oauth: oauthServer });
