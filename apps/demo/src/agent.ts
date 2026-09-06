import { UniversalAgent, InMemoryHitlStore } from '@lite-toon/bridge';
import {
  getProducts,
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} from '@/demo/capabilities';
import { oauthServer } from '@/lib/auth';

const globalForHitl = globalThis as unknown as {
  hitlStore: InMemoryHitlStore | undefined;
};

export const hitlStore = globalForHitl.hitlStore ?? new InMemoryHitlStore();
if (process.env.NODE_ENV !== 'production') globalForHitl.hitlStore = hitlStore;

export const agent = new UniversalAgent({
  tokenResolver: oauthServer,
  hitlStore,
  capabilities: [getProducts, getCart, addToCart, removeFromCart, clearCart],
});
