export interface ParsedDataset {
  /** Column names in order they appear */
  columns: string[];
  /** Rows as plain objects keyed by column name. Values left as strings for now; type detection ships Day 4. */
  rows: Record<string, unknown>[];
  /** Total row count (same as rows.length, but exposed explicitly for clarity) */
  rowCount: number;
  /**
   * Non-fatal advisories surfaced during parsing. The caller decides how
   * to display these (toast, banner, etc). Examples:
   *   - "Workbook has 3 sheets; only the first ('Q1 Sales') was imported"
   *   - "Row 47 had a mismatched column count; treated as best-effort"
   */
  warnings?: string[];
}

export class ParseError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ParseError';
  }
}
