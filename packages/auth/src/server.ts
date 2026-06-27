import { TokenResolver, ResolvedToken } from '@lite-toon/core';
import {
  AuthStore,
  OAuthServerConfig,
  AuthorizeRequest,
  AuthorizeResult,
  TokenRequest,
  TokenResponse,
  ClientRegistrationRequest,
  ClientRegistrationResponse,
} from './types';

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

const DEFAULT_REDIRECT_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.ngrok-free\.app(\/.*)?$/i,
  /^https:\/\/[a-z0-9-]+\.ngrok\.io(\/.*)?$/i,
  /^https:\/\/[a-z0-9-]+\.ngrok\.app(\/.*)?$/i,
];

/**
 * OAuth 2.0 authorization server with PKCE support.
 */
export class OAuthServer implements TokenResolver {
  private store: AuthStore;
  private clientId: string;
  private allowedRedirectUris: string[];
  private allowedRedirectUriPatterns: RegExp[];
  private tokenTtlSeconds: number;
  private codeTtlSeconds: number;
  private sessionTtlSeconds: number;
  private refreshTokenTtlSeconds: number;

  constructor(config: OAuthServerConfig) {
    this.store = config.store;
    this.clientId = config.clientId;
    this.allowedRedirectUris = config.allowedRedirectUris;
    this.allowedRedirectUriPatterns = config.allowedRedirectUriPatterns ?? DEFAULT_REDIRECT_PATTERNS;
    this.tokenTtlSeconds = config.tokenTtlSeconds ?? 3600;
    this.codeTtlSeconds = config.codeTtlSeconds ?? 300;
    this.sessionTtlSeconds = config.sessionTtlSeconds ?? 86400;
    this.refreshTokenTtlSeconds = config.refreshTokenTtlSeconds ?? 86400 * 30;
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
   * Registers a new OAuth client (RFC 7591 dynamic client registration).
   */
  async registerClient(request: ClientRegistrationRequest): Promise<ClientRegistrationResponse> {
    if (!request.redirect_uris?.length) {
      throw new Error('invalid_redirect_uri');
    }

    for (const uri of request.redirect_uris) {
      if (!this.isAllowedRedirectUri(uri)) {
        throw new Error('invalid_redirect_uri');
      }
    }

    const clientId = randomToken();
    const record = {
      clientId,
      clientName: request.client_name,
      redirectUris: request.redirect_uris,
      createdAt: Math.floor(Date.now() / 1000),
    };

    if (!this.store.saveRegisteredClient) {
      throw new Error('registration_not_supported');
    }

    await this.store.saveRegisteredClient(record);

    return {
      client_id: clientId,
      client_id_issued_at: record.createdAt,
      redirect_uris: request.redirect_uris,
      client_name: request.client_name,
      token_endpoint_auth_method: 'none',
    };
  }

  /**
   * Issues an authorization code for an authenticated user.
   */
  async authorize(userId: string, request: AuthorizeRequest): Promise<AuthorizeResult> {
    await this.validateAuthorizeRequest(request);

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
    if (request.grantType === 'refresh_token') {
      return this.refreshAccessToken(request);
    }

    if (request.grantType !== 'authorization_code') {
      throw new Error('unsupported_grant_type');
    }

    if (!request.code || !request.redirectUri || !request.clientId || !request.codeVerifier) {
      throw new Error('invalid_request');
    }

    if (!(await this.isValidClient(request.clientId))) {
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

    return this.issueTokensForUser(record.userId, record.scopes);
  }

  /**
   * Issues a bearer access token directly for a user (demo and testing use).
   */
  async issueAccessTokenForUser(userId: string, scopes: string[]): Promise<TokenResponse> {
    return this.issueTokensForUser(userId, scopes);
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

  private async issueTokensForUser(userId: string, scopes: string[]): Promise<TokenResponse> {
    const accessToken = randomToken();
    const refreshToken = randomToken();

    await this.store.saveAccessToken({
      token: accessToken,
      userId,
      scopes,
      expiresAt: Date.now() + this.tokenTtlSeconds * 1000,
    });

    await this.store.saveAccessToken({
      token: refreshToken,
      userId,
      scopes,
      expiresAt: Date.now() + this.refreshTokenTtlSeconds * 1000,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.tokenTtlSeconds,
      scope: scopes.join(' '),
      refresh_token: refreshToken,
    };
  }

  private async refreshAccessToken(request: TokenRequest): Promise<TokenResponse> {
    if (!request.refreshToken || !request.clientId) {
      throw new Error('invalid_request');
    }

    if (!(await this.isValidClient(request.clientId))) {
      throw new Error('invalid_client');
    }

    const record = await this.store.getAccessToken(request.refreshToken);
    if (!record) {
      throw new Error('invalid_grant');
    }

    return this.issueTokensForUser(record.userId, record.scopes);
  }

  private async isValidClient(clientId: string): Promise<boolean> {
    if (clientId === this.clientId) return true;
    if (!this.store.getRegisteredClient) return false;
    const registered = await this.store.getRegisteredClient(clientId);
    return registered !== null;
  }

  private isAllowedRedirectUri(redirectUri: string): boolean {
    if (this.allowedRedirectUris.includes(redirectUri)) {
      return true;
    }

    return this.allowedRedirectUriPatterns.some((pattern) => pattern.test(redirectUri));
  }

  private async validateAuthorizeRequest(request: AuthorizeRequest): Promise<void> {
    if (request.responseType !== 'code') {
      throw new Error('unsupported_response_type');
    }

    if (!(await this.isValidClient(request.clientId))) {
      throw new Error('invalid_client');
    }

    if (!this.isAllowedRedirectUri(request.redirectUri)) {
      throw new Error('invalid_redirect_uri');
    }

    if (request.clientId !== this.clientId && this.store.getRegisteredClient) {
      const registered = await this.store.getRegisteredClient(request.clientId);
      if (!registered?.redirectUris.includes(request.redirectUri)) {
        throw new Error('invalid_redirect_uri');
      }
    }

    if (!request.codeChallenge) {
      throw new Error('invalid_request');
    }
  }
}
