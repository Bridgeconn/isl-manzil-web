// T = parsed CSV row type
// E = API existing row type (after normalizeViewRows)
export interface BatchProcessOptions<T, E> {
    csvRows: T[];
    existingRows: E[];
    compareKeys: (keyof T | string)[];
    identityKey: keyof E;
    normalizeCsv?: (row: T) => T;
    normalizeApi?: (row: E) => E;
  }
  
  export interface BatchMatch<T, E> {
    existing: E;
    incoming: T;
    identityKey: string;
    identityValue: any;
  }
  
  export interface BatchProcessResult<T, E> {
    newRows: T[];
    matchedRows: BatchMatch<T, E>[];
  }
  
  export function batchProcess<T, E>({
    csvRows,
    existingRows,
    compareKeys,
    identityKey,
    normalizeCsv = (r) => r,
    normalizeApi = (r) => r,
  }: BatchProcessOptions<T, E>): BatchProcessResult<T, E> {
    const csv = csvRows.map(normalizeCsv);
    const existing = existingRows.map(normalizeApi);
  
    const makeKey = (obj: any) =>
      compareKeys
        .map((k) =>
          String(obj?.[k] ?? "")
            .trim()
            .toLowerCase()
        )
        .join("__");
  
    // Group CSV rows by compareKey
    const groupedCsv = new Map<string, T[]>();
    for (const r of csv) {
      const k = makeKey(r);
      if (!groupedCsv.has(k)) groupedCsv.set(k, []);
      groupedCsv.get(k)!.push(r);
    }
  
    // Group existing rows by compareKey
    const groupedExisting = new Map<string, E[]>();
    for (const r of existing) {
      const k = makeKey(r);
      if (!groupedExisting.has(k)) groupedExisting.set(k, []);
      groupedExisting.get(k)!.push(r);
    }
  
    const newRows: T[] = [];
    const matchedRows: BatchMatch<T, E>[] = [];
  
    // Match by position within each group
    for (const [key, csvGroup] of groupedCsv.entries()) {
      const existingGroup = groupedExisting.get(key) ?? [];
  
      // Match CSV rows to existing rows by position (index)
      for (let i = 0; i < csvGroup.length; i++) {
        if (i < existingGroup.length) {
          // Match exists at this position
          matchedRows.push({
            existing: existingGroup[i],
            incoming: csvGroup[i],
            identityKey: identityKey as string,
            identityValue: existingGroup[i][identityKey],
          });
        } else {
          // No existing row at this position = new row
          newRows.push(csvGroup[i]);
        }
      }
    }
  
    return { newRows, matchedRows };
  }