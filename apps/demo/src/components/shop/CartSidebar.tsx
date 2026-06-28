import type { CartLine } from './types';

const PRODUCT_EMOJI: Record<string, string> = {
  p1: '👟',
  p2: '👕',
  p3: '🧦',
};

function formatPrice(value: number) {
  return `€${value.toFixed(2)}`;
}

interface CartSidebarProps {
  cart: CartLine[];
  cartTotal: number;
  cartItemCount: number;
  isLoggedIn: boolean;
  isLoading: boolean;
  onRemoveLine: (productId: string) => void;
  onClearCart: () => void;
}

export function CartSidebar({
  cart,
  cartTotal,
  cartItemCount,
  isLoggedIn,
  isLoading,
  onRemoveLine,
  onClearCart,
}: CartSidebarProps) {
  return (
    <aside className="w-full max-w-sm border-l border-stone-200 bg-white flex flex-col min-h-0">
      <div className="p-4 border-b border-stone-200 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-medium">Your cart</h2>
          <p className="text-sm text-stone-500">
            {cart.length === 0 ? 'Still empty' : `${cartItemCount} items`}
          </p>
        </div>
        {cart.length > 0 && isLoggedIn && (
          <button
            type="button"
            onClick={onClearCart}
            disabled={isLoading}
            className="text-xs text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg px-2 py-1 disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!isLoggedIn ? (
          <div className="rounded-lg border border-dashed border-stone-200 p-6 text-center text-stone-400 text-sm">
            Sign in to view and manage your cart.
            <br />
            <a href="/login?returnUrl=/" className="text-amber-700 underline mt-2 inline-block">
              Sign in
            </a>
          </div>
        ) : cart.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-200 p-6 text-center text-stone-400 text-sm">
            No items in your cart.
            <br />
            Add products from the catalog.
          </div>
        ) : (
          cart.map((line) => (
            <div
              key={line.productId}
              className="flex items-center gap-3 rounded-lg border border-stone-100 bg-stone-50 p-3"
            >
              <span className="text-2xl">{PRODUCT_EMOJI[line.productId] ?? '📦'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{line.name}</p>
                <p className="text-xs text-stone-500">
                  {line.quantity} × {formatPrice(line.price)}
                </p>
              </div>
              <p className="text-sm font-semibold">{formatPrice(line.subtotal)}</p>
              <button
                type="button"
                onClick={() => onRemoveLine(line.productId)}
                disabled={isLoading}
                className="text-stone-400 hover:text-red-600 text-lg leading-none disabled:opacity-50"
                aria-label={`Remove ${line.name}`}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-stone-200 p-4 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">Subtotal</span>
          <span className="font-semibold">{formatPrice(cartTotal)}</span>
        </div>
        <p className="text-xs text-stone-400">Checkout is simulated for the demo.</p>
      </div>
    </aside>
  );
}
