import { HitlStore, HitlRequest, HitlStatus } from './types';
import * as crypto from 'crypto';

export class InMemoryHitlStore implements HitlStore {
  private requests: Map<string, HitlRequest> = new Map();

  async create(request: Omit<HitlRequest, 'id' | 'createdAt' | 'status'>): Promise<HitlRequest> {
    const id = crypto.randomUUID();
    const hitlRequest: HitlRequest = {
      ...request,
      id,
      status: 'pending',
      createdAt: Date.now(),
    };
    
    this.requests.set(id, hitlRequest);
    return hitlRequest;
  }

  async get(id: string): Promise<HitlRequest | null> {
    return this.requests.get(id) || null;
  }

  async updateStatus(id: string, status: HitlStatus): Promise<boolean> {
    const request = this.requests.get(id);
    if (!request) return false;
    
    request.status = status;
    return true;
  }

  async listPending(): Promise<HitlRequest[]> {
    return Array.from(this.requests.values()).filter(req => req.status === 'pending');
  }
}
