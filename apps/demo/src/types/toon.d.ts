/**
 * Global types for TOON payloads.
 */

declare namespace Toon {
  export interface ParseResult {
    success: boolean;
    data?: unknown;
    error?: string;
  }
}
