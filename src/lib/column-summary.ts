import type { ColumnType } from './column-types';

export type ColumnSummary =
  | {
      type: 'number';
      min: number;
      max: number;
      avg: number;
      sum: number;
      nullCount: number;
      uniqueCount: number;
    }
  | {
      type: 'string';
      nullCount: number;
      uniqueCount: number;
      top5: Array<{ value: string; count: number }>;
    }
  | { type: 'date'; earliest: Date | null; latest: Date | null; nullCount: number }
  | { type: 'boolean'; trueCount: number; falseCount: number; nullCount: number };

function isNullish(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/,/g, '').trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseBool(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return null;
  const s = value.trim().toLowerCase();
  if (s === 'true' || s === 'yes') return true;
  if (s === 'false' || s === 'no') return false;
  return null;
}

export function calculateSummary(values: unknown[], type: ColumnType): ColumnSummary {
  if (type === 'number') {
    const nums: number[] = [];
    let nullCount = 0;
    const unique = new Set<number>();
    for (const v of values) {
      if (isNullish(v)) {
        nullCount++;
        continue;
      }
      const n = parseNumber(v);
      if (n !== null) {
        nums.push(n);
        unique.add(n);
      }
    }
    if (nums.length === 0) {
      return { type: 'number', min: 0, max: 0, avg: 0, sum: 0, nullCount, uniqueCount: 0 };
    }
    const sum = nums.reduce((a, b) => a + b, 0);
    return {
      type: 'number',
      min: Math.min(...nums),
      max: Math.max(...nums),
      sum,
      avg: sum / nums.length,
      nullCount,
      uniqueCount: unique.size,
    };
  }

  if (type === 'date') {
    let earliest: Date | null = null;
    let latest: Date | null = null;
    let nullCount = 0;
    for (const v of values) {
      if (isNullish(v)) {
        nullCount++;
        continue;
      }
      const d = parseDate(v);
      if (!d) continue;
      if (!earliest || d < earliest) earliest = d;
      if (!latest || d > latest) latest = d;
    }
    return { type: 'date', earliest, latest, nullCount };
  }

  if (type === 'boolean') {
    let trueCount = 0;
    let falseCount = 0;
    let nullCount = 0;
    for (const v of values) {
      if (isNullish(v)) {
        nullCount++;
        continue;
      }
      const b = parseBool(v);
      if (b === true) trueCount++;
      else if (b === false) falseCount++;
    }
    return { type: 'boolean', trueCount, falseCount, nullCount };
  }

  // string
  let nullCount = 0;
  const counts = new Map<string, number>();
  for (const v of values) {
    if (isNullish(v)) {
      nullCount++;
      continue;
    }
    const s = String(v);
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  const top5 = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([value, count]) => ({ value, count }));
  return { type: 'string', nullCount, uniqueCount: counts.size, top5 };
}
