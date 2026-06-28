import { TokenResolver, ResolvedToken } from '@lite-toon/core';
import {
  OAuthServerConfig,
  AuthorizeRequest,
  AuthorizeResult,
  TokenRequest,
  TokenResponse,
  ClientRegistrationRequest,
  ClientRegistrationResponse,
} from '../types';
import { ClientService } from './services/ClientService';
import { SessionService } from './services/SessionService';
import { TokenService } from './services/TokenService';
import { AuthorizationService } from './services/AuthorizationService';

/**
 * OAuth 2.0 authorization server with PKCE support.
 *
 * Acts as a thin facade over focused services — prefer injecting those
 * directly in contexts where only a subset of functionality is needed.
 */
export class OAuthServer implements TokenResolver {
  readonly clients: ClientService;
  readonly sessions: SessionService;
  readonly tokens: TokenService;
  readonly authorization: AuthorizationService;

  constructor(config: OAuthServerConfig) {
    this.clients = new ClientService({
      store: config.store,
      primaryClientId: config.clientId,
      allowedRedirectUris: config.allowedRedirectUris,
      allowedRedirectUriPatterns: config.allowedRedirectUriPatterns,
    });

    this.sessions = new SessionService({
      store: config.store,
      sessionTtlSeconds: config.sessionTtlSeconds ?? 86_400,
    });

    this.tokens = new TokenService({
      store: config.store,
      clientService: this.clients,
      tokenTtlSeconds: config.tokenTtlSeconds ?? 3_600,
      refreshTokenTtlSeconds: config.refreshTokenTtlSeconds ?? 86_400 * 30,
    });

    this.authorization = new AuthorizationService({
      store: config.store,
      clientService: this.clients,
      codeTtlSeconds: config.codeTtlSeconds ?? 300,
    });
  }

  login(username: string) {
    return this.sessions.login(username);
  }

  resolveSession(sessionId: string): Promise<string | null> {
    return this.sessions.resolve(sessionId);
  }

  logout(sessionId: string): Promise<void> {
    return this.sessions.logout(sessionId);
  }

  registerClient(request: ClientRegistrationRequest): Promise<ClientRegistrationResponse> {
    return this.clients.register(request);
  }

  authorize(userId: string, request: AuthorizeRequest): Promise<AuthorizeResult> {
    return this.authorization.authorize(userId, request);
  }

  issueToken(request: TokenRequest): Promise<TokenResponse> {
    return this.tokens.issue(request);
  }

  issueAccessTokenForUser(userId: string, scopes: string[]): Promise<TokenResponse> {
    return this.tokens.issueForUser(userId, scopes);
  }

  resolve(accessToken: string): Promise<ResolvedToken | null> {
    return this.tokens.resolve(accessToken);
  }
}
