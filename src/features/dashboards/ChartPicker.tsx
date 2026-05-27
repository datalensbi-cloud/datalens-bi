import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, LineChart, PieChart, ScatterChart, Table2, Gauge, Search } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/useAuth';
import { listCharts } from '@/lib/charts';
import { cn } from '@/lib/utils';
import type { ChartType } from '@/types/supabase';

const CHART_ICON: Record<ChartType, typeof BarChart3> = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  scatter: ScatterChart,
  pivot: Table2,
  kpi: Gauge,
};

interface ChartPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** chart IDs already on the dashboard — shown disabled */
  excludeIds: string[];
  onPick: (chartId: string) => void;
}

export function ChartPicker({ open, onOpenChange, excludeIds, onPick }: ChartPickerProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const { data: charts, isLoading } = useQuery({
    queryKey: ['charts', user?.id],
    queryFn: () => (user ? listCharts(user.id) : Promise.resolve([])),
    enabled: !!user && open,
  });

  const filtered = useMemo(() => {
    if (!charts) return [];
    const q = query.trim().toLowerCase();
    if (!q) return charts;
    return charts.filter((c) => c.name.toLowerCase().includes(q));
  }, [charts, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add chart to dashboard</DialogTitle>
          <DialogDescription>Pick from your saved charts. Charts already on this dashboard are dimmed.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search charts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="-mx-2 max-h-96 space-y-1 overflow-y-auto px-2">
          {isLoading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {query ? `No charts match "${query}"` : "You haven't built any charts yet."}
            </p>
          ) : (
            filtered.map((c) => {
              const Icon = CHART_ICON[c.chart_type];
              const alreadyAdded = excludeIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => onPick(c.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded border bg-background p-3 text-left transition-colors',
                    alreadyAdded
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:border-primary/40 hover:bg-accent/30'
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.chart_type}</p>
                  </div>
                  {alreadyAdded && (
                    <span className="shrink-0 text-[10px] uppercase text-muted-foreground">Added</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
