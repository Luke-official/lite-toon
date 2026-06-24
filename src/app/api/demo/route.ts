import { NextRequest, NextResponse } from 'next/server';
import { UniversalAgent } from '@/core/agent';
import { createNextAgentHandler } from '@/adapters/nextjs/rest';
import {
  getProducts,
  getCart,
  addToCart,
  clearCart,
  enrichCart,
  getCartTotal,
  getCartItemCount,
  PRODUCT_CATALOG,
  CartItem,
  Product,
} from '@/demo/capabilities';
import { formatToon } from '@/core/toon/formatter';
import { parseToon } from '@/core/toon/parser';

const demoAgent = new UniversalAgent({
  capabilities: [getProducts, getCart, addToCart, clearCart],
});

const adapterHandler = createNextAgentHandler(demoAgent);

function buildAssistantMessage(action: string, params: Record<string, unknown>, cart: CartItem[]) {
  const lines = enrichCart(cart);
  const total = getCartTotal(cart);

  if (action === 'addToCart') {
    const product = PRODUCT_CATALOG.find((p) => p.id === params.productId);
    const qty = params.quantity as number;
    return `Perfetto! Ho aggiunto ${qty}x ${product?.name ?? 'prodotto'} al carrello. Totale attuale: €${total.toFixed(2)}.`;
  }

  if (action === 'getCart') {
    if (lines.length === 0) {
      return 'Il carrello è vuoto. Dimmi cosa vuoi aggiungere, ad esempio: "Aggiungi 2 paia di scarpe Nike al carrello".';
    }
    const summary = lines.map((line) => `${line.quantity}x ${line.name}`).join(', ');
    return `Ecco il tuo carrello: ${summary}. Totale: €${total.toFixed(2)}.`;
  }

  if (action === 'getProducts') {
    const list = PRODUCT_CATALOG.map((p) => `${p.name} (€${p.price})`).join(', ');
    return `Questi sono i prodotti disponibili: ${list}.`;
  }

  if (action === 'clearCart') {
    return 'Ho svuotato il carrello. Puoi ricominciare ad aggiungere prodotti quando vuoi.';
  }

  return 'Operazione completata.';
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

async function runThroughAdapter(req: NextRequest, action: string, params: Record<string, unknown>) {
  const toonRequestPayload = formatToon('Action', [{ action, params: JSON.stringify(params) }]);

  const mockReq = new NextRequest(new URL(req.url), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'x-agent-id': 'demo-ai-agent',
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

export async function GET() {
  const cartResult = await getCart.execute({});
  const cart = (cartResult.data ?? []) as CartItem[];

  return NextResponse.json({
    products: PRODUCT_CATALOG,
    cart: enrichCart(cart),
    cartTotal: getCartTotal(cart),
    cartItemCount: getCartItemCount(cart),
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
    if (lowerMessage.includes('aggiungi') && lowerMessage.includes('nike')) {
      action = 'addToCart';
      const match = lowerMessage.match(/\d+/);
      params = { productId: 'p1', quantity: match ? parseInt(match[0], 10) : 1 };
    } else if (lowerMessage.includes('aggiungi') && lowerMessage.includes('adidas')) {
      action = 'addToCart';
      const match = lowerMessage.match(/\d+/);
      params = { productId: 'p2', quantity: match ? parseInt(match[0], 10) : 1 };
    } else if (lowerMessage.includes('aggiungi') && lowerMessage.includes('puma')) {
      action = 'addToCart';
      const match = lowerMessage.match(/\d+/);
      params = { productId: 'p3', quantity: match ? parseInt(match[0], 10) : 1 };
    } else if (lowerMessage.includes('prodott')) {
      action = 'getProducts';
    } else if (
      lowerMessage.includes('svuota') ||
      lowerMessage.includes('vuota') ||
      lowerMessage.includes('svuotare') ||
      lowerMessage.includes('empty cart')
    ) {
      action = 'clearCart';
    } else if (lowerMessage.includes('carrello')) {
      action = 'getCart';
    } else {
      return NextResponse.json({
        error:
          "Non ho capito. Prova con 'Aggiungi 2 paia di scarpe Nike al carrello', 'Mostra il carrello', 'Svuota carrello' o 'Mostra i prodotti'.",
      }, { status: 400 });
    }

    const { toonRequestPayload, toonResponsePayload } = await runThroughAdapter(req, action, params);
    const records = parseAdapterRecords(toonResponsePayload);

    let cart: CartItem[] = [];
    let products: Product[] | undefined;

    if (action === 'addToCart' || action === 'getCart' || action === 'clearCart') {
      cart = recordsToCart(records);
    } else if (action === 'getProducts') {
      products = recordsToProducts(records);
      const cartResult = await getCart.execute({});
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
