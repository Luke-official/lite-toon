interface HeaderProps {
  username: string | null;
  cartItemCount: number;
  cartTotal: number;
  cartPulse: boolean;
}

function formatPrice(value: number) {
  return `€${value.toFixed(2)}`;
}

export function Header({ username, cartItemCount, cartTotal, cartPulse }: HeaderProps) {
  return (
    <header className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">LiteShop</h1>
        <p className="text-sm text-stone-500">
          Demo store — also available via{' '}
          <a href="/connect" className="text-stone-700 underline hover:text-stone-900">
            Claude
          </a>
        </p>
      </div>
      <div className="flex items-center gap-4">
        {!username ? (
          <a
            href="/login?returnUrl=/"
            className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-100"
          >
            Sign in
          </a>
        ) : (
          <span className="text-sm text-stone-500">Signed in as {username}</span>
        )}
        <div
          className={`flex items-center gap-3 rounded-full border px-4 py-2 transition-all ${
            cartPulse
              ? 'border-emerald-400 bg-emerald-50 scale-105'
              : 'border-stone-200 bg-stone-50'
          }`}
        >
          <span className="text-lg">🛒</span>
          <div className="text-right">
            <p className="text-xs text-stone-500">Cart</p>
            <p className="text-sm font-semibold">
              {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} · {formatPrice(cartTotal)}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
