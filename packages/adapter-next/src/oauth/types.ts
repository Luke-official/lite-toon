import { OAuthServer } from '@lite-toon/auth';

export interface OAuthAdapterOptions {
  oauth: OAuthServer;
  loginPath?: string;
}
