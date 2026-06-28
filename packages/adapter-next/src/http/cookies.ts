import { NextRequest } from 'next/server';

export function sessionCookieOptions(req: NextRequest) {
  const isSecure = req.headers.get('x-forwarded-proto') === 'https';
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 86400,
    secure: isSecure,
  };
}
