import { ToonParseResult } from './types';
import { parseToonLine } from './parser/line';

/**
 * Parses a TOON string into an object.
 *
 * @param input - The TOON formatted string to parse.
 * @returns The parsed result containing either the data or an error description.
 */
export function parseToon(input: string): ToonParseResult {
  if (!input || typeof input !== 'string') {
    return { success: false, error: 'Input is not a valid string.' };
  }

  const lines = input.trim().split('\n');
  if (lines.length === 0) {
    return { success: false, error: 'Empty input.' };
  }

  const headerLine = lines[0].trim();
  const headerRegex = /^([a-zA-Z0-9_]+)\[(\d+)\]\{([^}]*)\}:$/;
  const match = headerLine.match(headerRegex);

  if (!match) {
    return {
      success: false,
      error: 'Invalid TOON header format. Expected format: entityName[numRecords]{key1, key2}:',
    };
  }

  const entityName = match[1];
  const keysString = match[3];
  const keys = keysString
    ? keysString
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0)
    : [];

  const records: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseToonLine(line);

    if (values.length !== keys.length) {
      return {
        success: false,
        error: `Row ${i} has ${values.length} values, expected ${keys.length} based on header.`,
      };
    }

    const record: Record<string, unknown> = {};
    for (let j = 0; j < keys.length; j++) {
      record[keys[j]] = values[j];
    }
    records.push(record);
  }

  return {
    success: true,
    data: {
      entity: entityName,
      records,
    },
  };
}
