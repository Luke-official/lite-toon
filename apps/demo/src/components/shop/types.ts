export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface CartLine {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  subtotal: number;
}

export interface ShopState {
  products: Product[];
  cart: CartLine[];
  cartTotal: number;
  cartItemCount: number;
}
