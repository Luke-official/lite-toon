import { NextResponse } from 'next/server';
import { SecurityError, SecurityErrorCode } from '@lite-toon/core';
import { OAuthError } from '@lite-toon/auth';

export function oauthError(error: string, description?: string, status: number = 400) {
  return NextResponse.json(
    {
      error,
      error_description: description ?? error,
    },
    { status }
  );
}

export function jsonError(message: string, status: number = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function oauthErrorCode(error: unknown, fallback: string): string {
  if (error instanceof OAuthError) return error.code;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

export function securityErrorStatus(error: unknown, fallback: number = 400): number {
  if (error instanceof SecurityError) {
    switch (error.code) {
      case SecurityErrorCode.UNAUTHORIZED:
        return 401;
      case SecurityErrorCode.FORBIDDEN:
        return 403;
      case SecurityErrorCode.RATE_LIMIT_EXCEEDED:
        return 429;
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('UNAUTHORIZED')) return 401;
  if (message.includes('FORBIDDEN')) return 403;
  if (message.includes('RATE_LIMIT')) return 429;
  return fallback;
}

export function isSecurityAuthError(error: unknown): boolean {
  if (error instanceof SecurityError) {
    return (
      error.code === SecurityErrorCode.UNAUTHORIZED || error.code === SecurityErrorCode.FORBIDDEN
    );
  }

  const message = error instanceof Error ? error.message : String(error);
  return message.includes('UNAUTHORIZED') || message.includes('FORBIDDEN');
}
