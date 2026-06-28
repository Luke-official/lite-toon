/**
 * Robust helper to read comma-separated values of a TOON line.
 * Removes quotes and handles escape characters for strings.
 */
export function parseToonLine(line: string): unknown[] {
  const result: unknown[] = [];
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
export function parseValue(val: string): unknown {
  if (val === 'null') return null;
  if (val === 'undefined') return undefined;
  if (val === 'true') return true;
  if (val === 'false') return false;

  if (!isNaN(Number(val)) && val !== '') {
    return Number(val);
  }

  return val;
}
