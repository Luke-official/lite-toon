import {
  AccessTokenRecord,
  AuthStore,
  AuthUser,
  AuthorizationCodeRecord,
  RegisteredClientRecord,
  SessionRecord,
} from './types';

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/**
 * In-memory auth store for demo and development use.
 */
export class InMemoryAuthStore implements AuthStore {
  private usersById = new Map<string, AuthUser>();
  private usersByUsername = new Map<string, AuthUser>();
  private codes = new Map<string, AuthorizationCodeRecord>();
  private tokens = new Map<string, AccessTokenRecord>();
  private sessions = new Map<string, SessionRecord>();
  private clients = new Map<string, RegisteredClientRecord>();

  async upsertUser(username: string): Promise<AuthUser> {
    const normalized = username.trim().toLowerCase();
    const existing = this.usersByUsername.get(normalized);
    if (existing) return existing;

    const user: AuthUser = {
      id: randomId('user'),
      username: normalized,
    };
    this.usersById.set(user.id, user);
    this.usersByUsername.set(normalized, user);
    return user;
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    return this.usersById.get(userId) ?? null;
  }

  async saveAuthorizationCode(record: AuthorizationCodeRecord): Promise<void> {
    this.codes.set(record.code, record);
  }

  async consumeAuthorizationCode(code: string): Promise<AuthorizationCodeRecord | null> {
    const record = this.codes.get(code);
    if (!record) return null;
    this.codes.delete(code);
    if (record.expiresAt < Date.now()) return null;
    return record;
  }

  async saveAccessToken(record: AccessTokenRecord): Promise<void> {
    this.tokens.set(record.token, record);
  }

  async getAccessToken(token: string): Promise<AccessTokenRecord | null> {
    const record = this.tokens.get(token);
    if (!record) return null;
    if (record.expiresAt < Date.now()) {
      this.tokens.delete(token);
      return null;
    }
    return record;
  }

  async saveSession(record: SessionRecord): Promise<void> {
    this.sessions.set(record.sessionId, record);
  }

  async getSession(sessionId: string): Promise<SessionRecord | null> {
    const record = this.sessions.get(sessionId);
    if (!record) return null;
    if (record.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }
    return record;
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async saveRegisteredClient(record: RegisteredClientRecord): Promise<void> {
    this.clients.set(record.clientId, record);
  }

  async getRegisteredClient(clientId: string): Promise<RegisteredClientRecord | null> {
    return this.clients.get(clientId) ?? null;
  }
}
