import { AuthStore } from '../../types';
import { randomToken, expiresAt } from '../utils/crypto';

export interface SessionServiceConfig {
  store: AuthStore;
  sessionTtlSeconds: number;
}

/**
 * Manages user login sessions (create, resolve, destroy).
 */
export class SessionService {
  private readonly store: AuthStore;
  private readonly sessionTtlSeconds: number;

  constructor(config: SessionServiceConfig) {
    this.store = config.store;
    this.sessionTtlSeconds = config.sessionTtlSeconds;
  }

  async login(username: string): Promise<{ sessionId: string; userId: string }> {
    const user = await this.store.upsertUser(username);
    const sessionId = randomToken();
    await this.store.saveSession({
      sessionId,
      userId: user.id,
      expiresAt: expiresAt(this.sessionTtlSeconds),
    });
    return { sessionId, userId: user.id };
  }

  async resolve(sessionId: string): Promise<string | null> {
    const session = await this.store.getSession(sessionId);
    return session?.userId ?? null;
  }

  async logout(sessionId: string): Promise<void> {
    await this.store.deleteSession(sessionId);
  }
}
