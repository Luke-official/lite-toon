import { UniversalAgent, InMemoryHitlStore } from '@lite-toon/bridge';
import { ALL_CAPABILITIES } from '@/demo/capabilities';
import { oauthServer } from '@/lib/auth';

const globalForAgent = globalThis as unknown as {
  hitlStore: InMemoryHitlStore | undefined;
  agent: UniversalAgent | undefined;
};

export const hitlStore = globalForAgent.hitlStore ?? new InMemoryHitlStore();
export const agent = globalForAgent.agent ?? new UniversalAgent({
  tokenResolver: oauthServer,
  hitlStore,
  capabilities: ALL_CAPABILITIES,
});

if (process.env.NODE_ENV !== 'production') {
  globalForAgent.hitlStore = hitlStore;
  globalForAgent.agent = agent;
}
