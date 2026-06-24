import { NextRequest, NextResponse } from 'next/server';
import { UniversalAgent, OpenApiExportOptions } from '@lite-toon/core';

export interface OpenApiHandlerOptions {
  getExportOptions: (req: NextRequest) => OpenApiExportOptions;
}

/**
 * Serves an auto-generated OpenAPI document for ChatGPT Actions and Gemini Extensions.
 */
export function createOpenApiSpecHandler(
  agent: UniversalAgent,
  options: OpenApiHandlerOptions
) {
  return async function GET(req: NextRequest) {
    const exportOptions = options.getExportOptions(req);
    const document = agent.registry.exportOpenApiDocument(exportOptions);
    return NextResponse.json(document, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  };
}
