import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@lite-toon/bridge/next';
import { oauthServer, authStore } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const userId = await oauthServer.resolveSession(sessionId);
  if (!userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await authStore.getUserById(userId);
  return NextResponse.json({
    authenticated: true,
    userId,
    username: user?.username ?? null,
  });
}
