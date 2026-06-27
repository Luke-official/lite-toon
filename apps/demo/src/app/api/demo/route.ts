import { NextRequest, NextResponse } from 'next/server';
import { formatToon, parseToon } from '@lite-toon/bridge';
import { createNextAgentHandler, SESSION_COOKIE } from '@lite-toon/bridge/next';
import {
  enrichCart,
  getCartTotal,
  getCartItemCount,
  PRODUCT_CATALOG,
  CartItem,
  Product,
} from '@/demo/capabilities';
import { agent } from '@/agent';
import { oauthServer, authStore } from '@/lib/auth';

const adapterHandler = createNextAgentHandler(agent);
const DEMO_SCOPES = ['cart:read', 'cart:write'];
let demoAccessToken: string | null = null;

async function resolveRequestUserId(req: NextRequest): Promise<string> {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    const userId = await oauthServer.resolveSession(sessionId);
    if (userId) return userId;
  }

  const session = await oauthServer.login('demo-ui-user');
  return session.userId;
}

async function getDemoAccessToken(userId?: string): Promise<string> {
  if (!userId) {
    if (demoAccessToken) return demoAccessToken;
    const session = await oauthServer.login('demo-ui-user');
    userId = session.userId;
    const token = await oauthServer.issueAccessTokenForUser(userId, DEMO_SCOPES);
    demoAccessToken = token.access_token;
    return demoAccessToken;
  }

  const token = await oauthServer.issueAccessTokenForUser(userId, DEMO_SCOPES);
  return token.access_token;
}

function buildAssistantMessage(action: string, params: Record<string, unknown>, cart: CartItem[]) {
  const lines = enrichCart(cart);
  const total = getCartTotal(cart);

  if (action === 'addToCart') {
    const product = PRODUCT_CATALOG.find((p) => p.id === params.productId);
    const qty = params.quantity as number;
    return `Done! I added ${qty}x ${product?.name ?? 'item'} to your cart. Current total: €${total.toFixed(2)}.`;
  }

  if (action === 'getCart') {
    if (lines.length === 0) {
      return 'Your cart is empty. Try something like: "Add 2 pairs of Nike shoes to my cart".';
    }
    const summary = lines.map((line) => `${line.quantity}x ${line.name}`).join(', ');
    return `Here is your cart: ${summary}. Total: €${total.toFixed(2)}.`;
  }

  if (action === 'getProducts') {
    const list = PRODUCT_CATALOG.map((p) => `${p.name} (€${p.price})`).join(', ');
    return `Available products: ${list}.`;
  }

  if (action === 'clearCart') {
    return 'I cleared your cart. You can start adding products again whenever you like.';
  }

  return 'Done.';
}

function parseAdapterRecords(toonResponse: string): Record<string, unknown>[] {
  const parsed = parseToon(toonResponse);
  if (!parsed.success || !parsed.data) return [];
  return parsed.data.records;
}

function recordsToCart(records: Record<string, unknown>[]): CartItem[] {
  return records
    .filter((r) => r.productId)
    .map((r) => ({
      productId: String(r.productId),
      quantity: Number(r.quantity),
    }));
}

function recordsToProducts(records: Record<string, unknown>[]): Product[] {
  return records
    .filter((r) => r.id && r.name)
    .map((r) => ({
      id: String(r.id),
      name: String(r.name),
      price: Number(r.price),
    }));
}

async function runThroughAdapter(
  req: NextRequest,
  action: string,
  params: Record<string, unknown>,
  userId: string
) {
  const toonRequestPayload = formatToon('Action', [{ action, params: JSON.stringify(params) }]);
  const accessToken = await getDemoAccessToken(userId);

  const mockReq = new NextRequest(new URL(req.url), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'x-agent-id': 'demo-ai-agent',
      Authorization: `Bearer ${accessToken}`,
    },
    body: toonRequestPayload,
  });

  const adapterResponse = await adapterHandler(mockReq);
  const toonResponsePayload = await adapterResponse.text();

  if (!adapterResponse.ok) {
    const errorParsed = parseToon(toonResponsePayload);
    const message =
      errorParsed.success && errorParsed.data?.records[0]?.message
        ? String(errorParsed.data.records[0].message)
        : 'Adapter request failed.';
    throw new Error(message);
  }

  return { toonRequestPayload, toonResponsePayload };
}

export async function GET(req: NextRequest) {
  const userId = await resolveRequestUserId(req);
  const user = await authStore.getUserById(userId);
  const cartResult = await agent.registry.execute(
    'getCart',
    {},
    { userId, agentId: 'demo-ui', scopes: DEMO_SCOPES }
  );
  const cart = (cartResult.data ?? []) as CartItem[];

  return NextResponse.json({
    products: PRODUCT_CATALOG,
    cart: enrichCart(cart),
    cartTotal: getCartTotal(cart),
    cartItemCount: getCartItemCount(cart),
    user: user ? { userId, username: user.username } : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    let action = '';
    let params: Record<string, unknown> = {};

    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('add') && lowerMessage.includes('nike')) {
      action = 'addToCart';
      const match = lowerMessage.match(/\d+/);
      params = { productId: 'p1', quantity: match ? parseInt(match[0], 10) : 1 };
    } else if (lowerMessage.includes('add') && lowerMessage.includes('adidas')) {
      action = 'addToCart';
      const match = lowerMessage.match(/\d+/);
      params = { productId: 'p2', quantity: match ? parseInt(match[0], 10) : 1 };
    } else if (lowerMessage.includes('add') && lowerMessage.includes('puma')) {
      action = 'addToCart';
      const match = lowerMessage.match(/\d+/);
      params = { productId: 'p3', quantity: match ? parseInt(match[0], 10) : 1 };
    } else if (lowerMessage.includes('product') || lowerMessage.includes('catalog')) {
      action = 'getProducts';
    } else if (
      lowerMessage.includes('clear cart') ||
      lowerMessage.includes('empty cart') ||
      lowerMessage === 'clear'
    ) {
      action = 'clearCart';
    } else if (
      lowerMessage.includes('cart') &&
      !lowerMessage.includes('add')
    ) {
      action = 'getCart';
    } else {
      return NextResponse.json({
        error:
          "I didn't understand that. Try: 'Add 2 pairs of Nike shoes to my cart', 'Show my cart', 'Clear cart', or 'Show products'.",
      }, { status: 400 });
    }

    const userId = await resolveRequestUserId(req);
    const { toonRequestPayload, toonResponsePayload } = await runThroughAdapter(
      req,
      action,
      params,
      userId
    );
    const records = parseAdapterRecords(toonResponsePayload);

    let cart: CartItem[] = [];
    let products: Product[] | undefined;

    if (action === 'addToCart' || action === 'getCart' || action === 'clearCart') {
      cart = recordsToCart(records);
    } else if (action === 'getProducts') {
      products = recordsToProducts(records);
      const cartResult = await agent.registry.execute(
        'getCart',
        {},
        { userId, agentId: 'demo-ui', scopes: DEMO_SCOPES }
      );
      cart = (cartResult.data ?? []) as CartItem[];
    }

    const enrichedCart = enrichCart(cart);

    return NextResponse.json({
      aiDecision: { action, params },
      assistantMessage: buildAssistantMessage(action, params, cart),
      products: products ?? PRODUCT_CATALOG,
      cart: enrichedCart,
      cartTotal: getCartTotal(cart),
      cartItemCount: getCartItemCount(cart),
      toonRequest: toonRequestPayload,
      toonResponse: toonResponsePayload,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
