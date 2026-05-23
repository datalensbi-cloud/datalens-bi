import { parseCSV } from './csv';
import { parseXLSX } from './xlsx';
import { ParseError, type ParsedDataset } from './types';

export { ParseError };
export type { ParsedDataset };

const CSV_EXTENSIONS = new Set(['csv', 'tsv']);
const XLSX_EXTENSIONS = new Set(['xlsx', 'xls']);

export function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : '';
}

export function isSupportedFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return CSV_EXTENSIONS.has(ext) || XLSX_EXTENSIONS.has(ext);
}

export async function parseFile(file: File): Promise<ParsedDataset> {
  const ext = getFileExtension(file.name);
  if (CSV_EXTENSIONS.has(ext)) return parseCSV(file);
  if (XLSX_EXTENSIONS.has(ext)) return parseXLSX(file);
  throw new ParseError(`Unsupported file type: .${ext}. Use .csv or .xlsx.`);
}
