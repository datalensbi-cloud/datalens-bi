import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  AGGREGATION_LABELS,
  NUMERIC_AGGREGATIONS,
  NON_NUMERIC_AGGREGATIONS,
  type AggregationFn,
} from '@/lib/aggregations';
import type { EffectiveColumn } from '@/lib/apply-overrides';

interface AggregationSelectProps {
  column: EffectiveColumn | null;
  value: AggregationFn;
  onChange: (value: AggregationFn) => void;
  label?: string;
}

export function AggregationSelect({
  column,
  value,
  onChange,
  label = 'Aggregation',
}: AggregationSelectProps) {
  const available =
    column?.effectiveType === 'number' ? NUMERIC_AGGREGATIONS : NON_NUMERIC_AGGREGATIONS;

  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
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
    </div>
  );
}
