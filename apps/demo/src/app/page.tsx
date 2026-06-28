"use client";

import { useCallback, useEffect, useState } from "react";
import { PRODUCT_CATALOG } from "@/demo/capabilities";
import { demoFetch } from "@/lib/demo-fetch";
import { CartSidebar } from "@/components/shop/CartSidebar";
import { Header } from "@/components/shop/Header";
import { ProductGrid } from "@/components/shop/ProductGrid";
import type { CartLine, Product } from "@/components/shop/types";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([...PRODUCT_CATALOG]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);

  const applyCartState = useCallback((data: {
    cart?: CartLine[];
    cartTotal?: number;
    cartItemCount?: number;
  }) => {
    if (data.cart !== undefined) {
      setCart(data.cart);
      setCartPulse(true);
      setTimeout(() => setCartPulse(false), 600);
    }
    if (typeof data.cartTotal === "number") setCartTotal(data.cartTotal);
    if (typeof data.cartItemCount === "number") setCartItemCount(data.cartItemCount);
  }, []);

  const loadShop = useCallback(async () => {
    const [productsRes, cartRes, meRes] = await Promise.all([
      demoFetch("/api/products"),
      demoFetch("/api/cart"),
      demoFetch("/api/me"),
    ]);

    if (productsRes.ok) {
      const productsData = await productsRes.json();
      setProducts(productsData.data ?? [...PRODUCT_CATALOG]);
    }

    if (cartRes.ok) {
      const cartData = await cartRes.json();
      setCart(cartData.cart ?? []);
      setCartTotal(cartData.cartTotal ?? 0);
      setCartItemCount(cartData.cartItemCount ?? 0);
    }

    if (meRes.ok) {
      const meData = await meRes.json();
      setUsername(meData.username ?? null);
    } else {
      setUsername(null);
    }
  }, []);

  useEffect(() => {
    loadShop();
    const onFocus = () => loadShop();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadShop]);

  const addToCart = async (productId: string) => {
    setIsLoading(true);
    try {
      const res = await demoFetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.ok) {
        applyCartState(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removeLine = async (productId: string) => {
    setIsLoading(true);
    try {
      const res = await demoFetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        applyCartState(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      const res = await demoFetch("/api/cart", { method: "DELETE" });
      if (res.ok) {
        applyCartState(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isLoggedIn = username !== null;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      <Header
        username={username}
        cartItemCount={cartItemCount}
        cartTotal={cartTotal}
        cartPulse={cartPulse}
      />

      <div className="flex flex-1 min-h-0">
        <ProductGrid
          products={products}
          cart={cart}
          isLoggedIn={isLoggedIn}
          isLoading={isLoading}
          onAddToCart={addToCart}
        />
        <CartSidebar
          cart={cart}
          cartTotal={cartTotal}
          cartItemCount={cartItemCount}
          isLoggedIn={isLoggedIn}
          isLoading={isLoading}
          onRemoveLine={removeLine}
          onClearCart={clearCart}
        />
      </div>
    </div>
  );
}
