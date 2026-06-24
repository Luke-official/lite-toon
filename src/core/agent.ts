import { CapabilityRegistry } from './registry';
import { SecurityGatekeeper } from './security';
import { UniversalAgentConfig } from './types';

/**
 * The UniversalAgent acts as the central hub for the API Layer.
 * It bundles the capability registry and the security gatekeeper.
 */
export class UniversalAgent {
  public registry: CapabilityRegistry;
  public gatekeeper: SecurityGatekeeper;

  constructor(config?: UniversalAgentConfig) {
    this.registry = new CapabilityRegistry();
    this.gatekeeper = new SecurityGatekeeper();

    if (config?.capabilities) {
      for (const cap of config.capabilities) {
        this.registry.register(cap);
      }
    }
  }
}
