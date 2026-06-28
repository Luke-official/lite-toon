/**
 * Global types for MCP requests.
 */

declare namespace MCP {
  export interface JsonRpcRequest {
    jsonrpc: "2.0";
    id: string | number;
    method: string;
    params?: unknown;
  }

  export interface JsonRpcResponse {
    jsonrpc: "2.0";
    id: string | number;
    result?: unknown;
    error?: {
      code: number;
      message: string;
      data?: unknown;
    };
  }
}
