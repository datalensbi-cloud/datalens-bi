import type { EChartsOption } from 'echarts';
import type { ChartConfig, ChartType } from '@/types/supabase';
import type { EffectiveColumn } from './apply-overrides';
import { aggregate, type AggregationFn } from './aggregations';
import { applyFilters } from './filters';

/**
 * Color palette — single default for v1. Day 6.5 polish adds a picker.
 * These are the Tableau 10 colors, popular for being colorblind-friendly.
 */
export const DEFAULT_PALETTE = [
  '#4f46e5', // indigo (primary brand)
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
];

function parseNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const n = Number(v.replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function formatLabel(value: unknown): string {
  if (value === null || value === undefined || value === '') return '(empty)';
  if (value instanceof Date) {
    return value.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return String(value);
}

/**
 * Aggregate rows by X column using the chosen aggregation function.
 * Uses the lib/aggregations engine so all chart types share one path.
 */
function aggregateByX(
  rows: Record<string, unknown>[],
  xCol: string,
  yCol: string,
  fn: AggregationFn
): Array<{ x: string; y: number }> {
  const buckets = new Map<string, unknown[]>();
  for (const row of rows) {
    const xKey = formatLabel(row[xCol]);
    const list = buckets.get(xKey);
    if (list) list.push(row[yCol]);
    else buckets.set(xKey, [row[yCol]]);
  }
  return Array.from(buckets.entries()).map(([x, values]) => ({
    x,
    y: aggregate(values, fn),
  }));
}

interface BuildOptionParams {
  chartType: ChartType;
  config: ChartConfig;
  columns: EffectiveColumn[];
  rows: Record<string, unknown>[];
}

/**
 * Convert dataset + chart config → an ECharts option object.
 * Returns null if config is incomplete (no x or y selected).
 */
export function buildChartOption({
  chartType,
  config,
  columns,
  rows: rawRows,
}: BuildOptionParams): EChartsOption | null {
  // Pivot and KPI render via dedicated components, not ECharts.
  if (chartType === 'pivot' || chartType === 'kpi') return null;
  if (!config.x || !config.y) return null;

  // Apply chart-level filters before aggregation
  const rows = applyFilters(rawRows, config.filters ?? []);

  const xCol = columns.find((c) => c.name === config.x);
  const yCol = columns.find((c) => c.name === config.y);
  if (!xCol || !yCol) return null;

  const aggFn: AggregationFn = config.aggregation ?? 'SUM';

  const xLabel = config.xAxisLabel ?? xCol.displayName;
  const yLabel = config.yAxisLabel ?? yCol.displayName;
  const title = config.title?.trim() || undefined;

  const baseOption: EChartsOption = {
    color: DEFAULT_PALETTE,
    title: title
      ? {
          text: title,
          left: 'left',
          textStyle: { fontWeight: 500, fontSize: 16 },
        }
      : undefined,
    tooltip: { trigger: chartType === 'pie' ? 'item' : 'axis' },
    grid: { top: title ? 50 : 24, left: 60, right: 30, bottom: 50, containLabel: true },
    animationDuration: 300,
  };

  if (chartType === 'pie') {
    const agg = aggregateByX(rows, config.x, config.y, aggFn);
    return {
      ...baseOption,
      grid: undefined,
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          data: agg.map((d) => ({ name: d.x, value: d.y })),
          label: { formatter: '{b}: {d}%' },
        },
      ],
    };
  }

  if (chartType === 'scatter') {
    // Scatter expects raw [x, y] number pairs — no aggregation
    const points: [number, number][] = [];
    for (const row of rows) {
      const xn = parseNumber(row[config.x]);
      const yn = parseNumber(row[config.y]);
      if (xn !== null && yn !== null) points.push([xn, yn]);
    }
    return {
      ...baseOption,
      xAxis: { type: 'value', name: xLabel, nameLocation: 'middle', nameGap: 30 },
      yAxis: { type: 'value', name: yLabel, nameLocation: 'middle', nameGap: 45 },
      series: [
        {
          type: 'scatter',
          data: points,
          symbolSize: 8,
        },
      ],
    };
  }

  // bar or line (narrowed; pie/scatter/pivot/kpi handled above)
  const barOrLine: 'bar' | 'line' = chartType === 'line' ? 'line' : 'bar';
  const agg = aggregateByX(rows, config.x, config.y, aggFn);
  return {
    ...baseOption,
    xAxis: {
      type: 'category',
      data: agg.map((d) => d.x),
      name: xLabel,
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: { rotate: agg.length > 8 ? 30 : 0, interval: 0 },
    },
    yAxis: {
      type: 'value',
      name: yLabel,
      nameLocation: 'middle',
      nameGap: 50,
    },
    series: [
      {
        type: barOrLine,
        data: agg.map((d) => d.y),
        smooth: barOrLine === 'line',
        showSymbol: barOrLine === 'line',
      },
    ],
  };
}
