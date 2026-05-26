import { TrendingUp } from 'lucide-react';
import { aggregate, AGGREGATION_LABELS, type AggregationFn } from '@/lib/aggregations';
import { formatNumber } from '@/lib/utils';
import type { EffectiveColumn } from '@/lib/apply-overrides';

interface KPICardProps {
  rows: Record<string, unknown>[];
  column: EffectiveColumn | null;
  aggregation: AggregationFn;
  title?: string;
}

function formatBig(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  if (Number.isInteger(n)) return formatNumber(n);
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function KPICard({ rows, column, aggregation, title }: KPICardProps) {
  if (!column) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        <div>
          <TrendingUp className="mx-auto mb-2 h-8 w-8 opacity-40" />
          Pick a column in the properties pane to build a KPI card.
        </div>
      </div>
    );
  }

  const values = rows.map((r) => r[column.name]);
  const value = aggregate(values, aggregation);
  const exactFormatted =
    Number.isInteger(value) ? formatNumber(value) : value.toLocaleString(undefined, { maximumFractionDigits: 4 });

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-8">
      <div className="text-center">
        {title && (
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
        )}
        <p
          className="text-6xl font-semibold tracking-tight tabular-nums text-foreground sm:text-7xl"
          title={exactFormatted}
        >
          {formatBig(value)}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {AGGREGATION_LABELS[aggregation]} of{' '}
          <span className="font-medium text-foreground">{column.displayName}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatNumber(rows.length)} row{rows.length === 1 ? '' : 's'} included
        </p>
      </div>
    </div>
  );
}
