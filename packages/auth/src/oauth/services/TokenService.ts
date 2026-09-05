import { TokenResolver, ResolvedToken } from '@lite-toon/core';
import { AuthStore, TokenRequest, TokenResponse } from '../../types';
import { OAuthError, OAuthErrorCode } from '../errors/OAuthError';
import { randomToken, signedToken, verifySignedToken, sha256Base64Url, expiresAt } from '../utils/crypto';
import { ClientService } from './ClientService';

export interface TokenServiceConfig {
  store: AuthStore;
  clientService: ClientService;
  tokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  /** When set, access tokens are HMAC-signed for local verification. */
  tokenSecret?: string;
}

/**
 * Issues, validates, and resolves OAuth access/refresh tokens.
 */
export class TokenService implements TokenResolver {
  private readonly store: AuthStore;
  private readonly clientService: ClientService;
  private readonly tokenTtlSeconds: number;
  private readonly refreshTokenTtlSeconds: number;
  private readonly tokenSecret?: string;

  constructor(config: TokenServiceConfig) {
    this.store = config.store;
    this.clientService = config.clientService;
    this.tokenTtlSeconds = config.tokenTtlSeconds;
    this.refreshTokenTtlSeconds = config.refreshTokenTtlSeconds;
    this.tokenSecret = config.tokenSecret;
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
    // Fast-path: if the token is signed, verify locally without a store round-trip
    if (this.tokenSecret && accessToken.startsWith('lt_') && accessToken.includes('.')) {
      const payload = verifySignedToken(accessToken, this.tokenSecret);
      if (!payload) return null;

      // Still check the store for revocation (token may have been explicitly invalidated)
      const record = await this.store.getAccessToken(accessToken);
      if (!record) return null;
      return { userId: record.userId, scopes: record.scopes };
    }

    // Fallback: opaque token — full store lookup
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
    // Access token: signed (self-verifiable) when tokenSecret is set, opaque otherwise
    const accessToken = this.tokenSecret
      ? signedToken(
          { sub: userId, scopes, iat: Math.floor(Date.now() / 1000) },
          this.tokenSecret,
        )
      : randomToken();

    // Refresh token: always opaque random — revocation is its primary purpose
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
