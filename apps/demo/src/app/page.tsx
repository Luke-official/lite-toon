"use client";

import { useEffect, useState } from "react";
import { PRODUCT_CATALOG } from "@/demo/capabilities";
import { demoFetch } from "@/lib/demo-fetch";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface CartLine {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  subtotal: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  toonRequest?: string;
  toonResponse?: string;
  aiDecision?: { action: string; params: Record<string, unknown> };
}

const PRODUCT_EMOJI: Record<string, string> = {
  p1: "👟",
  p2: "👕",
  p3: "🧦",
};

function formatPrice(value: number) {
  return `€${value.toFixed(2)}`;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([...PRODUCT_CATALOG]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        'Hi! Browse the catalog below. Sign in to use your cart and sync with Claude — then ask me to add products or say "Show products".',
    },
  ]);
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showToonLog, setShowToonLog] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  const loadStore = () =>
    demoFetch("/api/demo")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load shop (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setProducts(data.products ?? [...PRODUCT_CATALOG]);
        setCart(data.cart ?? []);
        setCartTotal(data.cartTotal ?? 0);
        setCartItemCount(data.cartItemCount ?? 0);
        setUsername(data.user?.username ?? null);
      })
      .catch(() => {
        setProducts([...PRODUCT_CATALOG]);
      });

  useEffect(() => {
    loadStore();
    demoFetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.username) setUsername(data.username);
      })
      .catch(() => {});

    const onFocus = () => loadStore();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const updateStoreState = (data: {
    products?: Product[];
    cart?: CartLine[];
    cartTotal?: number;
    cartItemCount?: number;
  }) => {
    if (data.products) setProducts(data.products);
    if (data.cart !== undefined) {
      setCart(data.cart);
      setCartPulse(true);
      setTimeout(() => setCartPulse(false), 600);
    }
    if (typeof data.cartTotal === "number") setCartTotal(data.cartTotal);
    if (typeof data.cartItemCount === "number") setCartItemCount(data.cartItemCount);
  };

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await demoFetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "An error occurred." },
        ]);
      } else {
        updateStoreState(data);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.assistantMessage },
        ]);
        setLogs((prev) => [
          {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            toonRequest: data.toonRequest,
            toonResponse: data.toonResponse,
            aiDecision: data.aiDecision,
          },
          ...prev,
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Could not connect to the server." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    await sendMessage(userMessage);
  };

  const cartQuantityForProduct = (productId: string) =>
    cart.find((line) => line.productId === productId)?.quantity ?? 0;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      <header className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">LiteShop</h1>
          <p className="text-sm text-stone-500">AI agent e-commerce demo</p>
        </div>
        <div className="flex items-center gap-4">
          {!username ? (
            <a
              href="/login?returnUrl=/"
              className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-100"
            >
              Sign in to sync cart with Claude
            </a>
          ) : (
            <span className="text-sm text-stone-500">Signed in as {username}</span>
          )}
          <a href="/connect" className="text-sm text-stone-600 underline hover:text-stone-900">
            Connect AI
          </a>
          <div
            className={`flex items-center gap-3 rounded-full border px-4 py-2 transition-all ${
              cartPulse
                ? "border-emerald-400 bg-emerald-50 scale-105"
                : "border-stone-200 bg-stone-50"
            }`}
          >
          <span className="text-lg">🛒</span>
          <div className="text-right">
            <p className="text-xs text-stone-500">Cart</p>
            <p className="text-sm font-semibold">
              {cartItemCount} {cartItemCount === 1 ? "item" : "items"} · {formatPrice(cartTotal)}
            </p>
          </div>
        </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium">Catalog</h2>
            <p className="text-sm text-stone-500">
              {username
                ? "Ask the assistant to add a product — the cart updates in real time."
                : "Sign in to sync your cart with Claude, then add items here or via Claude."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map((product) => {
              const inCart = cartQuantityForProduct(product.id);
              return (
                <article
                  key={product.id}
                  className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{PRODUCT_EMOJI[product.id] ?? "📦"}</span>
                    {inCart > 0 && (
                      <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1">
                        In cart: {inCart}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-stone-500 text-sm mt-1">{formatPrice(product.price)}</p>
                </article>
              );
            })}
          </div>
        </main>

        <aside className="w-full max-w-sm border-l border-stone-200 bg-white flex flex-col min-h-0">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-medium">Your cart</h2>
              <p className="text-sm text-stone-500">
                {cart.length === 0 ? "Still empty" : `${cartItemCount} items`}
              </p>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => sendMessage("Clear cart")}
                disabled={isLoading}
                className="text-xs text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg px-2 py-1 disabled:opacity-50"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-200 p-6 text-center text-stone-400 text-sm">
                {username ? (
                  <>
                    No items in your cart.
                    <br />
                    Try: &quot;Add 2 pairs of Nike shoes to my cart&quot;
                  </>
                ) : (
                  <>
                    Sign in to view and sync your cart.
                    <br />
                    <a href="/login?returnUrl=/" className="text-amber-700 underline mt-2 inline-block">
                      Sign in
                    </a>
                  </>
                )}
              </div>
            ) : (
              cart.map((line) => (
                <div
                  key={line.productId}
                  className="flex items-center gap-3 rounded-lg border border-stone-100 bg-stone-50 p-3"
                >
                  <span className="text-2xl">{PRODUCT_EMOJI[line.productId] ?? "📦"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{line.name}</p>
                    <p className="text-xs text-stone-500">
                      {line.quantity} × {formatPrice(line.price)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(line.subtotal)}</p>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-stone-200 p-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Subtotale</span>
              <span className="font-semibold">{formatPrice(cartTotal)}</span>
            </div>
            <p className="text-xs text-stone-400">Shipping and checkout are simulated for the demo.</p>
          </div>

          <div className="border-t border-stone-200 p-4 flex flex-col min-h-[280px]">
            <h3 className="text-sm font-medium mb-3">AI assistant</h3>
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-[120px] max-h-[180px]">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`text-sm rounded-lg px-3 py-2 ${
                    msg.role === "user"
                      ? "bg-stone-900 text-white ml-6"
                      : "bg-stone-100 text-stone-800 mr-6"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {isLoading && (
                <div className="text-sm rounded-lg px-3 py-2 bg-stone-100 text-stone-500 mr-6 animate-pulse">
                  Working on it...
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-stone-900 text-white px-3 py-2 rounded-lg text-sm hover:bg-stone-800 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </aside>
      </div>

      <div className="border-t border-stone-200 bg-stone-900 text-stone-300">
        <button
          type="button"
          onClick={() => setShowToonLog((v) => !v)}
          className="w-full px-6 py-3 text-left text-sm flex items-center justify-between hover:bg-stone-800"
        >
          <span className="font-mono text-emerald-400">TOON System Log</span>
          <span className="text-stone-500">{showToonLog ? "Hide" : "Show"} compressed payloads</span>
        </button>

        {showToonLog && (
          <div className="max-h-64 overflow-y-auto px-6 pb-4 space-y-4 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-stone-500 italic">Send a message to see TOON request/response payloads.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border border-stone-700 rounded-lg p-3 bg-black">
                  <p className="text-stone-500 mb-2">
                    [{log.timestamp}] {log.aiDecision?.action}
                  </p>
                  <p className="text-blue-400 mb-1">↑ Request</p>
                  <pre className="text-yellow-300 whitespace-pre-wrap mb-2">{log.toonRequest}</pre>
                  <p className="text-green-400 mb-1">↓ Response</p>
                  <pre className="text-purple-300 whitespace-pre-wrap">{log.toonResponse}</pre>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
