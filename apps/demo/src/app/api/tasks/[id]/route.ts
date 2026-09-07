import { NextRequest, NextResponse } from 'next/server';
import { taskDb, TaskStatus, TaskPriority } from '@/demo/db';
import { resolveSessionUserId } from '@/lib/session';

async function getUserId(req: NextRequest): Promise<string | null> {
  return resolveSessionUserId(req);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const task = taskDb.get(userId, id);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  return NextResponse.json({ task });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { title, description, tags, dueDate, status, priority } = body;

    let task = taskDb.get(userId, id);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    if (status !== undefined) {
      task = taskDb.updateStatus(userId, id, status as TaskStatus, 'human') ?? task;
    }
    if (priority !== undefined) {
      task = taskDb.updatePriority(userId, id, priority as TaskPriority, 'human') ?? task;
    }
    if (title !== undefined || description !== undefined || tags !== undefined || dueDate !== undefined) {
      task = taskDb.update(userId, id, { title, description, tags, dueDate, lastModifiedBy: 'human' }) ?? task;
    }

    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const deleted = taskDb.delete(userId, id);
  if (!deleted) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
