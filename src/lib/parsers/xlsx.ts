import * as XLSX from 'xlsx';
import { ParseError, type ParsedDataset } from './types';

/**
 * Parse an .xlsx or .xls file using SheetJS.
 * - Reads only the first sheet (multi-sheet support is Phase 2)
 * - Empty cells preserved as null
 * - Cell types not coerced yet (Day 4 work)
 */
export async function parseXLSX(file: File): Promise<ParsedDataset> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new ParseError('Excel file has no sheets.');
    }
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) {
      throw new ParseError('Excel file appears empty.');
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
    if (rows.length === 0) {
      throw new ParseError('Excel sheet has no data rows.');
    }
    const columns = Object.keys(rows[0] ?? {});
    if (columns.length === 0) {
      throw new ParseError('Excel sheet has no detectable columns.');
    }

    // Surface multi-sheet workbooks as a non-fatal warning so the user
    // knows we only imported sheet 1. Full multi-sheet picker is Phase 2.
    const warnings: string[] = [];
    if (workbook.SheetNames.length > 1) {
      const otherSheets = workbook.SheetNames.slice(1);
      const preview =
        otherSheets.length <= 3
          ? otherSheets.map((s) => `"${s}"`).join(', ')
          : `${otherSheets.slice(0, 3).map((s) => `"${s}"`).join(', ')} +${otherSheets.length - 3} more`;
      warnings.push(
        `Workbook has ${workbook.SheetNames.length} sheets; only "${firstSheetName}" was imported. Other sheets (${preview}) ignored. Multi-sheet picker coming in Phase 2.`
      );
    }

    return { columns, rows, rowCount: rows.length, warnings };
  } catch (err) {
    if (err instanceof ParseError) throw err;
    throw new ParseError(
      err instanceof Error ? `Excel parse failed: ${err.message}` : 'Excel parse failed',
      err
    );
  }
}
