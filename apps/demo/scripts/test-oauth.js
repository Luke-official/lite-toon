// OAuth + tools flow test for the demo app.
// Ensure the Next.js dev server is running before executing this script.

import crypto from 'node:crypto';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const CLIENT_ID = 'lite-toon-demo';
const REDIRECT_URI = 'http://localhost:3000/oauth/callback';
const SCOPES = 'cart:read cart:write';

function base64Url(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function main() {
  const codeVerifier = base64Url(crypto.randomBytes(32));
  const codeChallenge = base64Url(
    crypto.createHash('sha256').update(codeVerifier).digest()
  );

  console.log('1) Logging in demo user...');
  const loginRes = await fetch(`${BASE_URL}/api/oauth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'oauth-test-user' }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status}`);
  }

  const cookie = loginRes.headers.get('set-cookie');
  if (!cookie) {
    throw new Error('Missing session cookie from login response.');
  }

  console.log('2) Requesting authorization code...');
  const authorizeUrl = new URL(`${BASE_URL}/api/oauth/authorize`);
  authorizeUrl.searchParams.set('client_id', CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', SCOPES);
  authorizeUrl.searchParams.set('state', 'test-state');
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  const authorizeRes = await fetch(authorizeUrl, {
    redirect: 'manual',
    headers: { Cookie: cookie.split(';')[0] },
  });

  const location = authorizeRes.headers.get('location');
  if (!location) {
    throw new Error('Authorization redirect missing.');
  }

  const redirect = new URL(location);
  const code = redirect.searchParams.get('code');
  if (!code) {
    throw new Error(`Authorization code missing. Redirect: ${location}`);
  }

  console.log('3) Exchanging code for access token...');
  const tokenRes = await fetch(`${BASE_URL}/api/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: codeVerifier,
    }),
  });

  const tokenBody = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(`Token exchange failed: ${JSON.stringify(tokenBody)}`);
  }

  const accessToken = tokenBody.access_token;
  console.log('Access token received.');

  console.log('4) Calling addToCart tool...');
  const toolRes = await fetch(`${BASE_URL}/api/tools/addToCart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'x-agent-id': 'oauth-test-script',
    },
    body: JSON.stringify({ productId: 'p1', quantity: 2 }),
  });

  const toolBody = await toolRes.json();
  console.log('Tool response:', JSON.stringify(toolBody, null, 2));

  console.log('5) Calling getCart tool...');
  const cartRes = await fetch(`${BASE_URL}/api/tools/getCart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'x-agent-id': 'oauth-test-script',
    },
    body: JSON.stringify({}),
  });

  const cartBody = await cartRes.json();
  console.log('Cart response:', JSON.stringify(cartBody, null, 2));

  if (!toolRes.ok || !cartRes.ok) {
    process.exit(1);
  }

  console.log('OAuth + tools test completed successfully.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
