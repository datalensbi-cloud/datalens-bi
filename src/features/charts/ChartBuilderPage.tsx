import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BarChart3, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth/useAuth';
import { getDataset } from '@/lib/datasets';
import { getChart, insertChart, updateChart } from '@/lib/charts';
import { downloadParsedJSON } from '@/lib/storage';
import { detectColumns } from '@/lib/column-types';
import { applyOverrides, applyNullStrategies, type EffectiveColumn } from '@/lib/apply-overrides';
import { buildChartOption } from '@/lib/build-chart-option';
import { applyFilters } from '@/lib/filters';
import type { ChartType, ChartConfig, FilterCondition } from '@/types/supabase';
import { EChartsChart } from '@/components/ui/echarts-chart';
import { ColumnListPane } from './ColumnListPane';
import { AxisDropZone } from './AxisDropZone';
import { PropertiesPane } from './PropertiesPane';
import { FilterPanel } from './FilterPanel';
import { ExportMenu } from './ExportMenu';
import { PivotTable } from './PivotTable';
import { KPICard } from './KPICard';
import { ColumnTypeBadge } from '@/features/files/ColumnTypeBadge';

interface ParsedFile {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export function ChartBuilderPage() {
  const { user } = useAuth();
  const { chartId } = useParams<{ chartId?: string }>();
  const [searchParams] = useSearchParams();
  const datasetIdFromQuery = searchParams.get('dataset');
  const navigate = useNavigate();

  // Either editing an existing chart or creating from a dataset query param
  const editing = !!chartId;

  // ----- Data fetching -----

  const { data: existingChart, isLoading: chartLoading } = useQuery({
    queryKey: ['chart', chartId],
    queryFn: () => (chartId ? getChart(chartId) : Promise.resolve(null)),
    enabled: editing,
  });

  const datasetId = existingChart?.dataset_id ?? datasetIdFromQuery ?? null;

  const { data: dataset, isLoading: datasetLoading } = useQuery({
    queryKey: ['dataset', datasetId],
    queryFn: () => (datasetId ? getDataset(datasetId) : Promise.resolve(null)),
    enabled: !!datasetId,
  });

  const { data: parsed, isLoading: parsedLoading } = useQuery({
    queryKey: ['dataset-parsed', datasetId, dataset?.parsed_path],
    queryFn: () =>
      dataset?.parsed_path
        ? downloadParsedJSON<ParsedFile>(dataset.parsed_path)
        : Promise.resolve(null),
    enabled: !!dataset?.parsed_path,
  });

  // ----- Local builder state -----

  const [chartName, setChartName] = useState('Untitled chart');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [config, setConfig] = useState<ChartConfig>({});
  const [activeDragColumn, setActiveDragColumn] = useState<EffectiveColumn | null>(null);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Hydrate state from existing chart once it loads
  useEffect(() => {
    if (existingChart && editing) {
      setChartName(existingChart.name);
      setChartType(existingChart.chart_type);
      setConfig(existingChart.config ?? {});
    }
  }, [existingChart, editing]);

  // ----- Derived data -----

  const effectiveColumns = useMemo(() => {
    if (!parsed || !dataset) return [];
    const detected = detectColumns(parsed.columns, parsed.rows);
    return applyOverrides(detected, dataset.column_overrides ?? {});
  }, [parsed, dataset]);

  const processedRows = useMemo(() => {
    if (!parsed) return [];
    const nullCleaned = applyNullStrategies(parsed.rows, effectiveColumns);
    return applyFilters(nullCleaned, config.filters ?? []);
  }, [parsed, effectiveColumns, config.filters]);

  const xColumn = config.x ? effectiveColumns.find((c) => c.name === config.x) ?? null : null;
  const yColumn = config.y ? effectiveColumns.find((c) => c.name === config.y) ?? null : null;

  const echartsOption = useMemo(
    () => buildChartOption({ chartType, config, columns: effectiveColumns, rows: processedRows }),
    [chartType, config, effectiveColumns, processedRows]
  );

