import { randomBytes, createHmac } from 'crypto';

export function randomToken(): string {
  return `lt_${randomBytes(32).toString('hex')}`;
}

/**
 * Produces a signed opaque token: lt_<base64url(payload)>.<base64url(hmac)>
 * The payload is a JSON object encoded as base64url. The HMAC is computed
 * over the payload using HMAC-SHA256 with the provided secret.
 *
 * No external JWT library required — verification is local and O(1).
 */
export function signedToken(payload: object, secret: string): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `lt_${payloadB64}.${sig}`;
}

/**
 * Verifies a signed token produced by signedToken().
 * Returns the decoded payload object on success, or null on failure
 * (invalid format, tampered signature, or wrong secret).
 */
export function verifySignedToken(token: string, secret: string): Record<string, unknown> | null {
  try {
    const body = token.startsWith('lt_') ? token.slice(3) : token;
    const dotIdx = body.lastIndexOf('.');
    if (dotIdx === -1) return null;

    const payloadB64 = body.slice(0, dotIdx);
    const providedSig = body.slice(dotIdx + 1);
    const expectedSig = createHmac('sha256', secret).update(payloadB64).digest('base64url');

    // Constant-time comparison to prevent timing attacks
    if (providedSig.length !== expectedSig.length) return null;
    let diff = 0;
    for (let i = 0; i < expectedSig.length; i++) {
      diff |= providedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (diff !== 0) return null;

    return JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function parseScopes(scope: string): string[] {
  return scope
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function expiresAt(ttlSeconds: number): number {
  return Date.now() + ttlSeconds * 1000;
}

