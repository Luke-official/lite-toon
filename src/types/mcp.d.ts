/**
 * Global types for MCP requests.
 */

declare namespace MCP {
  export interface JsonRpcRequest {
    jsonrpc: "2.0";
    id: string | number;
    method: string;
    params?: any;
  }

  export interface JsonRpcResponse {
    jsonrpc: "2.0";
    id: string | number;
    result?: any;
    error?: {
      code: number;
      message: string;
      data?: any;
    };
  }
}
