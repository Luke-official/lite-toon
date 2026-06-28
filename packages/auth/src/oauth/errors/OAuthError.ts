export const OAuthErrorCode = {
  INVALID_REQUEST: 'invalid_request',
  INVALID_CLIENT: 'invalid_client',
  INVALID_GRANT: 'invalid_grant',
  INVALID_REDIRECT_URI: 'invalid_redirect_uri',
  UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',
  UNSUPPORTED_RESPONSE_TYPE: 'unsupported_response_type',
  REGISTRATION_NOT_SUPPORTED: 'registration_not_supported',
} as const;

export type OAuthErrorCode = (typeof OAuthErrorCode)[keyof typeof OAuthErrorCode];

export class OAuthError extends Error {
  constructor(public readonly code: OAuthErrorCode) {
    super(code);
    this.name = 'OAuthError';
  }
}
