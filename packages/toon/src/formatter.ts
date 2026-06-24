/**
 * Formats an array of objects into a TOON (Token-Oriented Object Notation) string.
 *
 * @param entityName - The name of the entity being formatted (e.g., 'Users', 'Products').
 * @param records - An array of generic objects to format.
 * @returns The formatted TOON string.
 */
export function formatToon(entityName: string, records?: Record<string, any>[] | null): string {
  // Handle empty or null array
  if (!records || records.length === 0) {
    return `${entityName}[0]{}:\n`;
  }

  // Extract all unique keys present in the records for robustness
  const keySet = new Set<string>();
  for (const record of records) {
    if (record && typeof record === 'object') {
      Object.keys(record).forEach(key => keySet.add(key));
    }
  }

  const keys = Array.from(keySet);
  const numRecords = records.length;

  // Build the header line (Line 1)
  let toonString = `${entityName}[${numRecords}]{${keys.join(', ')}}:\n`;

  // Build the subsequent lines
  for (const record of records) {
    const values = keys.map(key => {
      const value = record ? record[key] : undefined;
      
      // If the value is a string, wrap it in double quotes and escape it
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      
      // Handle null or undefined values
      if (value === null || value === undefined) {
        return "null";
      }

      // Handle nested objects or arrays (fallback)
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }

      // Other types (numbers, booleans)
      return String(value);
    });

    // 2-space indentation
    toonString += `  ${values.join(', ')}\n`;
  }

  return toonString;
}
