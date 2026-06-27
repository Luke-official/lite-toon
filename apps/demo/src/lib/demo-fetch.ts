const NGROK_HEADER = 'ngrok-skip-browser-warning';

/**
 * Fetch helper for demo API calls through ngrok (skips the free-tier browser interstitial).
 */
export function demoFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set(NGROK_HEADER, '1');

  return fetch(input, {
    ...init,
    credentials: init?.credentials ?? 'same-origin',
    headers,
  });
}
