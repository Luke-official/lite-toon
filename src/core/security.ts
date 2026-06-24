import { SecurityContext } from './types';

/**
 * Interface for rate limiting storage.
 */
export interface RateLimiterStore {
  increment(key: string): Promise<number>;
  reset(key: string): Promise<void>;
}

/**
 * Default in-memory rate limiter store.
 */
export class InMemoryRateLimiterStore implements RateLimiterStore {
  private counts: Map<string, { count: number; expiresAt: number }> = new Map();
  private windowMs: number;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  async increment(key: string): Promise<number> {
    const now = Date.now();
    const record = this.counts.get(key);

    if (!record || record.expiresAt < now) {
      this.counts.set(key, { count: 1, expiresAt: now + this.windowMs });
      return 1;
    }

    record.count++;
    return record.count;
  }

  async reset(key: string): Promise<void> {
    this.counts.delete(key);
  }
}

/**
 * Framework-agnostic security gatekeeper.
 */
export class SecurityGatekeeper {
  private store: RateLimiterStore;
  private maxRequests: number;

  constructor(store?: RateLimiterStore, maxRequests: number = 100, windowMs: number = 60000) {
    this.store = store || new InMemoryRateLimiterStore(windowMs);
    this.maxRequests = maxRequests;
  }

  /**
   * Checks access using the provided context.
   * Throws an error if access is denied.
   * 
   * @param context The security context from the incoming request.
   */
  async checkAccess(context: SecurityContext): Promise<boolean> {
    // 1. Basic API Key validation
    // In a real application, this should check against a database or secure store.
    // For now, we use a dummy secret.
    if (context.apiKey && context.apiKey !== 'secret-dummy-token') {
      throw new Error("TOON_UNAUTHORIZED: Invalid API Key.");
    }

    // 2. Rate limiting check
    // We use the agentId (or IP fallback) as the rate limiting key.
    const key = context.agentId || context.ip || 'anonymous';
    const count = await this.store.increment(key);

    if (count > this.maxRequests) {
      throw new Error("TOON_RATE_LIMIT_EXCEEDED: Too many requests.");
    }

    return true;
  }
}
