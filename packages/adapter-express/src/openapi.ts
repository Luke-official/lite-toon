import { Request, Response } from 'express';
import { UniversalAgent, OpenApiExportOptions } from '@lite-toon/core';

export interface OpenApiHandlerOptions {
  getExportOptions: (req: Request) => OpenApiExportOptions;
}

/**
 * Serves an auto-generated OpenAPI document for ChatGPT Actions and Gemini Extensions.
 */
export function createOpenApiSpecHandler(
  agent: UniversalAgent,
  options: OpenApiHandlerOptions
) {
  return async function (req: Request, res: Response) {
    const exportOptions = options.getExportOptions(req);
    const document = agent.registry.exportOpenApiDocument(exportOptions);
    res.setHeader('Cache-Control', 'no-store');
    res.json(document);
  };
}
