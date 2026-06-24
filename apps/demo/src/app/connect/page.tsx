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
          <h1 className="text-3xl font-semibold text-zinc-900">Collega agent AI al negozio</h1>
          <p className="text-zinc-600">
            Configurazione per merchant e sviluppatori. Gli utenti finali parlano solo con ChatGPT,
            Gemini o Claude — non vedono questi dettagli tecnici.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Endpoint condivisi</h2>
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
              <dt className="font-medium text-zinc-700">Client ID demo</dt>
              <dd className="mt-1 font-mono text-zinc-600">lite-toon-demo</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">ChatGPT (Custom GPT / Actions)</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
            <li>Crea un Custom GPT nel builder OpenAI.</li>
            <li>In Actions, importa lo schema OpenAPI da <code className="font-mono">{openApiUrl}</code>.</li>
            <li>Configura OAuth con authorization URL e token URL sopra.</li>
            <li>Usa client ID <code className="font-mono">lite-toon-demo</code> e PKCE abilitato.</li>
            <li>Al primo utilizzo, l&apos;utente verrà reindirizzato a <code className="font-mono">/login</code>.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Claude (MCP)</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
            <li>Connetti il client MCP all&apos;SSE endpoint: <code className="font-mono">{mcpSseUrl}</code></li>
            <li>Il server invierà il message endpoint: <code className="font-mono">{mcpMessageUrl}</code></li>
            <li>Invia richieste JSON-RPC con header <code className="font-mono">Authorization: Bearer &lt;token&gt;</code></li>
            <li>Ottieni il token tramite il flusso OAuth sopra.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Gemini (Extensions / OpenAPI)</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
            <li>Importa lo stesso OpenAPI da <code className="font-mono">{openApiUrl}</code> in Google AI Studio o Gem.</li>
            <li>Configura OAuth con gli stessi URL di ChatGPT.</li>
            <li>Le function declarations sono equivalenti agli MCP tools esportati dal registry.</li>
          </ol>
        </section>

        <p className="text-sm text-zinc-500">
          <a href="/" className="underline hover:text-zinc-700">Torna alla demo chat</a>
          {' · '}
          <a href="/login" className="underline hover:text-zinc-700">Login OAuth</a>
        </p>
      </div>
    </main>
  );
}
