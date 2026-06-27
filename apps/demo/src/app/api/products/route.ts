import { NextResponse } from 'next/server';
import { PRODUCT_CATALOG } from '@/demo/capabilities';

/** Public product catalog — no login required. */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: PRODUCT_CATALOG,
  });
}
