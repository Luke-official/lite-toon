export const SecurityErrorCode = {
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
} as const;

export type SecurityErrorCode = (typeof SecurityErrorCode)[keyof typeof SecurityErrorCode];

export class SecurityError extends Error {
  constructor(
    public readonly code: SecurityErrorCode,
    message: string,
    public readonly details?: { missingScopes?: string[] }
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}
