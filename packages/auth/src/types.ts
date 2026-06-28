export interface AuthUser {
  id: string;
  username: string;
}

export interface AuthorizationCodeRecord {
  code: string;
  userId: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  codeChallenge: string;
  codeChallengeMethod: string;
  expiresAt: number;
}

export interface AccessTokenRecord {
  token: string;
  userId: string;
  scopes: string[];
  expiresAt: number;
}

export interface SessionRecord {
  sessionId: string;
  userId: string;
  expiresAt: number;
}

export interface RegisteredClientRecord {
  clientId: string;
  clientName?: string;
  redirectUris: string[];
  createdAt: number;
}

export type RegisteredClient = RegisteredClientRecord;

export interface AuthStore {
  upsertUser(username: string): Promise<AuthUser>;
  getUserById(userId: string): Promise<AuthUser | null>;
  saveAuthorizationCode(record: AuthorizationCodeRecord): Promise<void>;
  consumeAuthorizationCode(code: string): Promise<AuthorizationCodeRecord | null>;
  saveAccessToken(record: AccessTokenRecord): Promise<void>;
  getAccessToken(token: string): Promise<AccessTokenRecord | null>;
  saveSession(record: SessionRecord): Promise<void>;
  getSession(sessionId: string): Promise<SessionRecord | null>;
  deleteSession(sessionId: string): Promise<void>;
  saveRegisteredClient?(record: RegisteredClientRecord): Promise<void>;
  getRegisteredClient?(clientId: string): Promise<RegisteredClientRecord | null>;
}

export interface AuthorizeRequest {
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: string;
  state?: string;
  codeChallenge: string;
  codeChallengeMethod?: string;
}

export interface AuthorizeResult {
  redirectUrl: string;
}

export interface TokenRequest {
  grantType: string;
  code?: string;
  redirectUri?: string;
  clientId?: string;
  codeVerifier?: string;
  refreshToken?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

export interface ClientRegistrationRequest {
  redirect_uris: string[];
  client_name?: string;
}

export interface ClientRegistrationResponse {
  client_id: string;
  client_id_issued_at: number;
  redirect_uris: string[];
  client_name?: string;
  token_endpoint_auth_method: 'none';
}

export interface OAuthServerConfig {
  store: AuthStore;
  clientId: string;
  allowedRedirectUris: string[];
  allowedRedirectUriPatterns?: RegExp[];
  tokenTtlSeconds?: number;
  codeTtlSeconds?: number;
  sessionTtlSeconds?: number;
  refreshTokenTtlSeconds?: number;
}
