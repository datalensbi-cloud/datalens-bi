import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ColumnTypeBadge, PrimaryKeyBadge } from './ColumnTypeBadge';
import { calculateSummary, type ColumnSummary } from '@/lib/column-summary';
import { formatNumber } from '@/lib/utils';
import type { DetectedColumn } from '@/lib/column-types';

interface ColumnSummaryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: DetectedColumn | null;
  values: unknown[];
  totalRowCount: number;
}

export function ColumnSummaryPanel({
  open,
  onOpenChange,
  column,
  values,
  totalRowCount,
}: ColumnSummaryPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {column ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex flex-wrap items-center gap-2">
                <span className="text-lg">{column.name}</span>
                <ColumnTypeBadge type={column.type} />
                {column.isUnique && <PrimaryKeyBadge />}
              </SheetTitle>
              <SheetDescription>
                {column.type === 'string' && column.confidence === 0
                  ? 'No data in this column (all rows are empty).'
                  : `Detected as ${column.type}${column.confidence < 1 ? ` (${Math.round(column.confidence * 100)}% confidence)` : ''}.`}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6">
              <SummaryBody summary={calculateSummary(values, column.type)} totalRowCount={totalRowCount} />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function SummaryBody({
  summary,
  totalRowCount,
}: {
  summary: ColumnSummary;
  totalRowCount: number;
}) {
  if (summary.type === 'number') {
    return (
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
        <Stat label="Min" value={formatMaybeFraction(summary.min)} />
        <Stat label="Max" value={formatMaybeFraction(summary.max)} />
        <Stat label="Average" value={formatMaybeFraction(summary.avg)} />
        <Stat label="Sum" value={formatMaybeFraction(summary.sum)} />
        <Stat label="Null count" value={`${formatNumber(summary.nullCount)} (${pct(summary.nullCount, totalRowCount)})`} />
        <Stat label="Unique" value={formatNumber(summary.uniqueCount)} />
      </dl>
    );
  }

  if (summary.type === 'date') {
    return (
      <dl className="grid grid-cols-1 gap-y-4">
        <Stat
          label="Earliest"
          value={summary.earliest ? summary.earliest.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
        />
        <Stat
          label="Latest"
          value={summary.latest ? summary.latest.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
        />
        <Stat label="Null count" value={`${formatNumber(summary.nullCount)} (${pct(summary.nullCount, totalRowCount)})`} />
      </dl>
    );
  }

  if (summary.type === 'boolean') {
    return (
      <dl className="grid grid-cols-3 gap-x-4 gap-y-4">
        <Stat label="True" value={formatNumber(summary.trueCount)} />
        <Stat label="False" value={formatNumber(summary.falseCount)} />
        <Stat label="Null" value={`${formatNumber(summary.nullCount)} (${pct(summary.nullCount, totalRowCount)})`} />
      </dl>
    );
  }

  // string
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
        <Stat label="Unique values" value={formatNumber(summary.uniqueCount)} />
        <Stat label="Null count" value={`${formatNumber(summary.nullCount)} (${pct(summary.nullCount, totalRowCount)})`} />
      </dl>

      {summary.top5.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Top values
          </p>
          <TopValueBars top5={summary.top5} totalRowCount={totalRowCount} />
        </div>
      )}
    </div>
  );
}

function TopValueBars({
  top5,
  totalRowCount,
}: {
  top5: Array<{ value: string; count: number }>;
  totalRowCount: number;
}) {
  const max = Math.max(...top5.map((v) => v.count), 1);
  return (
    <ul className="space-y-2">
      {top5.map((v) => (
        <li key={v.value}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="truncate text-sm" title={v.value}>
              {v.value || <span className="text-muted-foreground italic">(empty)</span>}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {formatNumber(v.count)} ({pct(v.count, totalRowCount)})
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(v.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function formatMaybeFraction(n: number): string {
  if (Number.isInteger(n)) return formatNumber(n);
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function pct(count: number, total: number): string {
  if (total === 0) return '0%';
  return `${((count / total) * 100).toFixed(1)}%`;
}
