import { BarChart3, LineChart, PieChart, ScatterChart } from 'lucide-react';
import type { ChartType } from '@/types/supabase';
import { cn } from '@/lib/utils';

const OPTIONS: Array<{ type: ChartType; label: string; icon: typeof BarChart3 }> = [
  { type: 'bar', label: 'Bar', icon: BarChart3 },
  { type: 'line', label: 'Line', icon: LineChart },
  { type: 'pie', label: 'Pie', icon: PieChart },
  { type: 'scatter', label: 'Scatter', icon: ScatterChart },
];

interface ChartTypePickerProps {
  value: ChartType;
  onChange: (value: ChartType) => void;
}

export function ChartTypePicker({ value, onChange }: ChartTypePickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const selected = value === opt.type;
        return (
          <button
            key={opt.type}
            type="button"
            onClick={() => onChange(opt.type)}
            aria-pressed={selected}
            className={cn(
              'flex flex-col items-center gap-1 rounded-md border bg-background px-2 py-3 text-xs transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              selected && 'border-primary bg-primary/5 text-primary'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
