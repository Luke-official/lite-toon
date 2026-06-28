import { NextRequest, NextResponse } from 'next/server';
import { readJsonOrFormBody } from '../http/request';
import { oauthError, oauthErrorCode } from '../http/errors';
import { OAuthAdapterOptions } from './types';

/**
 * Handles OAuth 2.0 token exchange (authorization_code + PKCE).
 */
export function createOAuthTokenHandler(options: OAuthAdapterOptions) {
  return async function POST(req: NextRequest) {
    try {
      const body = await readJsonOrFormBody(req);

      const token = await options.oauth.issueToken({
        grantType: body.grant_type,
        code: body.code,
        redirectUri: body.redirect_uri,
        clientId: body.client_id,
        codeVerifier: body.code_verifier,
        refreshToken: body.refresh_token,
      });

      return NextResponse.json(token);
    } catch (error: unknown) {
      return oauthError(oauthErrorCode(error, 'invalid_request'), undefined, 400);
    }
  };
}
