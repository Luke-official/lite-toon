/**
 * Formats an array of objects into a TOON (Token-Oriented Object Notation) string.
 *
 * @param entityName - The name of the entity being formatted (e.g., 'Users', 'Products').
 * @param records - An array of generic objects to format.
 * @returns The formatted TOON string.
 */
export function formatToon(entityName: string, records?: Record<string, unknown>[] | null): string {
  if (!records || records.length === 0) {
    return `${entityName}[0]{}:\n`;
  }

  const keySet = new Set<string>();
  for (const record of records) {
    if (record && typeof record === 'object') {
      Object.keys(record).forEach((key) => keySet.add(key));
    }
  }

  const keys = Array.from(keySet);
  const lines: string[] = [`${entityName}[${records.length}]{${keys.join(', ')}}:\n`];

  for (const record of records) {
    const values = keys.map((key) => {
      const value = record ? record[key] : undefined;

      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '\\"')}"`;
      }

      if (value === null || value === undefined) {
        return 'null';
      }

      if (typeof value === 'object') {
        return JSON.stringify(value);
      }

      return String(value);
    });

    lines.push(`  ${values.join(', ')}\n`);
  }

  return lines.join('');
}
