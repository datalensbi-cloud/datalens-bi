/**
 * Aggregation engine — pure functions for combining values.
 *
 * Used by:
 *   - build-chart-option.ts  (bar/line/pie/scatter Y aggregation)
 *   - build-pivot.ts         (pivot cell aggregation)
 */

export type AggregationFn =
  | 'SUM'
  | 'AVG'
  | 'COUNT'
  | 'COUNT_DISTINCT'
  | 'MIN'
  | 'MAX';

export const AGGREGATION_LABELS: Record<AggregationFn, string> = {
  SUM: 'Sum',
  AVG: 'Average',
  COUNT: 'Count',
  COUNT_DISTINCT: 'Count distinct',
  MIN: 'Minimum',
  MAX: 'Maximum',
};

/** Aggregations that produce a number — needed for numeric Y axis. */
export const NUMERIC_AGGREGATIONS: AggregationFn[] = [
  'SUM',
  'AVG',
  'COUNT',
  'COUNT_DISTINCT',
  'MIN',
  'MAX',
];

/** Aggregations valid for non-numeric columns (text, date, boolean). */
export const NON_NUMERIC_AGGREGATIONS: AggregationFn[] = ['COUNT', 'COUNT_DISTINCT'];

function parseNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const n = Number(v.replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function isNullish(v: unknown): boolean {
  return v === null || v === undefined || v === '';
}

/**
 * Apply an aggregation to a list of raw values.
 * Returns 0 for empty inputs (matches Excel pivot behavior).
 */
export function aggregate(values: unknown[], fn: AggregationFn): number {
  if (fn === 'COUNT') {
    // Non-null count (Excel COUNTA)
    let n = 0;
    for (const v of values) if (!isNullish(v)) n++;
    return n;
  }

  if (fn === 'COUNT_DISTINCT') {
    const seen = new Set<unknown>();
    for (const v of values) if (!isNullish(v)) seen.add(v);
    return seen.size;
  }

  // Numeric aggregations — parse, skip non-numeric/null
  let sum = 0;
  let count = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    const n = parseNumber(v);
    if (n === null) continue;
    sum += n;
    count++;
    if (n < min) min = n;
    if (n > max) max = n;
  }
  if (count === 0) return 0;

  switch (fn) {
    case 'SUM':
      return sum;
    case 'AVG':
      return sum / count;
    case 'MIN':
      return min;
    case 'MAX':
      return max;
  }
}

/**
 * Group rows by a column value and aggregate another column.
 * Returns: [{ key, value }] preserving first-seen group order.
 *
 * Used for bar/line/pie chart data:
 *   groupAndAggregate(rows, 'category', 'amount', 'SUM')
 *   → [{ key: 'Electronics', value: 12345 }, ...]
 */
export function groupAndAggregate(
  rows: Record<string, unknown>[],
  groupBy: string,
  valueColumn: string,
  fn: AggregationFn
): Array<{ key: unknown; value: number }> {
  const buckets = new Map<string, { keyRaw: unknown; values: unknown[] }>();
  for (const row of rows) {
    const rawKey = row[groupBy];
    const key = rawKey == null ? '∅' : String(rawKey);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.values.push(row[valueColumn]);
    } else {
      buckets.set(key, { keyRaw: rawKey, values: [row[valueColumn]] });
    }
  }
  return Array.from(buckets.values()).map((b) => ({
    key: b.keyRaw,
    value: aggregate(b.values, fn),
  }));
}
