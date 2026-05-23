/**
 * Turn an awkward filename into a nice human-readable dataset name.
 *   "q3_sales_data.csv"          → "Q3 Sales Data"
 *   "northwind-orders-2024.xlsx" → "Northwind Orders 2024"
 *   "REPORT  final.xlsx"         → "Report Final"
 *
 * Edge cases preserved as-is rather than over-engineered:
 *   - Acronyms are not preserved (USA → Usa). User can edit before saving.
 *   - Numbers stay attached to the adjacent word (q3 → Q3, not Q 3).
 */
export function nameFromFilename(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, '');
  const normalized = base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return 'Untitled';
  return normalized
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
