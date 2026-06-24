import { Capability, ExecutionContext } from '@lite-toon/bridge';

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartLine extends CartItem {
  name: string;
  price: number;
  subtotal: number;
}

export const PRODUCT_CATALOG: readonly Product[] = [
  { id: 'p1', name: 'Nike Shoes', price: 120 },
  { id: 'p2', name: 'Adidas T-Shirt', price: 35 },
  { id: 'p3', name: 'Puma Socks', price: 15 },
] as const;

const productsDB: Product[] = [...PRODUCT_CATALOG];
const cartsByUser = new Map<string, CartItem[]>();

function getUserCart(userId: string): CartItem[] {
  if (!cartsByUser.has(userId)) {
    cartsByUser.set(userId, []);
  }
  return cartsByUser.get(userId)!;
}

function requireUserId(context?: ExecutionContext): string {
  if (!context?.userId || context.userId === 'anonymous') {
    throw new Error('Authenticated user is required for this operation.');
  }
  return context.userId;
}

export function enrichCart(cart: CartItem[]): CartLine[] {
  return cart.map((item) => {
    const product = productsDB.find((p) => p.id === item.productId);
    const price = product?.price ?? 0;
    return {
      ...item,
      name: product?.name ?? 'Prodotto sconosciuto',
      price,
      subtotal: price * item.quantity,
    };
  });
}

export function getCartTotal(cart: CartItem[]): number {
  return enrichCart(cart).reduce((sum, line) => sum + line.subtotal, 0);
}

export function getCartItemCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export const getProducts: Capability = {
  name: 'getProducts',
  description: 'Returns the list of available products.',
  scopes: ['cart:read'],
  execute: async () => ({
    success: true,
    data: productsDB,
  }),
};

export const getCart: Capability = {
  name: 'getCart',
  description: 'Returns the current contents of the user cart.',
  scopes: ['cart:read'],
  execute: async (_params, context) => {
    const userId = requireUserId(context);
    const cart = getUserCart(userId);
    return {
      success: true,
      data: cart,
    };
  },
};

export const addToCart: Capability = {
  name: 'addToCart',
  description: 'Adds a product to the user cart.',
  scopes: ['cart:write'],
  schema: {
    type: 'object',
    properties: {
      productId: { type: 'string' },
      quantity: { type: 'number' },
    },
    required: ['productId', 'quantity'],
  },
  execute: async (params: any, context) => {
    const userId = requireUserId(context);
    const { productId, quantity } = params || {};
    if (!productId || typeof quantity !== 'number') {
      throw new Error('Invalid parameters for addToCart.');
    }

    const product = productsDB.find((p) => p.id === productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    const cart = getUserCart(userId);
    const existingItem = cart.find((item) => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }

    return {
      success: true,
      data: cart,
    };
  },
};

export const clearCart: Capability = {
  name: 'clearCart',
  description: 'Removes all items from the user cart.',
  scopes: ['cart:write'],
  execute: async (_params, context) => {
    const userId = requireUserId(context);
    cartsByUser.set(userId, []);
    return {
      success: true,
      data: [],
    };
  },
};
