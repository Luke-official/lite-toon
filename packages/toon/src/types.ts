/**
 * Represents a parsed TOON (Token-Oriented Object Notation) object.
 */
export interface ToonObject {
  [key: string]: any;
}

/**
 * Result of a TOON parsing operation.
 */
export interface ToonParseResult {
  success: boolean;
  data?: ToonObject;
  error?: string;
}
