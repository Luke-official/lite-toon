import { Request, Response } from 'express';
import { OAuthServer } from '@lite-toon/auth';

export const SESSION_COOKIE = 'lt_session';
export const OAUTH_RETURN_COOKIE = 'lt_oauth_return';

export interface OAuthAdapterOptions {
  oauth: OAuthServer;
  loginPath?: string;
}

function getRequestBaseUrl(req: Request): string {
  const host = req.headers.host || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return `${protocol}://${host}`;
}

export function createOAuthAuthorizeHandler(options: OAuthAdapterOptions) {
  const loginPath = options.loginPath ?? '/login';

  return async function (req: Request, res: Response) {
    try {
      // Use full URL to parse query params
      const baseUrl = getRequestBaseUrl(req);
      const url = new URL(req.url, baseUrl);
      
      const clientId = url.searchParams.get('client_id') ?? '';
      const redirectUri = url.searchParams.get('redirect_uri') ?? '';
      const responseType = url.searchParams.get('response_type') ?? '';
      const scope = url.searchParams.get('scope') ?? 'cart:read cart:write';
      const state = url.searchParams.get('state') ?? undefined;
      const codeChallenge = url.searchParams.get('code_challenge') ?? '';
      const codeChallengeMethod = url.searchParams.get('code_challenge_method') ?? 'S256';

      // Express doesn't parse cookies automatically without cookie-parser middleware.
      // We parse manually to avoid enforcing middleware on the consumer.
      const cookieHeader = req.headers.cookie || '';
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map((v) => v.split('=').map((v) => decodeURIComponent(v.trim())))
      );
      
      const sessionId = cookies[SESSION_COOKIE];
      const userId = sessionId ? await options.oauth.resolveSession(sessionId) : null;

      if (!userId) {
        const returnUrl = `${url.pathname}${url.search}`;
        const loginRedirect = new URL(loginPath, baseUrl);
        loginRedirect.searchParams.set('returnUrl', returnUrl);
        
        res.cookie(OAUTH_RETURN_COOKIE, returnUrl, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: baseUrl.startsWith('https'),
          maxAge: 600 * 1000, // Express maxAge is in milliseconds
        });
        res.redirect(loginRedirect.toString());
        return;
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

      res.redirect(result.redirectUrl);
    } catch (error: any) {
      res.status(400).json({ error: error.code || 'server_error', error_description: error.message });
    }
  };
}

export function createOAuthTokenHandler(options: OAuthAdapterOptions) {
  return async function (req: Request, res: Response) {
    try {
      const body = req.body;

      const token = await options.oauth.issueToken({
        grantType: body.grant_type,
        code: body.code,
        redirectUri: body.redirect_uri,
        clientId: body.client_id,
        codeVerifier: body.code_verifier,
        refreshToken: body.refresh_token,
      });

      res.json(token);
    } catch (error: any) {
      res.status(400).json({ error: error.code || 'invalid_request', error_description: error.message });
    }
  };
}

export function createOAuthLoginHandler(options: OAuthAdapterOptions) {
  return async function (req: Request, res: Response) {
    try {
      const body = req.body;
      const username = body.username as string | undefined;
      const bodyReturnUrl = body.returnUrl as string | undefined;

      if (!username) {
        res.status(400).json({ error: 'username is required' });
        return;
      }

      const cookieHeader = req.headers.cookie || '';
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map((v) => v.split('=').map((v) => decodeURIComponent(v.trim())))
      );
      
      const cookieReturnUrl = cookies[OAUTH_RETURN_COOKIE];
      const returnUrl = bodyReturnUrl || cookieReturnUrl;
      const baseUrl = getRequestBaseUrl(req);

      const session = await options.oauth.login(username);

      res.cookie(SESSION_COOKIE, session.sessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: baseUrl.startsWith('https'),
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      if (returnUrl) {
        res.clearCookie(OAUTH_RETURN_COOKIE);
        const absoluteRedirect = new URL(returnUrl, baseUrl).toString();
        res.redirect(303, absoluteRedirect);
        return;
      }

      res.json({ success: true, userId: session.userId });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'login_failed' });
    }
  };
}

export function createOAuthRegisterHandler(options: OAuthAdapterOptions) {
  return async function (req: Request, res: Response) {
    try {
      const body = req.body;

      if (!body.redirect_uris?.length) {
        res.status(400).json({ error: 'invalid_redirect_uri', error_description: 'redirect_uris is required' });
        return;
      }

      const registration = await options.oauth.registerClient({
        redirect_uris: body.redirect_uris,
        client_name: body.client_name,
      });

      res.status(201).json(registration);
    } catch (error: any) {
      res.status(400).json({ error: error.code || 'invalid_client_metadata', error_description: error.message });
    }
  };
}

export interface McpOAuthOptions {
  oauthTokenUrl?: string;
  oauthAuthorizationUrl?: string;
}

export function buildProtectedResourceMetadata(req: Request, options: McpOAuthOptions = {}) {
  const baseUrl = getRequestBaseUrl(req);
  return {
    authorization_servers: [
      options.oauthTokenUrl
        ? new URL(options.oauthTokenUrl).origin
        : baseUrl,
    ],
  };
}

export function buildAuthorizationServerMetadata(req: Request, options: McpOAuthOptions = {}) {
  const baseUrl = getRequestBaseUrl(req);
  const authUrl = options.oauthAuthorizationUrl || `${baseUrl}/api/oauth/authorize`;
  const tokenUrl = options.oauthTokenUrl || `${baseUrl}/api/oauth/token`;
  
  return {
    issuer: baseUrl,
    authorization_endpoint: authUrl,
    token_endpoint: tokenUrl,
    registration_endpoint: `${baseUrl}/api/oauth/register`,
    scopes_supported: ['cart:read', 'cart:write'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none'],
    code_challenge_methods_supported: ['S256'],
  };
}

export function createOAuthProtectedResourceHandler(options: McpOAuthOptions = {}) {
  return async function (req: Request, res: Response) {
    res.json(buildProtectedResourceMetadata(req, options));
  };
}

export function createOAuthAuthorizationServerMetadataHandler(options: McpOAuthOptions = {}) {
  return async function (req: Request, res: Response) {
    res.json(buildAuthorizationServerMetadata(req, options));
  };
}
