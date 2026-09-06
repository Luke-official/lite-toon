import { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { OAuthServer } from '@lite-toon/auth';

export const SESSION_COOKIE = 'lt_session';
export const OAUTH_RETURN_COOKIE = 'lt_oauth_return';

export interface OAuthAdapterOptions {
  oauth: OAuthServer;
  loginPath?: string;
}

function getRequestBaseUrl(c: Context): string {
  const host = c.req.header('host') || 'localhost:3000';
  const protocol = c.req.header('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}

export function createOAuthAuthorizeHandler(options: OAuthAdapterOptions) {
  const loginPath = options.loginPath ?? '/login';

  return async function (c: Context) {
    try {
      const url = new URL(c.req.url);
      const clientId = url.searchParams.get('client_id') ?? '';
      const redirectUri = url.searchParams.get('redirect_uri') ?? '';
      const responseType = url.searchParams.get('response_type') ?? '';
      const scope = url.searchParams.get('scope') ?? 'cart:read cart:write';
      const state = url.searchParams.get('state') ?? undefined;
      const codeChallenge = url.searchParams.get('code_challenge') ?? '';
      const codeChallengeMethod = url.searchParams.get('code_challenge_method') ?? 'S256';

      const sessionId = getCookie(c, SESSION_COOKIE);
      const userId = sessionId ? await options.oauth.resolveSession(sessionId) : null;

      if (!userId) {
        const returnUrl = `${url.pathname}${url.search}`;
        const loginRedirect = new URL(loginPath, getRequestBaseUrl(c));
        loginRedirect.searchParams.set('returnUrl', returnUrl);
        setCookie(c, OAUTH_RETURN_COOKIE, returnUrl, {
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
          secure: getRequestBaseUrl(c).startsWith('https'),
          maxAge: 600,
        });
        return c.redirect(loginRedirect.toString());
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

      return c.redirect(result.redirectUrl);
    } catch (error: any) {
      return c.json({ error: error.code || 'server_error', error_description: error.message }, 400);
    }
  };
}

export function createOAuthTokenHandler(options: OAuthAdapterOptions) {
  return async function (c: Context) {
    try {
      const contentType = c.req.header('content-type') || '';
      let body: any;
      if (contentType.includes('application/json')) {
        body = await c.req.json();
      } else {
        body = await c.req.parseBody();
      }

      const token = await options.oauth.issueToken({
        grantType: body.grant_type,
        code: body.code,
        redirectUri: body.redirect_uri,
        clientId: body.client_id,
        codeVerifier: body.code_verifier,
        refreshToken: body.refresh_token,
      });

      return c.json(token);
    } catch (error: any) {
      return c.json({ error: error.code || 'invalid_request', error_description: error.message }, 400);
    }
  };
}

export function createOAuthLoginHandler(options: OAuthAdapterOptions) {
  return async function (c: Context) {
    try {
      const contentType = c.req.header('content-type') || '';
      let body: any;
      if (contentType.includes('application/json')) {
        body = await c.req.json();
      } else {
        body = await c.req.parseBody();
      }

      const username = body.username as string | undefined;
      const bodyReturnUrl = body.returnUrl as string | undefined;

      if (!username) {
        return c.json({ error: 'username is required' }, 400);
      }

      const cookieReturnUrl = getCookie(c, OAUTH_RETURN_COOKIE);
      const returnUrl = bodyReturnUrl || cookieReturnUrl;

      const session = await options.oauth.login(username);

      setCookie(c, SESSION_COOKIE, session.sessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        secure: getRequestBaseUrl(c).startsWith('https'),
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      if (returnUrl) {
        setCookie(c, OAUTH_RETURN_COOKIE, '', { maxAge: 0 }); // clear
        const absoluteRedirect = new URL(returnUrl, getRequestBaseUrl(c)).toString();
        return c.redirect(absoluteRedirect, 303);
      }

      return c.json({ success: true, userId: session.userId });
    } catch (error: any) {
      return c.json({ error: error.message || 'login_failed' }, 400);
    }
  };
}

export function createOAuthRegisterHandler(options: OAuthAdapterOptions) {
  return async function (c: Context) {
    try {
      const body = (await c.req.json()) as {
        redirect_uris?: string[];
        client_name?: string;
      };

      if (!body.redirect_uris?.length) {
        return c.json({ error: 'invalid_redirect_uri', error_description: 'redirect_uris is required' }, 400);
      }

      const registration = await options.oauth.registerClient({
        redirect_uris: body.redirect_uris,
        client_name: body.client_name,
      });

      return c.json(registration, 201);
    } catch (error: any) {
      return c.json({ error: error.code || 'invalid_client_metadata', error_description: error.message }, 400);
    }
  };
}

export interface McpOAuthOptions {
  oauthTokenUrl?: string;
  oauthAuthorizationUrl?: string;
}

export function buildProtectedResourceMetadata(c: Context, options: McpOAuthOptions = {}) {
  const baseUrl = getRequestBaseUrl(c);
  return {
    authorization_servers: [
      options.oauthTokenUrl
        ? new URL(options.oauthTokenUrl).origin
        : baseUrl,
    ],
  };
}

export function buildAuthorizationServerMetadata(c: Context, options: McpOAuthOptions = {}) {
  const baseUrl = getRequestBaseUrl(c);
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
  return async function (c: Context) {
    return c.json(buildProtectedResourceMetadata(c, options));
  };
}

export function createOAuthAuthorizationServerMetadataHandler(options: McpOAuthOptions = {}) {
  return async function (c: Context) {
    return c.json(buildAuthorizationServerMetadata(c, options));
  };
}
