import { NextRequest, NextResponse } from 'next/server';
import { OAUTH_RETURN_COOKIE } from './constants';
import { OAuthAdapterOptions } from './types';
import {
  attachSessionCookie,
  clearOAuthReturnCookie,
  readLoginBody,
  sanitizeReturnUrl,
  toAbsoluteRedirectUrl,
} from './utils';

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'login_failed';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  };
}
