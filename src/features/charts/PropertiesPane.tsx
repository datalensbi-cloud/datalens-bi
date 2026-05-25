import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { ChartType, ChartConfig } from '@/types/supabase';
import { ChartTypePicker } from './ChartTypePicker';

interface PropertiesPaneProps {
  chartName: string;
  onChartNameChange: (name: string) => void;
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
}

export function PropertiesPane({
  chartName,
  onChartNameChange,
  chartType,
  onChartTypeChange,
  config,
  onConfigChange,
}: PropertiesPaneProps) {
  function setConfigField<K extends keyof ChartConfig>(key: K, value: ChartConfig[K]) {
    onConfigChange({ ...config, [key]: value });
  }

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
        {chartType !== 'pie' && (
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
    </div>
  );
}
