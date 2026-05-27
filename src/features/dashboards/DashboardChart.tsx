import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';

import { getChart } from '@/lib/charts';
import { getDataset } from '@/lib/datasets';
import { downloadParsedJSON } from '@/lib/storage';
import { detectColumns } from '@/lib/column-types';
import { applyOverrides, applyNullStrategies } from '@/lib/apply-overrides';
import { applyFilters } from '@/lib/filters';
import { buildChartOption } from '@/lib/build-chart-option';
import { EChartsChart } from '@/components/ui/echarts-chart';
import { PivotTable } from '@/features/charts/PivotTable';
import { KPICard } from '@/features/charts/KPICard';

interface ParsedFile {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

/**
 * Reusable embedded chart renderer — given just a chart_id, fetches everything
 * needed (chart row, dataset row, parsed JSON) and renders the chart inline.
 *
 * TanStack Query caches dataset + parsed JSON across the dashboard, so two
 * charts on the same dataset only download once.
 */
export function DashboardChart({ chartId }: { chartId: string }) {
  const { data: chart, isLoading: chartLoading, error: chartError } = useQuery({
    queryKey: ['chart', chartId],
    queryFn: () => getChart(chartId),
  });

  const { data: dataset, isLoading: datasetLoading } = useQuery({
    queryKey: ['dataset', chart?.dataset_id],
    queryFn: () => (chart ? getDataset(chart.dataset_id) : Promise.resolve(null)),
    enabled: !!chart,
  });

  const { data: parsed, isLoading: parsedLoading } = useQuery({
    queryKey: ['dataset-parsed', dataset?.id, dataset?.parsed_path],
    queryFn: () =>
      dataset?.parsed_path
        ? downloadParsedJSON<ParsedFile>(dataset.parsed_path)
        : Promise.resolve(null),
    enabled: !!dataset?.parsed_path,
  });

  const effectiveColumns = useMemo(() => {
    if (!parsed || !dataset) return [];
    const detected = detectColumns(parsed.columns, parsed.rows);
    return applyOverrides(detected, dataset.column_overrides ?? {});
  }, [parsed, dataset]);

  const processedRows = useMemo(() => {
    if (!parsed) return [];
    const nullCleaned = applyNullStrategies(parsed.rows, effectiveColumns);
    return applyFilters(nullCleaned, chart?.config.filters ?? []);
  }, [parsed, effectiveColumns, chart]);

  const echartsOption = useMemo(() => {
    if (!chart) return null;
    return buildChartOption({
      chartType: chart.chart_type,
      config: chart.config,
      columns: effectiveColumns,
      rows: processedRows,
    });
  }, [chart, effectiveColumns, processedRows]);

  if (chartError) {
    return <ErrorBox message="Chart not found" />;
  }

  if (chartLoading || datasetLoading || parsedLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (!chart) return <ErrorBox message="Chart unavailable" />;

  return (
    <div className="flex h-full flex-col">
      {chart.name && (
        <div className="border-b px-3 py-1.5 text-sm font-medium truncate" title={chart.name}>
          {chart.name}
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        {chart.chart_type === 'pivot' ? (
          <PivotTable
            rows={processedRows}
            config={{
              rowField: chart.config.pivotRow,
              colField: chart.config.pivotCol,
              valueField: chart.config.pivotValue,
              aggregation: chart.config.pivotAggregation ?? 'SUM',
            }}
            showTotals={chart.config.pivotShowTotals ?? true}
          />
        ) : chart.chart_type === 'kpi' ? (
          <KPICard
            rows={processedRows}
            column={effectiveColumns.find((c) => c.name === chart.config.kpiColumn) ?? null}
            aggregation={chart.config.kpiAggregation ?? 'SUM'}
            title={chart.config.title || chart.name}
          />
        ) : echartsOption ? (
          <EChartsChart option={echartsOption} ariaLabel={chart.name} />
        ) : (
          <ErrorBox message="Chart config incomplete" />
        )}
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
      <AlertCircle className="h-4 w-4" />
      {message}
    </div>
  );
}
