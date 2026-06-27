'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') ?? '/connect';

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Sign in to Lite-Toon Demo</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Enter a username to link your cart to AI agents. You only need this to add items or view
          your cart — browsing products is public.
        </p>

        <form action="/api/oauth/login" method="POST" className="mt-6 space-y-4">
          <input type="hidden" name="returnUrl" value={returnUrl} />
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-zinc-700">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
              placeholder="e.g. Test Dev"
              required
              autoComplete="username"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
      <LoginForm />
    </Suspense>
  );
}
