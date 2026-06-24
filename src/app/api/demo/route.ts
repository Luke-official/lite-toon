import { NextRequest, NextResponse } from 'next/server';
import { UniversalAgent } from '@/core/agent';
import { createNextAgentHandler } from '@/adapters/nextjs/rest';
import { getProducts, getCart, addToCart } from '@/demo/capabilities';
import { formatToon } from '@/core/toon/formatter';

// Initialize a dedicated agent for the demo
const demoAgent = new UniversalAgent({
  capabilities: [getProducts, getCart, addToCart]
});

// Create the standard adapter handler
const adapterHandler = createNextAgentHandler(demoAgent);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    let action = '';
    let params: any = {};

    // Mock AI decision logic based on natural language
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('aggiungi') && lowerMessage.includes('nike')) {
      action = 'addToCart';
      const match = lowerMessage.match(/\d+/);
      const quantity = match ? parseInt(match[0], 10) : 1;
      params = { productId: 'p1', quantity }; // p1 is Nike Shoes
    } else if (lowerMessage.includes('aggiungi') && lowerMessage.includes('adidas')) {
      action = 'addToCart';
      const match = lowerMessage.match(/\d+/);
      const quantity = match ? parseInt(match[0], 10) : 1;
      params = { productId: 'p2', quantity }; // p2 is Adidas T-Shirt
    } else if (lowerMessage.includes('prodotti')) {
      action = 'getProducts';
    } else if (lowerMessage.includes('carrello')) {
      action = 'getCart';
    } else {
      return NextResponse.json({ 
        error: "Non ho capito. Prova con 'Aggiungi 2 paia di scarpe Nike al carrello' oppure 'Mostra i prodotti'." 
      }, { status: 400 });
    }

    // Prepare a mock TOON request to send to our adapter
    const toonRequestPayload = formatToon('Action', [{ action, params: JSON.stringify(params) }]);

    // Create a mock NextRequest to feed into the adapter
    const mockReq = new NextRequest(new URL(req.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'x-agent-id': 'demo-ai-agent'
      },
      body: toonRequestPayload
    });

    // Route through the Next.js Adapter
    const adapterResponse = await adapterHandler(mockReq);
    
    // The adapter returns a NextResponse with the TOON formatted result
    const toonResponsePayload = await adapterResponse.text();

    // Return both the simulated AI request and the adapter's TOON response to the frontend for visualization
    return NextResponse.json({
      aiDecision: { action, params },
      toonRequest: toonRequestPayload,
      toonResponse: toonResponsePayload
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
