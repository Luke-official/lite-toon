import { InMemoryAuthStore, OAuthServer } from '@lite-toon/bridge';

export const authStore = new InMemoryAuthStore();

const extraRedirectUris = (process.env.OAUTH_EXTRA_REDIRECT_URIS ?? '')
  .split(',')
  .map((uri) => uri.trim())
  .filter(Boolean);

export const oauthServer = new OAuthServer({
  store: authStore,
  clientId: process.env.OAUTH_CLIENT_ID ?? 'lite-toon-demo',
  allowedRedirectUris: [
    'https://chat.openai.com/aip/oauth/callback',
    'https://chatgpt.com/aip/oauth/callback',
    'https://claude.ai/api/mcp/auth_callback',
    'http://localhost:3000/oauth/callback',
    ...extraRedirectUris,
  ],
});
