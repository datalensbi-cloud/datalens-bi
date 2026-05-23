import Papa from 'papaparse';
import { ParseError, type ParsedDataset } from './types';

/**
 * Parse a CSV file using PapaParse.
 * - Auto-detects delimiter (comma / semicolon / tab / pipe)
 * - Skips empty rows
 * - Keeps values as strings (type detection is Day 4)
 * - Uses Web Worker to keep UI responsive
 */
export function parseCSV(file: File): Promise<ParsedDataset> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      worker: true,
      complete: (results) => {
        const fatal = results.errors.filter(
          (e) => e.type === 'Delimiter' || e.type === 'FieldMismatch'
        );
        if (fatal.length > 0 && results.data.length === 0) {
          reject(new ParseError(`CSV parse failed: ${fatal[0]?.message ?? 'unknown error'}`));
          return;
        }
        const columns = results.meta.fields ?? [];
        if (columns.length === 0) {
          reject(new ParseError('CSV has no detectable columns. Is the first row a header?'));
          return;
        }
        resolve({
          columns,
          rows: results.data,
          rowCount: results.data.length,
        });
      },
      error: (err) => reject(new ParseError(`CSV parse failed: ${err.message}`, err)),
    });
  });
}
