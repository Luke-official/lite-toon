import { createOAuthAuthorizeHandler } from '@lite-toon/bridge/next';
import { oauthServer } from '@/lib/auth';

export const GET = createOAuthAuthorizeHandler({ oauth: oauthServer });
