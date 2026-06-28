import { NextRequest, NextResponse } from 'next/server';
import { agent } from '@/agent';
import {
  enrichCart,
  getCartTotal,
  getCartItemCount,
  CartItem,
} from '@/demo/capabilities';
import { resolveSessionUserId } from '@/lib/session';

const WEBAPP_CONTEXT = {
  agentId: 'webapp',
  scopes: ['cart:read', 'cart:write'],
};

function cartPayload(cart: CartItem[]) {
  return {
    cart: enrichCart(cart),
    cartTotal: getCartTotal(cart),
    cartItemCount: getCartItemCount(cart),
  };
}

export async function GET(req: NextRequest) {
  const userId = await resolveSessionUserId(req);
  if (!userId) {
    return NextResponse.json({ cart: [], cartTotal: 0, cartItemCount: 0 });
  }

  const result = await agent.registry.execute('getCart', {}, { userId, ...WEBAPP_CONTEXT });
  const cart = (result.data ?? []) as CartItem[];
  return NextResponse.json(cartPayload(cart));
}

export async function POST(req: NextRequest) {
  const userId = await resolveSessionUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  let body: { productId?: string; quantity?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { productId, quantity } = body;
  if (!productId || typeof quantity !== 'number') {
    return NextResponse.json({ error: 'productId and quantity are required.' }, { status: 400 });
  }

  try {
    const result = await agent.registry.execute(
      'addToCart',
      { productId, quantity },
      { userId, ...WEBAPP_CONTEXT }
    );
    const cart = (result.data ?? []) as CartItem[];
    return NextResponse.json(cartPayload(cart));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add to cart.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await resolveSessionUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const productId = req.nextUrl.searchParams.get('productId');

  try {
    const result = productId
      ? await agent.registry.execute('removeFromCart', { productId }, { userId, ...WEBAPP_CONTEXT })
      : await agent.registry.execute('clearCart', {}, { userId, ...WEBAPP_CONTEXT });
    const cart = (result.data ?? []) as CartItem[];
    return NextResponse.json(cartPayload(cart));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update cart.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
