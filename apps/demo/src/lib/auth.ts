import { InMemoryAuthStore, OAuthServer } from '@lite-toon/bridge';

const authStore = new InMemoryAuthStore();

export const oauthServer = new OAuthServer({
  store: authStore,
  clientId: process.env.OAUTH_CLIENT_ID ?? 'lite-toon-demo',
  allowedRedirectUris: [
    'https://chat.openai.com/aip/oauth/callback',
    'https://chatgpt.com/aip/oauth/callback',
    'http://localhost:3000/oauth/callback',
  ],
});
