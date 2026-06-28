import { NextRequest, NextResponse } from 'next/server';
import { authStore } from '@/lib/auth';
import { resolveSessionUserId } from '@/lib/session';

export async function GET(req: NextRequest) {
  const userId = await resolveSessionUserId(req);
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
