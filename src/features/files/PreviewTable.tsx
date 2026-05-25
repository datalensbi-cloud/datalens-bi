import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ColumnType } from '@/lib/column-types';
import type { EffectiveColumn } from '@/lib/apply-overrides';
import { ColumnTypeBadge, PrimaryKeyBadge } from './ColumnTypeBadge';

interface PreviewTableProps {
  columns: EffectiveColumn[];
  rows: Record<string, unknown>[];
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
                aria-label={`${col.displayName} — ${col.effectiveType}${col.hasOverride ? ', has overrides' : ''}${col.isUnique ? ', primary key' : ''}. Click for column summary.`}
                className={cn(
                  'cursor-pointer select-none whitespace-nowrap border-b transition-colors hover:bg-muted',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                  selectedIndex === idx && 'bg-primary/10 hover:bg-primary/15'
                )}
              >
                <div className="flex items-center gap-2 py-1">
                  {col.hasOverride && <OverrideDot summary={col.overrideSummary} />}
                  <span className="font-medium text-foreground">{col.displayName}</span>
                  <ColumnTypeBadge type={col.effectiveType} />
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
                    col.effectiveType === 'number' && 'text-right'
                  )}
                >
                  {formatCell(row[col.name], col.effectiveType)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OverrideDot({ summary }: { summary: string[] }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
            aria-label="Column has overrides"
          />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="font-medium">Custom overrides</div>
          <ul className="mt-1 space-y-0.5 text-muted-foreground">
            {summary.map((s) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
