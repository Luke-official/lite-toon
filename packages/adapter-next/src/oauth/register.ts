import { NextRequest, NextResponse } from 'next/server';
import { oauthError, oauthErrorCode } from '../http/errors';
import { OAuthAdapterOptions } from './types';

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
    } catch (error: unknown) {
      return oauthError(oauthErrorCode(error, 'invalid_client_metadata'), undefined, 400);
    }
  };
}
