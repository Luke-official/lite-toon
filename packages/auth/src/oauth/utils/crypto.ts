export function randomToken(): string {
  return `lt_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
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
