import { UniversalAgent } from '@lite-toon/bridge';
import {
  getProducts,
  getCart,
  addToCart,
  clearCart,
} from '@/demo/capabilities';
import { oauthServer } from '@/lib/auth';

export const agent = new UniversalAgent({
  tokenResolver: oauthServer,
  capabilities: [getProducts, getCart, addToCart, clearCart],
});
