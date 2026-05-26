import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ChartType, ChartConfig, AggregationFn } from '@/types/supabase';
import type { EffectiveColumn } from '@/lib/apply-overrides';
import { AGGREGATION_LABELS, NUMERIC_AGGREGATIONS, NON_NUMERIC_AGGREGATIONS } from '@/lib/aggregations';
import { ChartTypePicker } from './ChartTypePicker';

interface PropertiesPaneProps {
  chartName: string;
  onChartNameChange: (name: string) => void;
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
  columns: EffectiveColumn[];
}

export function PropertiesPane({
  chartName,
  onChartNameChange,
  chartType,
  onChartTypeChange,
  config,
  onConfigChange,
  columns,
}: PropertiesPaneProps) {
  function setConfigField<K extends keyof ChartConfig>(key: K, value: ChartConfig[K]) {
    onConfigChange({ ...config, [key]: value });
  }

  const yCol = config.y ? columns.find((c) => c.name === config.y) : null;
  const pivotValueCol = config.pivotValue
    ? columns.find((c) => c.name === config.pivotValue)
    : null;

  const isPivot = chartType === 'pivot';
  const isCartesian = chartType === 'bar' || chartType === 'line';
  const isScatter = chartType === 'scatter';
  const isPie = chartType === 'pie';

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="chart-name" className="text-xs">
          Chart name
        </Label>
        <Input
          id="chart-name"
          value={chartName}
          onChange={(e) => onChartNameChange(e.target.value)}
          placeholder="Untitled chart"
          className="mt-1"
        />
      </div>

      <Separator />

      <div>
        <Label className="text-xs">Chart type</Label>
        <div className="mt-1.5">
          <ChartTypePicker value={chartType} onChange={onChartTypeChange} />
        </div>
      </div>

      <Separator />

      {/* Aggregation — for bar/line/pie only (scatter uses raw pairs, pivot has its own) */}
      {(isCartesian || isPie) && (
        <div className="space-y-1.5">
          <Label className="text-xs">Aggregation</Label>
          <p className="text-[11px] text-muted-foreground">
            How Y values are combined when X has duplicates.
          </p>
          <AggregationDropdown
            value={config.aggregation ?? 'SUM'}
            onChange={(v) => setConfigField('aggregation', v)}
            column={yCol ?? null}
          />
        </div>
      )}

      {/* Pivot-specific config */}
      {isPivot && (
        <>
          <div className="space-y-3">
            <Label className="text-xs">Pivot setup</Label>
            <ColumnSelect
              label="Rows"
              columns={columns}
              value={config.pivotRow}
              onChange={(v) => setConfigField('pivotRow', v)}
            />
            <ColumnSelect
              label="Columns (optional)"
              columns={columns}
              value={config.pivotCol}
              onChange={(v) => setConfigField('pivotCol', v)}
              allowClear
            />
            <ColumnSelect
              label="Values"
              columns={columns}
              value={config.pivotValue}
              onChange={(v) => setConfigField('pivotValue', v)}
            />
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Aggregation</Label>
              <AggregationDropdown
                value={config.pivotAggregation ?? 'SUM'}
                onChange={(v) => setConfigField('pivotAggregation', v)}
                column={pivotValueCol ?? null}
              />
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Display — title + axis labels */}
      {!isPivot && (
        <div className="space-y-3">
          <Label className="text-xs">Display</Label>
          <div>
            <Label htmlFor="chart-title" className="text-[11px] text-muted-foreground">
              Title (shown above chart)
            </Label>
            <Input
              id="chart-title"
              value={config.title ?? ''}
              onChange={(e) => setConfigField('title', e.target.value || undefined)}
              placeholder="Leave blank to hide"
              className="mt-1"
            />
          </div>
          {(isCartesian || isScatter) && (
            <>
              <div>
                <Label htmlFor="x-label" className="text-[11px] text-muted-foreground">
                  X-axis label
                </Label>
                <Input
                  id="x-label"
                  value={config.xAxisLabel ?? ''}
                  onChange={(e) => setConfigField('xAxisLabel', e.target.value || undefined)}
                  placeholder={config.x ?? 'Defaults to column name'}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="y-label" className="text-[11px] text-muted-foreground">
                  Y-axis label
                </Label>
                <Input
                  id="y-label"
                  value={config.yAxisLabel ?? ''}
                  onChange={(e) => setConfigField('yAxisLabel', e.target.value || undefined)}
                  placeholder={config.y ?? 'Defaults to column name'}
                  className="mt-1"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ColumnSelect({
  label,
  columns,
  value,
  onChange,
  allowClear,
}: {
  label: string;
  columns: EffectiveColumn[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  allowClear?: boolean;
}) {
  const NONE = '__none__';
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Select
        value={value ?? (allowClear ? NONE : '')}
        onValueChange={(v) => onChange(v === NONE ? undefined : v)}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Pick a column" />
        </SelectTrigger>
        <SelectContent>
          {allowClear && <SelectItem value={NONE}>None</SelectItem>}
          {columns.map((c) => (
            <SelectItem key={c.name} value={c.name}>
              {c.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AggregationDropdown({
  value,
  onChange,
  column,
}: {
  value: AggregationFn;
  onChange: (value: AggregationFn) => void;
  column: EffectiveColumn | null;
}) {
  const available =
    column?.effectiveType === 'number' ? NUMERIC_AGGREGATIONS : NON_NUMERIC_AGGREGATIONS;

  return (
    <Select value={value} onValueChange={(v) => onChange(v as AggregationFn)}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {available.map((fn) => (
          <SelectItem key={fn} value={fn}>
            {AGGREGATION_LABELS[fn]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
