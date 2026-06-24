import { ToonParseResult, ToonObject } from './types';

/**
 * Parses a TOON string into an object.
 * 
 * @param input - The TOON formatted string to parse.
 * @returns The parsed result containing either the data or an error description.
 */
export function parseToon(input: string): ToonParseResult {
  if (!input || typeof input !== 'string') {
    return { success: false, error: "Input is not a valid string." };
  }

  const lines = input.trim().split('\n');
  if (lines.length === 0) {
    return { success: false, error: "Empty input." };
  }

  const headerLine = lines[0].trim();
  // Regex to match entityName[numRecords]{key1, key2}:
  const headerRegex = /^([a-zA-Z0-9_]+)\[(\d+)\]\{([^}]*)\}:$/;
  const match = headerLine.match(headerRegex);

  if (!match) {
    return { success: false, error: "Invalid TOON header format. Expected format: entityName[numRecords]{key1, key2}:" };
  }

  const entityName = match[1];
  const keysString = match[3];
  const keys = keysString ? keysString.split(',').map(k => k.trim()).filter(k => k.length > 0) : [];

  const records: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseToonLine(line);
    
    if (values.length !== keys.length) {
      return { success: false, error: `Row ${i} has ${values.length} values, expected ${keys.length} based on header.` };
    }

    const record: Record<string, any> = {};
    for (let j = 0; j < keys.length; j++) {
      record[keys[j]] = values[j];
    }
    records.push(record);
  }

  return {
    success: true,
    data: {
      entity: entityName,
      records: records
    }
  };
}

/**
 * Robust helper to read comma-separated values of a TOON line.
 * Removes quotes and handles escape characters for strings.
 */
function parseToonLine(line: string): any[] {
  const result: any[] = [];
  let currentToken = '';
  let inQuotes = false;
  let escapeNext = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (escapeNext) {
      currentToken += char;
      escapeNext = false;
    } else if (char === '\\' && inQuotes) {
      escapeNext = true;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(parseValue(currentToken.trim()));
      currentToken = '';
    } else {
      currentToken += char;
    }
  }
  
  result.push(parseValue(currentToken.trim()));
  return result;
}

/**
 * Converts the token to TypeScript primitive types (null, boolean, number, or string).
 */
function parseValue(val: string): any {
  if (val === 'null') return null;
  if (val === 'undefined') return undefined;
  if (val === 'true') return true;
  if (val === 'false') return false;
  
  // Parse as number if it is one
  if (!isNaN(Number(val)) && val !== '') {
    return Number(val);
  }

  // Return as string, decoded from quotes
  return val;
}
