import type { CartLine, Product } from './types';

const PRODUCT_EMOJI: Record<string, string> = {
  p1: '👟',
  p2: '👕',
  p3: '🧦',
};

function formatPrice(value: number) {
  return `€${value.toFixed(2)}`;
}

interface ProductGridProps {
  products: Product[];
  cart: CartLine[];
  isLoggedIn: boolean;
  isLoading: boolean;
  onAddToCart: (productId: string) => void;
}

export function ProductGrid({
  products,
  cart,
  isLoggedIn,
  isLoading,
  onAddToCart,
}: ProductGridProps) {
  const cartQuantityForProduct = (productId: string) =>
    cart.find((line) => line.productId === productId)?.quantity ?? 0;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium">Catalog</h2>
        <p className="text-sm text-stone-500">
          {isLoggedIn
            ? 'Add products to your cart below.'
            : 'Browse the catalog. Sign in to add items to your cart.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map((product) => {
          const inCart = cartQuantityForProduct(product.id);
          return (
            <article
              key={product.id}
              className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{PRODUCT_EMOJI[product.id] ?? '📦'}</span>
                {inCart > 0 && (
                  <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1">
                    In cart: {inCart}
                  </span>
                )}
              </div>
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-stone-500 text-sm mt-1 mb-4">{formatPrice(product.price)}</p>
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => onAddToCart(product.id)}
                  disabled={isLoading}
                  className="mt-auto w-full bg-stone-900 text-white text-sm font-medium rounded-lg px-3 py-2 hover:bg-stone-800 disabled:opacity-50"
                >
                  Add to cart
                </button>
              ) : (
                <a
                  href="/login?returnUrl=/"
                  className="mt-auto w-full text-center text-sm text-amber-700 border border-amber-200 rounded-lg px-3 py-2 hover:bg-amber-50"
                >
                  Sign in to add
                </a>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
