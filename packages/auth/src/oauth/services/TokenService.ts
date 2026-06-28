import { TokenResolver, ResolvedToken } from '@lite-toon/core';
import { AuthStore, TokenRequest, TokenResponse } from '../../types';
import { OAuthError, OAuthErrorCode } from '../errors/OAuthError';
import { randomToken, sha256Base64Url, expiresAt } from '../utils/crypto';
import { ClientService } from './ClientService';

export interface TokenServiceConfig {
  store: AuthStore;
  clientService: ClientService;
  tokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
}

/**
 * Issues, validates, and resolves OAuth access/refresh tokens.
 */
export class TokenService implements TokenResolver {
  private readonly store: AuthStore;
  private readonly clientService: ClientService;
  private readonly tokenTtlSeconds: number;
  private readonly refreshTokenTtlSeconds: number;

  constructor(config: TokenServiceConfig) {
    this.store = config.store;
    this.clientService = config.clientService;
    this.tokenTtlSeconds = config.tokenTtlSeconds;
    this.refreshTokenTtlSeconds = config.refreshTokenTtlSeconds;
  }

  async issue(request: TokenRequest): Promise<TokenResponse> {
    if (request.grantType === 'refresh_token') {
      return this.handleRefreshToken(request);
    }
    if (request.grantType !== 'authorization_code') {
      throw new OAuthError(OAuthErrorCode.UNSUPPORTED_GRANT_TYPE);
    }
    return this.handleAuthorizationCode(request);
  }

  /** Issues tokens directly for a user — for demo / testing. */
  async issueForUser(userId: string, scopes: string[]): Promise<TokenResponse> {
    return this.mintTokenPair(userId, scopes);
  }

  async resolve(accessToken: string): Promise<ResolvedToken | null> {
    const record = await this.store.getAccessToken(accessToken);
    if (!record) return null;
    return { userId: record.userId, scopes: record.scopes };
  }

  private async handleAuthorizationCode(request: TokenRequest): Promise<TokenResponse> {
    if (!request.code || !request.redirectUri || !request.clientId || !request.codeVerifier) {
      throw new OAuthError(OAuthErrorCode.INVALID_REQUEST);
    }

    await this.clientService.assertValidClient(request.clientId);

    const record = await this.store.consumeAuthorizationCode(request.code);
    if (
      !record ||
      record.redirectUri !== request.redirectUri ||
      record.clientId !== request.clientId
    ) {
      throw new OAuthError(OAuthErrorCode.INVALID_GRANT);
    }

    const challenge = await sha256Base64Url(request.codeVerifier);
    if (record.codeChallengeMethod !== 'S256' || challenge !== record.codeChallenge) {
      throw new OAuthError(OAuthErrorCode.INVALID_GRANT);
    }

    return this.mintTokenPair(record.userId, record.scopes);
  }

  private async handleRefreshToken(request: TokenRequest): Promise<TokenResponse> {
    if (!request.refreshToken || !request.clientId) {
      throw new OAuthError(OAuthErrorCode.INVALID_REQUEST);
    }
    await this.clientService.assertValidClient(request.clientId);

    const record = await this.store.getAccessToken(request.refreshToken);
    if (!record) throw new OAuthError(OAuthErrorCode.INVALID_GRANT);

    return this.mintTokenPair(record.userId, record.scopes);
  }

  private async mintTokenPair(userId: string, scopes: string[]): Promise<TokenResponse> {
    const accessToken = randomToken();
    const refreshToken = randomToken();

    await Promise.all([
      this.store.saveAccessToken({
        token: accessToken,
        userId,
        scopes,
        expiresAt: expiresAt(this.tokenTtlSeconds),
      }),
      this.store.saveAccessToken({
        token: refreshToken,
        userId,
        scopes,
        expiresAt: expiresAt(this.refreshTokenTtlSeconds),
      }),
    ]);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.tokenTtlSeconds,
      scope: scopes.join(' '),
      refresh_token: refreshToken,
    };
  }
}
