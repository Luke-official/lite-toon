import { Capability } from '@/core/types';

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
  { id: 'p3', name: 'Puma Socks', price: 15 }
] as const;

const productsDB: Product[] = [...PRODUCT_CATALOG];

let cartDB: CartItem[] = [];

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
  execute: async () => {
    return {
      success: true,
      data: productsDB
    };
  }
};

export const getCart: Capability = {
  name: 'getCart',
  description: 'Returns the current contents of the user cart.',
  execute: async () => {
    // If cart is empty, return a dummy empty record so TOON formatter can infer keys,
    // or just return an empty array. The formatter handles empty arrays as `Entity[0]{}:\n`.
    return {
      success: true,
      data: cartDB.length > 0 ? cartDB : []
    };
  }
};

export const addToCart: Capability = {
  name: 'addToCart',
  description: 'Adds a product to the user cart.',
  schema: {
    type: "object",
    properties: {
      productId: { type: "string" },
      quantity: { type: "number" }
    },
    required: ["productId", "quantity"]
  },
  execute: async (params: any) => {
    const { productId, quantity } = params || {};
    if (!productId || typeof quantity !== 'number') {
      throw new Error("Invalid parameters for addToCart.");
    }
    
    const product = productsDB.find(p => p.id === productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    const existingItem = cartDB.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cartDB.push({ productId, quantity });
    }

    return {
      success: true,
      data: cartDB
    };
  }
};

export const clearCart: Capability = {
  name: 'clearCart',
  description: 'Removes all items from the user cart.',
  execute: async () => {
    cartDB = [];
    return {
      success: true,
      data: cartDB
    };
  }
};
