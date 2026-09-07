import { NextRequest, NextResponse } from 'next/server';
import { taskDb, TaskStatus, TaskPriority } from '@/demo/db';
import { seedUserIfEmpty } from '@/demo/seed';
import { resolveSessionUserId } from '@/lib/session';

async function getUserId(req: NextRequest): Promise<string | null> {
  return resolveSessionUserId(req);
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  seedUserIfEmpty(userId);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as TaskStatus | null;
  const priority = searchParams.get('priority') as TaskPriority | null;
  const tag = searchParams.get('tag');

  const tasks = taskDb.list(userId, {
    status: status ?? undefined,
    priority: priority ?? undefined,
    tag: tag ?? undefined,
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  seedUserIfEmpty(userId);

  try {
    const body = await req.json();
    const { title, description, status, priority, tags, dueDate } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const task = taskDb.create(userId, {
      title,
      description,
      status: status ?? 'todo',
      priority: priority ?? 'medium',
      tags: tags ?? [],
      dueDate,
      lastModifiedBy: 'human',
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
