import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ColumnType, DetectedColumn } from '@/lib/column-types';
import { ColumnTypeBadge, PrimaryKeyBadge } from './ColumnTypeBadge';

interface PreviewTableProps {
  columns: DetectedColumn[];
  rows: Record<string, unknown>[];
  /** Index of the selected column, or null if none */
  selectedIndex: number | null;
  onSelectColumn: (index: number) => void;
}

function formatCell(value: unknown, type: ColumnType): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground/40">—</span>;
  }
  if (type === 'number') {
    const n =
      typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim());
    return Number.isFinite(n) ? (
      <span className="tabular-nums">{n.toLocaleString()}</span>
    ) : (
      String(value)
    );
  }
  if (type === 'date') {
    const d = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(d.getTime())
      ? String(value)
      : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (type === 'boolean') {
    const s = String(value).toLowerCase().trim();
    if (s === 'true' || s === 'yes') return 'Yes';
    if (s === 'false' || s === 'no') return 'No';
    return String(value);
  }
  return String(value);
}

export function PreviewTable({ columns, rows, selectedIndex, onSelectColumn }: PreviewTableProps) {
  return (
    <div className="overflow-auto rounded-lg border bg-background">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
          <TableRow>
            {columns.map((col, idx) => (
              <TableHead
                key={col.name}
                onClick={() => onSelectColumn(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectColumn(idx);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={selectedIndex === idx}
                aria-label={`${col.name} — ${col.type}${col.isUnique ? ', primary key' : ''}. Click for column summary.`}
                className={cn(
                  'cursor-pointer select-none whitespace-nowrap border-b transition-colors hover:bg-muted',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                  selectedIndex === idx && 'bg-primary/10 hover:bg-primary/15'
                )}
              >
                <div className="flex items-center gap-2 py-1">
                  <span className="font-medium text-foreground">{col.name}</span>
                  <ColumnTypeBadge type={col.type} />
                  {col.isUnique && <PrimaryKeyBadge />}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIdx) => (
            <TableRow key={rowIdx}>
              {columns.map((col, colIdx) => (
                <TableCell
                  key={col.name}
                  className={cn(
                    'whitespace-nowrap',
                    selectedIndex === colIdx && 'bg-primary/5',
                    col.type === 'number' && 'text-right'
                  )}
                >
                  {formatCell(row[col.name], col.type)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
