import { NextResponse } from 'next/server';
import { hitlStore } from '@/agent';

export async function GET() {
  const pending = await hitlStore.listPending();
  return NextResponse.json(pending);
}
