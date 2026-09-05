import type { Redis } from 'ioredis';
import {
  AccessTokenRecord,
  AuthStore,
  AuthUser,
  AuthorizationCodeRecord,
  RegisteredClientRecord,
  SessionRecord,
} from './types';

/**
 * Production-ready Redis-backed auth store.
 *
 * All keys are namespaced under the `lt:` prefix.
 * TTLs are enforced by Redis — no manual expiry polling required.
 *
 * Requires `ioredis` as a peer dependency:
 *   npm install ioredis
 *
 * Usage:
 *   import { RedisAuthStore } from '@lite-toon/auth/redis';
 *   import Redis from 'ioredis';
 *
 *   const store = new RedisAuthStore(new Redis(process.env.REDIS_URL));
 *   const oauth = new OAuthServer({ store, clientId: '...', ... });
 */
export class RedisAuthStore implements AuthStore {
  private readonly redis: Redis;
  private readonly prefix: string;

  constructor(redis: Redis, prefix = 'lt') {
    this.redis = redis;
    this.prefix = prefix;
  }

  private key(...parts: string[]): string {
    return [this.prefix, ...parts].join(':');
  }

  // ─── Users ───────────────────────────────────────────────────────────────

  async upsertUser(username: string): Promise<AuthUser> {
    const normalized = username.trim().toLowerCase();
    const usernameKey = this.key('user', 'name', normalized);

    const existing = await this.redis.get(usernameKey);
    if (existing) {
      return JSON.parse(existing) as AuthUser;
    }

    const { randomBytes } = await import('crypto');
    const user: AuthUser = {
      id: `user_${randomBytes(16).toString('hex')}`,
      username: normalized,
    };

    await Promise.all([
      this.redis.set(usernameKey, JSON.stringify(user)),
      this.redis.set(this.key('user', 'id', user.id), JSON.stringify(user)),
    ]);

    return user;
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    const raw = await this.redis.get(this.key('user', 'id', userId));
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }

  // ─── Authorization Codes ─────────────────────────────────────────────────

  async saveAuthorizationCode(record: AuthorizationCodeRecord): Promise<void> {
    const ttlMs = record.expiresAt - Date.now();
    if (ttlMs <= 0) return;
    await this.redis.set(
      this.key('code', record.code),
      JSON.stringify(record),
      'PX',
      ttlMs,
    );
  }

  async consumeAuthorizationCode(code: string): Promise<AuthorizationCodeRecord | null> {
    const codeKey = this.key('code', code);
    // Atomic get-and-delete to prevent replay attacks
    const results = await this.redis.multi().get(codeKey).del(codeKey).exec();
    const raw = results?.[0]?.[1] as string | null;
    if (!raw) return null;
    const record = JSON.parse(raw) as AuthorizationCodeRecord;
    if (record.expiresAt < Date.now()) return null;
    return record;
  }

  // ─── Access Tokens ────────────────────────────────────────────────────────

  async saveAccessToken(record: AccessTokenRecord): Promise<void> {
    const ttlMs = record.expiresAt - Date.now();
    if (ttlMs <= 0) return;
    await this.redis.set(
      this.key('token', record.token),
      JSON.stringify(record),
      'PX',
      ttlMs,
    );
  }

  async getAccessToken(token: string): Promise<AccessTokenRecord | null> {
    const raw = await this.redis.get(this.key('token', token));
    if (!raw) return null;
    const record = JSON.parse(raw) as AccessTokenRecord;
    if (record.expiresAt < Date.now()) return null;
    return record;
  }

  // ─── Sessions ─────────────────────────────────────────────────────────────

  async saveSession(record: SessionRecord): Promise<void> {
    const ttlMs = record.expiresAt - Date.now();
    if (ttlMs <= 0) return;
    await this.redis.set(
      this.key('session', record.sessionId),
      JSON.stringify(record),
      'PX',
      ttlMs,
    );
  }

  async getSession(sessionId: string): Promise<SessionRecord | null> {
    const raw = await this.redis.get(this.key('session', sessionId));
    if (!raw) return null;
    const record = JSON.parse(raw) as SessionRecord;
    if (record.expiresAt < Date.now()) return null;
    return record;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.redis.del(this.key('session', sessionId));
  }

  // ─── Registered Clients ───────────────────────────────────────────────────

  async saveRegisteredClient(record: RegisteredClientRecord): Promise<void> {
    await this.redis.set(this.key('client', record.clientId), JSON.stringify(record));
  }

  async getRegisteredClient(clientId: string): Promise<RegisteredClientRecord | null> {
    const raw = await this.redis.get(this.key('client', clientId));
    return raw ? (JSON.parse(raw) as RegisteredClientRecord) : null;
  }
}
