import { NextRequest, NextResponse } from 'next/server';
import { getRequestBaseUrl } from '../http/request';
import { sessionCookieOptions } from '../http/cookies';
import { oauthError, oauthErrorCode } from '../http/errors';
import { OAUTH_RETURN_COOKIE, SESSION_COOKIE } from './constants';
import { OAuthAdapterOptions } from './types';

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
        const loginRedirect = new URL(loginPath, getRequestBaseUrl(req));
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
    } catch (error: unknown) {
      return oauthError(oauthErrorCode(error, 'server_error'), undefined, 400);
    }
  };
}
