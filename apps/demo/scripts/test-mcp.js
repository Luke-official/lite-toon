// MCP JSON-RPC test for the demo app.
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

async function getAccessToken() {
  const codeVerifier = base64Url(crypto.randomBytes(32));
  const codeChallenge = base64Url(
    crypto.createHash('sha256').update(codeVerifier).digest()
  );

  const loginRes = await fetch(`${BASE_URL}/api/oauth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'mcp-test-user' }),
  });

  const cookie = loginRes.headers.get('set-cookie');
  if (!cookie) throw new Error('Login failed: missing session cookie.');

  const authorizeUrl = new URL(`${BASE_URL}/api/oauth/authorize`);
  authorizeUrl.searchParams.set('client_id', CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', SCOPES);
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  const authorizeRes = await fetch(authorizeUrl, {
    redirect: 'manual',
    headers: { Cookie: cookie.split(';')[0] },
  });

  const location = authorizeRes.headers.get('location');
  const code = new URL(location).searchParams.get('code');
  if (!code) throw new Error('Authorization code missing.');

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

  return tokenBody.access_token;
}

async function rpc(url, id, method, params, accessToken) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: accessToken ? `Bearer ${accessToken}` : '',
      'x-agent-id': 'mcp-test-script',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    }),
  });

  if (response.status === 204) {
    return { status: response.status, body: null, headers: response.headers };
  }

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { status: response.status, body, headers: response.headers };
}

async function main() {
  console.log('Checking OAuth discovery endpoints...');
  const prm = await fetch(`${BASE_URL}/.well-known/oauth-protected-resource`);
  if (!prm.ok) throw new Error('Protected resource metadata failed.');
  console.log('PRM:', JSON.stringify(await prm.json(), null, 2));

  const asm = await fetch(`${BASE_URL}/.well-known/oauth-authorization-server`);
  if (!asm.ok) throw new Error('Authorization server metadata failed.');
  console.log('ASM:', JSON.stringify(await asm.json(), null, 2));

  console.log('Checking getProducts works WITHOUT token...');
  const publicProducts = await rpc(`${BASE_URL}/api/mcp`, 10, 'tools/call', {
    name: 'getProducts',
    arguments: {},
  }, null);
  if (publicProducts.status !== 200 || publicProducts.body?.error) {
    throw new Error(`getProducts should work without auth: ${JSON.stringify(publicProducts.body)}`);
  }
  console.log('Public getProducts OK');

  console.log('Checking tools/call returns 401 without token for addToCart...');
  const unauthorized = await rpc(`${BASE_URL}/api/mcp`, 99, 'tools/call', {
    name: 'addToCart',
    arguments: { productId: 'p1', quantity: 1 },
  }, null);
  if (unauthorized.status !== 401) {
    throw new Error(`Expected 401 for unauthenticated tools/call, got ${unauthorized.status}`);
  }
  console.log('Unauthorized discovery OK');

  console.log('Obtaining access token...');
  const accessToken = await getAccessToken();

  console.log('Streamable HTTP: initialize...');
  const init = await rpc(`${BASE_URL}/api/mcp`, 1, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' },
  }, accessToken);
  console.log(JSON.stringify(init.body, null, 2));

  console.log('Streamable HTTP: tools/list...');
  const tools = await rpc(`${BASE_URL}/api/mcp`, 2, 'tools/list', {}, accessToken);
  console.log(JSON.stringify(tools.body, null, 2));

  console.log('Streamable HTTP: tools/call addToCart...');
  const call = await rpc(`${BASE_URL}/api/mcp`, 3, 'tools/call', {
    name: 'addToCart',
    arguments: { productId: 'p2', quantity: 1 },
  }, accessToken);
  console.log(JSON.stringify(call.body, null, 2));

  if (call.body?.error) {
    process.exit(1);
  }

  console.log('MCP test completed successfully.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
