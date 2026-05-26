/**
 * Filter engine — applies a list of FilterConditions to a row set.
 * Used by both chart and pivot rendering paths.
 */

export type FilterOp =
  /** Multi-select equality — value is string[] */
  | 'in'
  /** Numeric range — value is { min?, max? } */
  | 'between'
  /** Date range — value is { from?, to? } (ISO strings) */
  | 'date_between'
  /** Contains substring — value is string (case-insensitive) */
  | 'contains'
  /** Is null/empty */
  | 'is_null'
  /** Is not null */
  | 'is_not_null';

export interface FilterCondition {
  /** Column name to filter on */
  column: string;
  op: FilterOp;
  /** Operand for the operation (shape depends on op) */
  value?: unknown;
}

function isNullish(v: unknown): boolean {
  return v === null || v === undefined || v === '';
}

function parseNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const n = Number(v.replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function parseDate(v: unknown): number | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getTime();
  if (typeof v !== 'string') return null;
  const ms = new Date(v).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function matchesCondition(row: Record<string, unknown>, cond: FilterCondition): boolean {
  const cell = row[cond.column];

  switch (cond.op) {
    case 'is_null':
      return isNullish(cell);
    case 'is_not_null':
      return !isNullish(cell);

    case 'in': {
      if (isNullish(cell)) return false;
      const list = Array.isArray(cond.value) ? cond.value : [];
      if (list.length === 0) return true; // empty filter list = no filtering
      return list.some((v) => String(v) === String(cell));
    }

    case 'contains': {
      const needle = String(cond.value ?? '').toLowerCase();
      if (!needle) return true;
      if (isNullish(cell)) return false;
      return String(cell).toLowerCase().includes(needle);
    }

    case 'between': {
      const n = parseNumber(cell);
      if (n === null) return false;
      const range = (cond.value ?? {}) as { min?: number; max?: number };
      if (range.min != null && n < range.min) return false;
      if (range.max != null && n > range.max) return false;
      return true;
    }

    case 'date_between': {
      const ms = parseDate(cell);
      if (ms === null) return false;
      const range = (cond.value ?? {}) as { from?: string; to?: string };
      if (range.from) {
        const fromMs = new Date(range.from).getTime();
        if (!Number.isNaN(fromMs) && ms < fromMs) return false;
      }
      if (range.to) {
        const toMs = new Date(range.to).getTime();
        if (!Number.isNaN(toMs) && ms > toMs) return false;
      }
      return true;
    }
  }
}

/**
 * Apply all filter conditions to a row set. Conditions AND together.
 * Returns a new array; never mutates input.
 */
export function applyFilters(
  rows: Record<string, unknown>[],
  conditions: FilterCondition[]
): Record<string, unknown>[] {
  if (!conditions || conditions.length === 0) return rows;
  return rows.filter((row) => conditions.every((c) => matchesCondition(row, c)));
}