  // ----- Drag handling -----

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function handleDragStart(e: DragStartEvent) {
    const col = e.active.data.current?.column as EffectiveColumn | undefined;
    setActiveDragColumn(col ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDragColumn(null);
    if (!e.over) return;
    const col = e.active.data.current?.column as EffectiveColumn | undefined;
    if (!col) return;
    const zone = e.over.id as 'x' | 'y';
    setConfig((prev) => ({ ...prev, [zone]: col.name }));
  }

  // ----- Save -----

  async function handleSave() {
    if (!user || !datasetId) {
      toast.error('Missing user or dataset');
      return;
    }
    if (chartType === 'pivot') {
      if (!config.pivotRow || !config.pivotValue) {
        toast.error('Pivot needs at least a Row and a Value column.');
        return;
      }
    } else if (chartType !== 'kpi') {
      if (!config.x || !config.y) {
        toast.error('Set both X and Y axes before saving');
        return;
      }
    }
    const name = chartName.trim() || 'Untitled chart';
    setSaving(true);
    try {
      if (editing && chartId) {
        await updateChart(chartId, { name, chart_type: chartType, config });
        toast.success('Chart saved');
      } else {
        const created = await insertChart({
          user_id: user.id,
          dataset_id: datasetId,
          name,
          chart_type: chartType,
          config,
        });
        toast.success('Chart created');
        navigate(`/charts/${created.id}`, { replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  // ----- Render -----

  const isLoading = chartLoading || datasetLoading || parsedLoading;

  if (!datasetId && !chartLoading) {
    return (
      <ErrorState
        title="No dataset selected"
        message="Open the chart builder from a file's preview, or pick a dataset from the Files page."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!dataset || !parsed) {
    return (
      <ErrorState
        title="Couldn't load dataset"
        message="The file may have been deleted or you may not have access."
      />
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="-ml-3 text-muted-foreground">
              <Link to={`/files/${dataset.id}`}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to preview
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">from</span>
            <span className="text-sm font-medium">{dataset.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <FilterPanel
              columns={effectiveColumns}
              rows={parsed.rows}
              conditions={config.filters ?? []}
              onChange={(filters: FilterCondition[]) =>
                setConfig((c) => ({ ...c, filters: filters.length > 0 ? filters : undefined }))
              }
            />
            <ExportMenu
              chartName={chartName}
              chartType={chartType}
              config={config}
              columns={effectiveColumns}
              rows={processedRows}
              captureRef={canvasRef}
            />
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-1 h-4 w-4" />
              {saving ? 'Saving…' : editing ? 'Save chart' : 'Create chart'}
            </Button>
          </div>
        </div>

        {/* 3-pane layout */}
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[260px_1fr_280px]">
          {/* Left: columns */}
          <Card className="overflow-hidden p-3">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Columns
            </p>
            <ColumnListPane columns={effectiveColumns} />
          </Card>

          {/* Middle: canvas */}
          <Card className="flex min-h-[400px] flex-col overflow-hidden p-4">
            {chartType !== 'pivot' && chartType !== 'kpi' && (
              <div className="mb-4 grid grid-cols-2 gap-3">
                <AxisDropZone
                  id="x"
                  label="X axis"
                  column={xColumn}
                  onClear={() => setConfig((c) => ({ ...c, x: undefined }))}
                />
                <AxisDropZone
                  id="y"
                  label="Y axis"
                  column={yColumn}
                  onClear={() => setConfig((c) => ({ ...c, y: undefined }))}
                />
              </div>
            )}

            <div
              ref={canvasRef}
              className="flex-1 overflow-hidden rounded border bg-background"
            >
              {chartType === 'pivot' ? (
                <PivotTable
                  rows={processedRows}
                  config={{
                    rowField: config.pivotRow,
                    colField: config.pivotCol,
                    valueField: config.pivotValue,
                    aggregation: config.pivotAggregation ?? 'SUM',
                  }}
                  showTotals={config.pivotShowTotals ?? true}
                />
              ) : chartType === 'kpi' ? (
                <KPICard
                  rows={processedRows}
                  column={effectiveColumns.find((c) => c.name === config.kpiColumn) ?? null}
                  aggregation={config.kpiAggregation ?? 'SUM'}
                  title={config.title || chartName}
                />
              ) : echartsOption ? (
                <EChartsChart option={echartsOption} ariaLabel={chartName} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <BarChart3 className="h-10 w-10 opacity-30" />
                  <p>Drag a column onto X and Y axes to see your chart.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Right: properties */}
          <Card className="overflow-y-auto p-4">
            <PropertiesPane
              chartName={chartName}
              onChartNameChange={setChartName}
              chartType={chartType}
              onChartTypeChange={setChartType}
              config={config}
              onConfigChange={setConfig}
              columns={effectiveColumns}
            />
          </Card>
        </div>
      </div>

      <DragOverlay>
        {activeDragColumn && (
          <div className="flex cursor-grabbing items-center gap-2 rounded border bg-background px-2 py-1.5 text-sm shadow-lg">
            <ColumnTypeBadge type={activeDragColumn.effectiveType} />
            <span>{activeDragColumn.displayName}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <Button asChild className="mt-6">
        <Link to="/files">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Files
        </Link>
      </Button>
    </div>
  );
}
