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
  const mcpSseUrl = `${baseUrl}/api/mcp/sse`;
  const mcpMessageUrl = `${baseUrl}/api/mcp/message`;

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

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Shared endpoints</h2>
          <dl className="mt-4 space-y-3 text-sm">
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
          <h2 className="text-lg font-semibold text-zinc-900">Claude (MCP)</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
            <li>Connect your MCP client to the SSE endpoint: <code className="font-mono">{mcpSseUrl}</code></li>
            <li>The server advertises the message endpoint: <code className="font-mono">{mcpMessageUrl}</code></li>
            <li>Send JSON-RPC requests with header <code className="font-mono">Authorization: Bearer &lt;token&gt;</code></li>
            <li>Obtain the token via the OAuth flow above.</li>
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
          <a href="/" className="underline hover:text-zinc-700">Back to demo chat</a>
          {' · '}
          <a href="/login" className="underline hover:text-zinc-700">OAuth login</a>
        </p>
      </div>
    </main>
  );
}
