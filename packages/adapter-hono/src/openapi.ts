import { Context } from 'hono';
import { UniversalAgent, OpenApiExportOptions } from '@lite-toon/core';

export interface OpenApiHandlerOptions {
  getExportOptions: (c: Context) => OpenApiExportOptions;
}

/**
 * Serves an auto-generated OpenAPI document for ChatGPT Actions and Gemini Extensions.
 */
export function createOpenApiSpecHandler(
  agent: UniversalAgent,
  options: OpenApiHandlerOptions
) {
  return async function (c: Context) {
    const exportOptions = options.getExportOptions(c);
    const document = agent.registry.exportOpenApiDocument(exportOptions);
    c.header('Cache-Control', 'no-store');
    return c.json(document);
  };
}
