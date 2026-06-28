import { NextRequest, NextResponse } from 'next/server';
import { getRequestBaseUrl } from '../http/request';
import { sessionCookieOptions } from '../http/cookies';
import { OAUTH_RETURN_COOKIE, SESSION_COOKIE } from './constants';

export function toAbsoluteRedirectUrl(pathOrUrl: string, req: NextRequest): string {
  return new URL(pathOrUrl, getRequestBaseUrl(req)).toString();
}

export function sanitizeReturnUrl(returnUrl: string | undefined, req: NextRequest): string | null {
  if (!returnUrl?.trim()) return null;

  const baseUrl = getRequestBaseUrl(req);
  if (!returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
    return null;
  }

  try {
    const parsed = new URL(returnUrl, baseUrl);
    if (parsed.origin !== new URL(baseUrl).origin) {
      return null;
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

export async function readLoginBody(req: NextRequest): Promise<{ username: string; returnUrl?: string }> {
  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = (await req.json()) as { username?: string; returnUrl?: string };
    return {
      username: String(body.username ?? '').trim(),
      returnUrl: body.returnUrl,
    };
  }

  const form = await req.formData();
  return {
    username: String(form.get('username') ?? '').trim(),
    returnUrl: form.get('returnUrl') ? String(form.get('returnUrl')) : undefined,
  };
}

export function attachSessionCookie(response: NextResponse, req: NextRequest, sessionId: string) {
  response.cookies.set(SESSION_COOKIE, sessionId, sessionCookieOptions(req));
}

export function clearOAuthReturnCookie(response: NextResponse, req: NextRequest) {
  response.cookies.set(OAUTH_RETURN_COOKIE, '', {
    ...sessionCookieOptions(req),
    maxAge: 0,
  });
}
