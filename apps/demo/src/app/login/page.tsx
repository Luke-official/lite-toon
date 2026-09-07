'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') ?? '/';
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            ✦ TaskFlow
          </Link>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            lite-toon demo
          </p>
        </div>

        {/* Card */}
        <div className="glass p-7 flex flex-col gap-5">
          {/* Tab toggle */}
          <div
            className="flex rounded-lg p-1 gap-1"
            style={{ background: 'var(--bg-base)' }}
          >
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-1.5 rounded-md text-sm font-medium transition-all-200"
                style={
                  mode === m
                    ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)' }
                    : { color: 'var(--text-muted)' }
                }
              >
                {m === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form
            action="/api/oauth/login"
            method="POST"
            className="flex flex-col gap-4"
          >
            <input type="hidden" name="returnUrl" value={returnUrl} />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="e.g. alice"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all-200"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--bg-border)')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all-200"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--bg-border)')}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all-200 hover:opacity-90 mt-1"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {/* Hint */}
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            {mode === 'login' ? (
              <>
                New here?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="underline"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="underline"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Dev hint */}
        <div
          className="text-xs text-center px-4 py-3 rounded-lg"
          style={{
            background: 'var(--accent-glow)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--accent-dim)',
          }}
        >
          <span style={{ color: 'var(--accent)' }}>Dev tip:</span> Use the same username
          when Claude asks you to authorize — your tasks are linked to your account.
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--bg-base)' }} />}>
      <LoginForm />
    </Suspense>
  );
}
