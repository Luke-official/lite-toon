/**
 * Global types for TOON payloads.
 */

declare namespace Toon {
  export interface ParseResult {
    success: boolean;
    data?: any;
    error?: string;
  }
}
