'use client';

import { useEffect, useState } from 'react';

export default function ConnectPage() {
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const openApiUrl = `${baseUrl}/api/openapi.json`;
  const authorizeUrl = `${baseUrl}/api/oauth/authorize`;
  const tokenUrl = `${baseUrl}/api/oauth/token`;
  const registerUrl = `${baseUrl}/api/oauth/register`;
  const mcpUrl = `${baseUrl}/api/mcp`;
  const mcpSseUrl = `${baseUrl}/api/mcp/sse`;
  const prmUrl = `${baseUrl}/.well-known/oauth-protected-resource`;
  const authMetadataUrl = `${baseUrl}/.well-known/oauth-authorization-server`;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Lite-Toon Demo</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Connect AI agents to the shop</h1>
          <p className="text-zinc-600">
            Setup guide for merchants and developers. End users only talk to ChatGPT,
            Gemini, or Claude — they never see these technical details.
          </p>
        </header>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Claude Chat (browser) — quick start with ngrok</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
            <li>Run the demo: <code className="font-mono">npm run dev:clean</code></li>
            <li>In another terminal: <code className="font-mono">ngrok http 3000</code></li>
            <li>Copy the ngrok HTTPS URL (e.g. <code className="font-mono">https://abc123.ngrok-free.app</code>)</li>
            <li>
              Open Claude → Settings → Connectors → Add custom connector
            </li>
            <li>
              MCP server URL: <code className="font-mono">{mcpUrl}</code> (use your ngrok URL as host)
            </li>
            <li>Click Connect — Claude runs OAuth automatically via the well-known endpoints below</li>
            <li>
              Sign in at <code className="font-mono">/login</code> with the same username you use during OAuth
            </li>
            <li>Ask Claude: &quot;What products do you have?&quot; then &quot;Add 2 Nike shoes to my cart&quot;</li>
          </ol>
          <p className="mt-4 text-sm text-zinc-600">
            ngrok URLs matching <code className="font-mono">*.ngrok-free.app</code> and{' '}
            <code className="font-mono">*.ngrok.io</code> are allowed for OAuth redirects automatically.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Shared endpoints</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-medium text-zinc-700">MCP (Streamable HTTP)</dt>
              <dd className="mt-1 break-all font-mono text-zinc-600">{mcpUrl}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">MCP (legacy SSE)</dt>
              <dd className="mt-1 break-all font-mono text-zinc-600">{mcpSseUrl}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Protected resource metadata</dt>
              <dd className="mt-1 break-all font-mono text-zinc-600">{prmUrl}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Authorization server metadata</dt>
              <dd className="mt-1 break-all font-mono text-zinc-600">{authMetadataUrl}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">OpenAPI</dt>
              <dd className="mt-1 break-all font-mono text-zinc-600">{openApiUrl}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">OAuth authorize</dt>
              <dd className="mt-1 break-all font-mono text-zinc-600">{authorizeUrl}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">OAuth token</dt>
              <dd className="mt-1 break-all font-mono text-zinc-600">{tokenUrl}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">OAuth register (DCR)</dt>
              <dd className="mt-1 break-all font-mono text-zinc-600">{registerUrl}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Scopes</dt>
              <dd className="mt-1 font-mono text-zinc-600">cart:read cart:write</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Demo client ID</dt>
              <dd className="mt-1 font-mono text-zinc-600">lite-toon-demo</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Claude connector instructions</h2>
          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-zinc-100 p-4 text-xs text-zinc-800">
{`You are the shopping assistant for LiteShop (Lite-Toon demo store).

Tools:
- getProducts: list catalog (Nike Shoes p1, Adidas T-Shirt p2, Puma Socks p3)
- getCart: show the user's current cart
- addToCart: add items (productId + quantity)
- clearCart: empty the cart

Rules:
- Call getProducts first if you need product IDs
- Confirm add/clear actions with quantities and running total
- Prices are in EUR
- Each user has a private cart tied to their OAuth login`}
          </pre>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">ChatGPT (Custom GPT / Actions)</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
            <li>Create a Custom GPT in the OpenAI builder.</li>
            <li>In Actions, import the OpenAPI schema from <code className="font-mono">{openApiUrl}</code>.</li>
            <li>Configure OAuth with the authorization and token URLs above.</li>
            <li>Use client ID <code className="font-mono">lite-toon-demo</code> with PKCE enabled.</li>
            <li>On first use, users are redirected to <code className="font-mono">/login</code>.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Gemini (Extensions / OpenAPI)</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
            <li>Import the same OpenAPI from <code className="font-mono">{openApiUrl}</code> in Google AI Studio or a Gem.</li>
            <li>Configure OAuth with the same URLs as ChatGPT.</li>
            <li>Function declarations match the MCP tools exported from the registry.</li>
          </ol>
        </section>

        <p className="text-sm text-zinc-500">
          <a href="/" className="underline hover:text-zinc-700">Back to demo shop</a>
          {' · '}
          <a href="/login" className="underline hover:text-zinc-700">OAuth login</a>
        </p>
      </div>
    </main>
  );
}
