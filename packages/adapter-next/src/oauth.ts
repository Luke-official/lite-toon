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
        return NextResponse.redirect(loginRedirect);
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
      const body = (await req.json()) as { username?: string };
      const username = String(body.username ?? '').trim();
      if (!username) {
        return NextResponse.json({ error: 'username is required' }, { status: 400 });
      }

      const session = await options.oauth.login(username);
      const response = NextResponse.json({
        success: true,
        userId: session.userId,
      });

      response.cookies.set(SESSION_COOKIE, session.sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 86400,
      });

      return response;
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'login_failed' },
        { status: 400 }
      );
    }
  };
}

export { SESSION_COOKIE };
