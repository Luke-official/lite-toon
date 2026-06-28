import {
  AuthStore,
  ClientRegistrationRequest,
  ClientRegistrationResponse,
  RegisteredClient,
} from '../../types';
import { OAuthError, OAuthErrorCode } from '../errors/OAuthError';
import { randomToken } from '../utils/crypto';

const DEFAULT_REDIRECT_PATTERNS: RegExp[] = [
  /^https:\/\/[a-z0-9-]+\.ngrok-free\.app(\/.*)?$/i,
  /^https:\/\/[a-z0-9-]+\.ngrok\.io(\/.*)?$/i,
  /^https:\/\/[a-z0-9-]+\.ngrok\.app(\/.*)?$/i,
];

export interface ClientServiceConfig {
  store: AuthStore;
  primaryClientId: string;
  allowedRedirectUris: string[];
  allowedRedirectUriPatterns?: RegExp[];
}

/**
 * Handles OAuth client validation and dynamic client registration (RFC 7591).
 */
export class ClientService {
  private readonly store: AuthStore;
  private readonly primaryClientId: string;
  private readonly allowedRedirectUris: string[];
  private readonly allowedRedirectUriPatterns: RegExp[];

  constructor(config: ClientServiceConfig) {
    this.store = config.store;
    this.primaryClientId = config.primaryClientId;
    this.allowedRedirectUris = config.allowedRedirectUris;
    this.allowedRedirectUriPatterns = config.allowedRedirectUriPatterns ?? DEFAULT_REDIRECT_PATTERNS;
  }

  isAllowedRedirectUri(redirectUri: string): boolean {
    return (
      this.allowedRedirectUris.includes(redirectUri) ||
      this.allowedRedirectUriPatterns.some((p) => p.test(redirectUri))
    );
  }

  /**
   * Resolves a client and caches the result to avoid redundant store lookups
   * within the same request (e.g. isValid + getRegisteredClient in authorize).
   */
  async resolveClient(clientId: string): Promise<RegisteredClient | 'primary' | null> {
    if (clientId === this.primaryClientId) return 'primary';
    if (!this.store.getRegisteredClient) return null;
    return this.store.getRegisteredClient(clientId);
  }

  async assertValidClient(clientId: string): Promise<RegisteredClient | 'primary'> {
    const client = await this.resolveClient(clientId);
    if (!client) throw new OAuthError(OAuthErrorCode.INVALID_CLIENT);
    return client;
  }

  async assertValidRedirectForClient(
    _clientId: string,
    redirectUri: string,
    client: RegisteredClient | 'primary',
  ): Promise<void> {
    if (!this.isAllowedRedirectUri(redirectUri)) {
      throw new OAuthError(OAuthErrorCode.INVALID_REDIRECT_URI);
    }
    if (client !== 'primary') {
      if (!client.redirectUris.includes(redirectUri)) {
        throw new OAuthError(OAuthErrorCode.INVALID_REDIRECT_URI);
      }
    }
  }

  async register(request: ClientRegistrationRequest): Promise<ClientRegistrationResponse> {
    if (!request.redirect_uris?.length) {
      throw new OAuthError(OAuthErrorCode.INVALID_REDIRECT_URI);
    }
    for (const uri of request.redirect_uris) {
      if (!this.isAllowedRedirectUri(uri)) {
        throw new OAuthError(OAuthErrorCode.INVALID_REDIRECT_URI);
      }
    }
    if (!this.store.saveRegisteredClient) {
      throw new OAuthError(OAuthErrorCode.REGISTRATION_NOT_SUPPORTED);
    }

    const clientId = randomToken();
    const createdAt = Math.floor(Date.now() / 1000);
    await this.store.saveRegisteredClient({
      clientId,
      clientName: request.client_name,
      redirectUris: request.redirect_uris,
      createdAt,
    });

    return {
      client_id: clientId,
      client_id_issued_at: createdAt,
      redirect_uris: request.redirect_uris,
      client_name: request.client_name,
      token_endpoint_auth_method: 'none',
    };
  }
}
