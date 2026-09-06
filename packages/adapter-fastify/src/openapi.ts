import { FastifyRequest, FastifyReply } from 'fastify';
import { UniversalAgent, OpenApiExportOptions } from '@lite-toon/core';

export interface OpenApiHandlerOptions {
  getExportOptions: (req: FastifyRequest) => OpenApiExportOptions;
}

/**
 * Serves an auto-generated OpenAPI document for ChatGPT Actions and Gemini Extensions.
 */
export function createOpenApiSpecHandler(
  agent: UniversalAgent,
  options: OpenApiHandlerOptions
) {
  return async function (req: FastifyRequest, reply: FastifyReply) {
    const exportOptions = options.getExportOptions(req);
    const document = agent.registry.exportOpenApiDocument(exportOptions);
    reply.header('Cache-Control', 'no-store');
    return reply.send(document);
  };
}
