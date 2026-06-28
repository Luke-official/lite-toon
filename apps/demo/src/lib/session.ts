import { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@lite-toon/bridge/next';
import { oauthServer } from '@/lib/auth';

export async function resolveSessionUserId(req: NextRequest): Promise<string | null> {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return oauthServer.resolveSession(sessionId);
}
