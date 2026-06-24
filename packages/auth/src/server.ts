import { TokenResolver, ResolvedToken } from '@lite-toon/core';
import { AuthStore, OAuthServerConfig, AuthorizeRequest, AuthorizeResult, TokenRequest, TokenResponse } from './types';

function randomToken(): string {
  return `lt_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function parseScopes(scope: string): string[] {
  return scope
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * OAuth 2.0 authorization server with PKCE support.
 */
export class OAuthServer implements TokenResolver {
  private store: AuthStore;
  private clientId: string;
  private allowedRedirectUris: string[];
  private tokenTtlSeconds: number;
  private codeTtlSeconds: number;
  private sessionTtlSeconds: number;

  constructor(config: OAuthServerConfig) {
    this.store = config.store;
    this.clientId = config.clientId;
    this.allowedRedirectUris = config.allowedRedirectUris;
    this.tokenTtlSeconds = config.tokenTtlSeconds ?? 3600;
    this.codeTtlSeconds = config.codeTtlSeconds ?? 300;
    this.sessionTtlSeconds = config.sessionTtlSeconds ?? 86400;
  }

  /**
   * Creates or reuses a user and establishes a login session.
   */
  async login(username: string): Promise<{ sessionId: string; userId: string }> {
    const user = await this.store.upsertUser(username);
    const sessionId = randomToken();
    await this.store.saveSession({
      sessionId,
      userId: user.id,
      expiresAt: Date.now() + this.sessionTtlSeconds * 1000,
    });
    return { sessionId, userId: user.id };
  }

  /**
   * Resolves a session cookie value to a user id.
   */
  async resolveSession(sessionId: string): Promise<string | null> {
    const session = await this.store.getSession(sessionId);
    return session?.userId ?? null;
  }

  /**
   * Ends a login session.
   */
  async logout(sessionId: string): Promise<void> {
    await this.store.deleteSession(sessionId);
  }

  /**
   * Issues an authorization code for an authenticated user.
   */
  async authorize(userId: string, request: AuthorizeRequest): Promise<AuthorizeResult> {
    this.validateAuthorizeRequest(request);

    const code = randomToken();
    await this.store.saveAuthorizationCode({
      code,
      userId,
      clientId: request.clientId,
      redirectUri: request.redirectUri,
      scopes: parseScopes(request.scope),
      codeChallenge: request.codeChallenge,
      codeChallengeMethod: request.codeChallengeMethod ?? 'S256',
      expiresAt: Date.now() + this.codeTtlSeconds * 1000,
    });

    const url = new URL(request.redirectUri);
    url.searchParams.set('code', code);
    if (request.state) {
      url.searchParams.set('state', request.state);
    }

    return { redirectUrl: url.toString() };
  }

  /**
   * Exchanges an authorization code for an access token (PKCE).
   */
  async issueToken(request: TokenRequest): Promise<TokenResponse> {
    if (request.grantType !== 'authorization_code') {
      throw new Error('unsupported_grant_type');
    }

    if (!request.code || !request.redirectUri || !request.clientId || !request.codeVerifier) {
      throw new Error('invalid_request');
    }

    if (request.clientId !== this.clientId) {
      throw new Error('invalid_client');
    }

    const record = await this.store.consumeAuthorizationCode(request.code);
    if (!record) {
      throw new Error('invalid_grant');
    }

    if (record.redirectUri !== request.redirectUri) {
      throw new Error('invalid_grant');
    }

    if (record.clientId !== request.clientId) {
      throw new Error('invalid_client');
    }

    const challenge = await sha256Base64Url(request.codeVerifier);
    if (record.codeChallengeMethod !== 'S256' || challenge !== record.codeChallenge) {
      throw new Error('invalid_grant');
    }

    const accessToken = randomToken();
    await this.store.saveAccessToken({
      token: accessToken,
      userId: record.userId,
      scopes: record.scopes,
      expiresAt: Date.now() + this.tokenTtlSeconds * 1000,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.tokenTtlSeconds,
      scope: record.scopes.join(' '),
    };
  }

  /**
   * Issues a bearer access token directly for a user (demo and testing use).
   */
  async issueAccessTokenForUser(userId: string, scopes: string[]): Promise<TokenResponse> {
    const accessToken = randomToken();
    await this.store.saveAccessToken({
      token: accessToken,
      userId,
      scopes,
      expiresAt: Date.now() + this.tokenTtlSeconds * 1000,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.tokenTtlSeconds,
      scope: scopes.join(' '),
    };
  }

  /**
   * Resolves a bearer token into user identity and scopes.
   */
  async resolve(accessToken: string): Promise<ResolvedToken | null> {
    const record = await this.store.getAccessToken(accessToken);
    if (!record) return null;
    return {
      userId: record.userId,
      scopes: record.scopes,
    };
  }

  private validateAuthorizeRequest(request: AuthorizeRequest): void {
    if (request.responseType !== 'code') {
      throw new Error('unsupported_response_type');
    }

    if (request.clientId !== this.clientId) {
      throw new Error('invalid_client');
    }

    if (!this.allowedRedirectUris.includes(request.redirectUri)) {
      throw new Error('invalid_redirect_uri');
    }

    if (!request.codeChallenge) {
      throw new Error('invalid_request');
    }
  }
}
