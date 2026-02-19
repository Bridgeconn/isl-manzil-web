/**
 * Finds duplicate row groups based on the given compareKeys.
 * 
 * Example:
 *   compareKeys = ["book", "title"]
 *   If two or more rows have the same (book + title) pair → they are grouped as duplicates.
 *
 * @param rows - Parsed CSV rows (array of objects)
 * @param compareKeys - Keys used to determine uniqueness
 * @returns [{ key: string, values: T[] }]  // only groups where 2+ duplicates exist
 */
export function findDuplicateKeyGroups<T>(
    rows: T[],
    compareKeys: (keyof T | string)[]
  ) {
    // Map<uniqueKeyString, array of rows sharing that key>
    const map = new Map<string, T[]>();
  
    // Builds a normalized string key for each row based on compareKeys
    const getKey = (row: T) =>
      compareKeys
        .map((k) =>
          String((row as any)[k] ?? "")
            .trim()
            .toLowerCase()
        )
        .join("__");       // combine values into a single unique lookup key
  
    // Store rows grouped by the generated compareKey
    rows.forEach((row) => {
      const key = getKey(row);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    });
  
    // Convert map → array format and return only groups having more than 1 row
    return [...map.entries()]
      .filter(([, vals]) => vals.length > 1) // keep only duplicates
      .map(([key, vals]) => ({
        key,     // the generated internal key
        values: vals, // the rows that are duplicates
      }));
  }
  