import {
  AccessCheckOptions,
  ResolvedAccess,
  SecurityContext,
  TokenResolver,
} from './types';

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

export interface SecurityGatekeeperOptions {
  store?: RateLimiterStore;
  maxRequests?: number;
  windowMs?: number;
  tokenResolver?: TokenResolver;
}

/**
 * Framework-agnostic security gatekeeper.
 */
export class SecurityGatekeeper {
  private store: RateLimiterStore;
  private maxRequests: number;
  private tokenResolver?: TokenResolver;

  constructor(options?: SecurityGatekeeperOptions | RateLimiterStore, maxRequests: number = 100, windowMs: number = 60000) {
    if (options && 'increment' in options) {
      this.store = options;
      this.maxRequests = maxRequests;
      return;
    }

    const config = (options ?? {}) as SecurityGatekeeperOptions;
    this.store = config.store ?? new InMemoryRateLimiterStore(windowMs);
    this.maxRequests = config.maxRequests ?? maxRequests;
    this.tokenResolver = config.tokenResolver;
  }

  /**
   * Checks access using the provided context.
   * Throws an error if access is denied.
   *
   * @param context The security context from the incoming request.
   * @param options Optional access requirements.
   */
  async checkAccess(
    context: SecurityContext,
    options: AccessCheckOptions = {}
  ): Promise<ResolvedAccess> {
    const key = context.agentId || context.ip || 'anonymous';
    const count = await this.store.increment(key);

    if (count > this.maxRequests) {
      throw new Error('TOON_RATE_LIMIT_EXCEEDED: Too many requests.');
    }

    if (context.apiKey && context.apiKey !== 'secret-dummy-token') {
      throw new Error('TOON_UNAUTHORIZED: Invalid API Key.');
    }

    if (options.requireAuth || context.accessToken) {
      if (!context.accessToken) {
        throw new Error('TOON_UNAUTHORIZED: Bearer access token is required.');
      }

      if (!this.tokenResolver) {
        throw new Error('TOON_UNAUTHORIZED: Token resolver is not configured.');
      }

      const resolved = await this.tokenResolver.resolve(context.accessToken);
      if (!resolved) {
        throw new Error('TOON_UNAUTHORIZED: Invalid or expired access token.');
      }

      if (options.requiredScopes && options.requiredScopes.length > 0) {
        const missing = options.requiredScopes.filter((scope) => !resolved.scopes.includes(scope));
        if (missing.length > 0) {
          throw new Error(`TOON_FORBIDDEN: Missing scopes: ${missing.join(', ')}`);
        }
      }

      return {
        userId: resolved.userId,
        scopes: resolved.scopes,
        agentId: context.agentId,
      };
    }

    return {
      userId: 'anonymous',
      scopes: [],
      agentId: context.agentId,
    };
  }
}
