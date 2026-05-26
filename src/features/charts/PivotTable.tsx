import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buildPivot, type PivotConfig } from '@/lib/build-pivot';
import { cn, formatNumber } from '@/lib/utils';

interface PivotTableProps {
  rows: Record<string, unknown>[];
  config: PivotConfig;
  showTotals?: boolean;
}

function formatCell(n: number): string {
  if (Number.isInteger(n)) return formatNumber(n);
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function PivotTable({ rows, config, showTotals = true }: PivotTableProps) {
  const pivot = buildPivot(rows, config);

  if (pivot.rowKeys.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        Pick Row + Value (and optionally Column) in the properties pane to build a pivot.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto rounded-lg border bg-background">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
          <TableRow>
            <TableHead className="sticky left-0 z-20 border-r bg-muted/95 font-semibold">
              {config.rowField}
            </TableHead>
            {pivot.colKeys.map((ck) => (
              <TableHead key={ck} className="text-right font-medium">
                {ck === '∅' ? <span className="italic text-muted-foreground">(empty)</span> : ck}
              </TableHead>
            ))}
            {showTotals && pivot.colKeys.length > 1 && (
              <TableHead className="text-right font-semibold">Total</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pivot.rowKeys.map((rk, rIdx) => (
            <TableRow key={rk}>
              <TableCell className="sticky left-0 border-r bg-background font-medium">
                {rk === '∅' ? <span className="italic text-muted-foreground">(empty)</span> : rk}
              </TableCell>
              {pivot.colKeys.map((_, cIdx) => (
                <TableCell key={cIdx} className="text-right tabular-nums">
                  {formatCell(pivot.cells[rIdx]![cIdx]!)}
                </TableCell>
              ))}
              {showTotals && pivot.colKeys.length > 1 && (
                <TableCell className={cn('text-right font-semibold tabular-nums', 'bg-muted/40')}>
                  {formatCell(pivot.rowTotals[rIdx]!)}
                </TableCell>
              )}
            </TableRow>
          ))}
          {showTotals && (
            <TableRow className="bg-muted/40 font-semibold">
              <TableCell className="sticky left-0 border-r bg-muted/40">Total</TableCell>
              {pivot.colTotals.map((t, cIdx) => (
                <TableCell key={cIdx} className="text-right tabular-nums">
                  {formatCell(t)}
                </TableCell>
              ))}
              {pivot.colKeys.length > 1 && (
                <TableCell className="text-right tabular-nums">
                  {formatCell(pivot.grandTotal)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
