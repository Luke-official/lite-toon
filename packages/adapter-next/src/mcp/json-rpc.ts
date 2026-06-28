import { NextResponse } from 'next/server';
import type { McpRpcOutcome } from './core';

export function jsonRpcResponse(outcome: McpRpcOutcome) {
  if (outcome.kind === 'no-content') {
    return new NextResponse(null, { status: 204 });
  }

  if (outcome.kind === 'error') {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: outcome.id ?? null,
      error: { code: outcome.code, message: outcome.message, data: outcome.data },
    });
  }

  return NextResponse.json({
    jsonrpc: '2.0',
    id: outcome.id ?? null,
    result: outcome.result,
  });
}
