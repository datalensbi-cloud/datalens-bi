import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, LineChart, PieChart, ScatterChart, MoreVertical, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/useAuth';
import { listCharts, deleteChart } from '@/lib/charts';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Chart, ChartType } from '@/types/supabase';

const CHART_ICON: Record<ChartType, typeof BarChart3> = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  scatter: ScatterChart,
};

export function ChartsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: charts, isLoading, error } = useQuery({
    queryKey: ['charts', user?.id],
    queryFn: () => (user ? listCharts(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['charts', user?.id] });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Charts</h1>
          <p className="text-sm text-muted-foreground">
            Charts you've built from your datasets. Open a file's preview and click "Build chart"
            to create one.
          </p>
        </div>
        <Button asChild>
          <Link to="/files">Build a new chart</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">
          Could not load your charts. {error instanceof Error ? error.message : ''}
        </p>
      ) : !charts || charts.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            No charts yet. Upload a file, open it, and click "Build chart" to make your first one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {charts.map((c) => (
            <ChartCard key={c.id} chart={c} onDeleted={refresh} onOpen={() => navigate(`/charts/${c.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChartCard({
  chart,
  onDeleted,
  onOpen,
}: {
  chart: Chart;
  onDeleted: () => void;
  onOpen: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const Icon = CHART_ICON[chart.chart_type];

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteChart(chart.id);
      toast.success(`Deleted "${chart.name}"`);
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  function handleCardClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('[data-no-card-nav]')) return;
    onOpen();
  }

  return (
    <Card
      onClick={handleCardClick}
      className="group relative cursor-pointer overflow-hidden p-5 transition-shadow hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium" title={chart.name}>
            {chart.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{chart.chart_type}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild data-no-card-nav>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
              aria-label="More actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-no-card-nav>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {chart.config.x && (
          <Badge variant="secondary" className="font-normal">
            X: {chart.config.x}
          </Badge>
        )}
        {chart.config.y && (
          <Badge variant="secondary" className="font-normal">
            Y: {chart.config.y}
          </Badge>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Created{' '}
        {new Date(chart.created_at).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent data-no-card-nav>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{chart.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the chart. The underlying dataset stays. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
