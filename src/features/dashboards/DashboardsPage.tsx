import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, Plus, MoreVertical, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/useAuth';
import { listDashboards, deleteDashboard } from '@/lib/dashboards';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import type { Dashboard } from '@/types/supabase';

export function DashboardsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: dashboards, isLoading, error } = useQuery({
    queryKey: ['dashboards', user?.id],
    queryFn: () => (user ? listDashboards(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['dashboards', user?.id] });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboards</h1>
          <p className="text-sm text-muted-foreground">
            Combine multiple charts into a single shareable view.
          </p>
        </div>
        <Button onClick={() => navigate('/dashboards/new')}>
          <Plus className="mr-1 h-4 w-4" />
          New dashboard
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
          Could not load dashboards. {error instanceof Error ? error.message : ''}
        </p>
      ) : !dashboards || dashboards.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
          <LayoutGrid className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            No dashboards yet. Build one to combine multiple charts in a single layout.
          </p>
          <Button className="mt-4" onClick={() => navigate('/dashboards/new')}>
            <Plus className="mr-1 h-4 w-4" />
            Create your first dashboard
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((d) => (
            <DashboardListCard key={d.id} dashboard={d} onDeleted={invalidate} />
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardListCard({
  dashboard,
  onDeleted,
}: {
  dashboard: Dashboard;
  onDeleted: () => void;
}) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const chartCount = (dashboard.layout ?? []).length;
  const updatedDate = new Date(dashboard.updated_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  function handleCardClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('[data-no-card-nav]')) return;
    navigate(`/dashboards/${dashboard.id}`);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDashboard(dashboard.id);
      toast.success(`Deleted "${dashboard.name}"`);
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <Card
      onClick={handleCardClick}
      className="group relative cursor-pointer overflow-hidden p-5 transition-shadow hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <LayoutGrid className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium" title={dashboard.name}>
            {dashboard.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {chartCount} chart{chartCount === 1 ? '' : 's'}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild data-no-card-nav>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 transition-opacity lg:opacity-0 lg:group-hover:opacity-100"
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
        <Badge variant="outline" className="font-normal">
          Updated {updatedDate}
        </Badge>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent data-no-card-nav>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{dashboard.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the dashboard layout only. The underlying charts remain.
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
