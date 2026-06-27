import { NextRequest, NextResponse } from 'next/server';
import { OAuthServer } from '@lite-toon/auth';

const SESSION_COOKIE = 'lite_toon_session';

export interface OAuthAdapterOptions {
  oauth: OAuthServer;
  loginPath?: string;
}

function oauthError(error: string, description?: string, status: number = 400) {
  return NextResponse.json(
    {
      error,
      error_description: description ?? error,
    },
    { status }
  );
}

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}

const OAUTH_RETURN_COOKIE = 'lite_toon_oauth_return';

function sessionCookieOptions(req: NextRequest) {
  const isSecure = req.headers.get('x-forwarded-proto') === 'https';
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 86400,
    secure: isSecure,
  };
}

function toAbsoluteRedirectUrl(pathOrUrl: string, req: NextRequest): string {
  return new URL(pathOrUrl, getBaseUrl(req)).toString();
}

function sanitizeReturnUrl(returnUrl: string | undefined, req: NextRequest): string | null {
  if (!returnUrl?.trim()) return null;

  const baseUrl = getBaseUrl(req);
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

async function readLoginBody(req: NextRequest): Promise<{ username: string; returnUrl?: string }> {
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

function attachSessionCookie(response: NextResponse, req: NextRequest, sessionId: string) {
  response.cookies.set(SESSION_COOKIE, sessionId, sessionCookieOptions(req));
}

function clearOAuthReturnCookie(response: NextResponse, req: NextRequest) {
  response.cookies.set(OAUTH_RETURN_COOKIE, '', {
    ...sessionCookieOptions(req),
    maxAge: 0,
  });
}

/**
 * Handles OAuth 2.0 authorization requests with PKCE.
 */
export function createOAuthAuthorizeHandler(options: OAuthAdapterOptions) {
  const loginPath = options.loginPath ?? '/login';

  return async function GET(req: NextRequest) {
    try {
      const url = new URL(req.url);
      const clientId = url.searchParams.get('client_id') ?? '';
      const redirectUri = url.searchParams.get('redirect_uri') ?? '';
      const responseType = url.searchParams.get('response_type') ?? '';
      const scope = url.searchParams.get('scope') ?? 'cart:read cart:write';
      const state = url.searchParams.get('state') ?? undefined;
      const codeChallenge = url.searchParams.get('code_challenge') ?? '';
      const codeChallengeMethod = url.searchParams.get('code_challenge_method') ?? 'S256';

      const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
      const userId = sessionId ? await options.oauth.resolveSession(sessionId) : null;

      if (!userId) {
        const returnUrl = `${url.pathname}${url.search}`;
        const loginRedirect = new URL(loginPath, getBaseUrl(req));
        loginRedirect.searchParams.set('returnUrl', returnUrl);
        const response = NextResponse.redirect(loginRedirect.toString());
        response.cookies.set(OAUTH_RETURN_COOKIE, returnUrl, {
          ...sessionCookieOptions(req),
          maxAge: 600,
        });
        return response;
      }

      const result = await options.oauth.authorize(userId, {
        clientId,
        redirectUri,
        responseType,
        scope,
        state,
        codeChallenge,
        codeChallengeMethod,
      });

      return NextResponse.redirect(result.redirectUrl);
    } catch (error: any) {
      return oauthError(error.message || 'server_error', undefined, 400);
    }
  };
}

/**
 * Handles OAuth 2.0 token exchange (authorization_code + PKCE).
 */
export function createOAuthTokenHandler(options: OAuthAdapterOptions) {
  return async function POST(req: NextRequest) {
    try {
      let body: Record<string, string>;

      const contentType = req.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        body = (await req.json()) as Record<string, string>;
      } else {
        const form = await req.formData();
        body = Object.fromEntries(
          Array.from(form.entries()).map(([key, value]) => [key, String(value)])
        );
      }

      const token = await options.oauth.issueToken({
        grantType: body.grant_type,
        code: body.code,
        redirectUri: body.redirect_uri,
        clientId: body.client_id,
        codeVerifier: body.code_verifier,
        refreshToken: body.refresh_token,
      });

      return NextResponse.json(token);
    } catch (error: any) {
      return oauthError(error.message || 'invalid_request', undefined, 400);
    }
  };
}

/**
 * Creates a login handler that establishes a demo session cookie.
 */
export function createOAuthLoginHandler(options: OAuthAdapterOptions) {
  return async function POST(req: NextRequest) {
    try {
      const { username, returnUrl: bodyReturnUrl } = await readLoginBody(req);
      if (!username) {
        return NextResponse.json({ error: 'username is required' }, { status: 400 });
      }

      const cookieReturnUrl = req.cookies.get(OAUTH_RETURN_COOKIE)?.value;
      const returnUrl =
        sanitizeReturnUrl(bodyReturnUrl, req) ?? sanitizeReturnUrl(cookieReturnUrl, req);

      const session = await options.oauth.login(username);

      if (returnUrl) {
        const response = NextResponse.redirect(toAbsoluteRedirectUrl(returnUrl, req), 303);
        attachSessionCookie(response, req, session.sessionId);
        clearOAuthReturnCookie(response, req);
        return response;
      }

      const response = NextResponse.json({
        success: true,
        userId: session.userId,
      });
      attachSessionCookie(response, req, session.sessionId);
      return response;
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'login_failed' },
        { status: 400 }
      );
    }
  };
}

/**
 * Handles OAuth 2.0 dynamic client registration (RFC 7591).
 */
export function createOAuthRegisterHandler(options: OAuthAdapterOptions) {
  return async function POST(req: NextRequest) {
    try {
      const body = (await req.json()) as {
        redirect_uris?: string[];
        client_name?: string;
      };

      if (!body.redirect_uris?.length) {
        return oauthError('invalid_redirect_uri', 'redirect_uris is required', 400);
      }

      const registration = await options.oauth.registerClient({
        redirect_uris: body.redirect_uris,
        client_name: body.client_name,
      });

      return NextResponse.json(registration, { status: 201 });
    } catch (error: any) {
      return oauthError(error.message || 'invalid_client_metadata', undefined, 400);
    }
  };
}

export { SESSION_COOKIE };
