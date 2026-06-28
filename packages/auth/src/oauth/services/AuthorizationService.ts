import { AuthStore, AuthorizeRequest, AuthorizeResult } from '../../types';
import { OAuthError, OAuthErrorCode } from '../errors/OAuthError';
import { randomToken, parseScopes, expiresAt } from '../utils/crypto';
import { ClientService } from './ClientService';

export interface AuthorizationServiceConfig {
  store: AuthStore;
  clientService: ClientService;
  codeTtlSeconds: number;
}

/**
 * Handles the OAuth authorization code flow (RFC 6749 §4.1 + PKCE).
 */
export class AuthorizationService {
  private readonly store: AuthStore;
  private readonly clientService: ClientService;
  private readonly codeTtlSeconds: number;

  constructor(config: AuthorizationServiceConfig) {
    this.store = config.store;
    this.clientService = config.clientService;
    this.codeTtlSeconds = config.codeTtlSeconds;
  }

  async authorize(userId: string, request: AuthorizeRequest): Promise<AuthorizeResult> {
    if (request.responseType !== 'code') {
      throw new OAuthError(OAuthErrorCode.UNSUPPORTED_RESPONSE_TYPE);
    }
    if (!request.codeChallenge) {
      throw new OAuthError(OAuthErrorCode.INVALID_REQUEST);
    }

    const client = await this.clientService.assertValidClient(request.clientId);
    await this.clientService.assertValidRedirectForClient(
      request.clientId,
      request.redirectUri,
      client,
    );

    const code = randomToken();
    await this.store.saveAuthorizationCode({
      code,
      userId,
      clientId: request.clientId,
      redirectUri: request.redirectUri,
      scopes: parseScopes(request.scope),
      codeChallenge: request.codeChallenge,
      codeChallengeMethod: request.codeChallengeMethod ?? 'S256',
      expiresAt: expiresAt(this.codeTtlSeconds),
    });

    const url = new URL(request.redirectUri);
    url.searchParams.set('code', code);
    if (request.state) url.searchParams.set('state', request.state);

    return { redirectUrl: url.toString() };
  }
}
