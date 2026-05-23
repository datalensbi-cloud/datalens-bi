/**
 * Conservative column type detection — 4 base types only (number/string/date/boolean).
 * Day 5 lets users override; Day 26 polish adds finer types (currency, %, email).
 *
 * Detection rule: a column is classified as a non-string type only if at least
 * 90% of its non-null values parse as that type. This keeps mostly-numeric
 * columns from being demoted to string by a few junk rows.
 */
export type ColumnType = 'number' | 'string' | 'date' | 'boolean';

export interface DetectedColumn {
  name: string;
  type: ColumnType;
  /** Confidence the type is correct, 0–1 */
  confidence: number;
  /** Count of null/empty values (informational; doesn't affect type classification) */
  nullCount: number;
  /**
   * True if the column has 100% unique non-null values AND every row is non-null.
   * Used to flag "likely primary key" columns for analysts.
   */
  isUnique: boolean;
}

const TYPE_CONFIDENCE_THRESHOLD = 0.9;

/** Strict boolean detection — only true/false/yes/no. NOT 0/1 (those are numbers). */
function looksBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return true;
  if (typeof value !== 'string') return false;
  const s = value.trim().toLowerCase();
  return s === 'true' || s === 'false' || s === 'yes' || s === 'no';
}

/** Numeric detection — handles thousands separators like "1,234.56" */
function looksNumeric(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'string') return false;
  const s = value.trim();
  if (s === '') return false;
  const cleaned = s.replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return false;
  const n = Number(cleaned);
  return Number.isFinite(n);
}

/**
 * Date detection — ISO 8601 + common locale formats.
 * Returns true only for strings/Dates that look unambiguously like dates;
 * we deliberately don't accept ambiguous strings like "1/2" or "12345".
 */
function looksDate(value: unknown): boolean {
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value !== 'string') return false;
  const s = value.trim();
  if (s.length < 6) return false;

  // ISO 8601: 2024-03-15, 2024-03-15T10:00:00Z, etc.
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return !Number.isNaN(new Date(s).getTime());
  }
  // Numeric date: 3/15/2024, 15/03/2024, 3-15-2024
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(s)) {
    const d = new Date(s);
    return !Number.isNaN(d.getTime()) && d.getFullYear() >= 1900 && d.getFullYear() <= 2100;
  }
  // Abbreviated month: Mar 15 2024, 15 Mar 2024, March 15, 2024
  if (/^[A-Za-z]{3,9}\s+\d{1,2}/.test(s) || /^\d{1,2}\s+[A-Za-z]{3,9}/.test(s)) {
    return !Number.isNaN(new Date(s).getTime());
  }
  return false;
}

function isNullish(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

/** Detect the type of a single column from its values. */
export function detectColumn(name: string, values: unknown[]): DetectedColumn {
  let nullCount = 0;
  let boolCount = 0;
  let dateCount = 0;
  let numCount = 0;
  const seen = new Set<string>();
  let hasDuplicate = false;

  for (const v of values) {
    if (isNullish(v)) {
      nullCount++;
      continue;
    }

    if (!hasDuplicate) {
      const key = String(v);
      if (seen.has(key)) hasDuplicate = true;
      else seen.add(key);
    }

    // Priority: boolean first (small space), then date, then number.
    // Order matters because "true" doesn't parse as a date, but stray
    // numeric-like strings shouldn't be misread as dates.
    if (looksBoolean(v)) {
      boolCount++;
    } else if (looksDate(v)) {
      dateCount++;
    } else if (looksNumeric(v)) {
      numCount++;
    }
  }

  const nonNull = values.length - nullCount;
  if (nonNull === 0) {
    return { name, type: 'string', confidence: 0, nullCount, isUnique: false };
  }

  const min = Math.ceil(nonNull * TYPE_CONFIDENCE_THRESHOLD);
  let type: ColumnType = 'string';
  let confidence = 1;

  if (boolCount >= min) {
    type = 'boolean';
    confidence = boolCount / nonNull;
  } else if (dateCount >= min) {
    type = 'date';
    confidence = dateCount / nonNull;
  } else if (numCount >= min) {
    type = 'number';
    confidence = numCount / nonNull;
  }

  // Primary-key heuristic: every row non-null AND every value unique.
  // We require >1 row so single-row datasets don't false-positive.
  const isUnique = nonNull > 1 && nullCount === 0 && !hasDuplicate;

  return { name, type, confidence, nullCount, isUnique };
}

/** Detect types for every column in a dataset. */
export function detectColumns(
  columnNames: string[],
  rows: Record<string, unknown>[]
): DetectedColumn[] {
  return columnNames.map((name) => {
    const values = rows.map((r) => r[name]);
    return detectColumn(name, values);
  });
}
