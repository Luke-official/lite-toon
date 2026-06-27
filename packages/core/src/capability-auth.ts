import type { Capability } from './types';

/**
 * Returns true when a capability requires OAuth (non-empty scopes).
 * Public catalog tools should set `scopes: []`.
 */
export function capabilityRequiresAuth(capability: Capability): boolean {
  if (!capability.scopes) {
    return true;
  }
  return capability.scopes.length > 0;
}
