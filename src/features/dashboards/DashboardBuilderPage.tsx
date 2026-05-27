import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import GridLayoutImport, { type Layout, type LayoutItem } from 'react-grid-layout';

// The @types/react-grid-layout shipped with this version omits a few props
// (cols, margin, containerPadding) from GridLayoutProps. Cast to bypass —
// the runtime API is unchanged and documented.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GridLayout = GridLayoutImport as unknown as React.ComponentType<any>;
import { ArrowLeft, Plus, Save, Trash2, AlertCircle, Pencil, Download } from 'lucide-react';
import { toast } from 'sonner';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { exportToPdf } from '@/lib/pdf-export';
import { getDashboard, insertDashboard, updateDashboard } from '@/lib/dashboards';
import { useAuth } from '@/features/auth/useAuth';
import type { DashboardLayoutItem } from '@/types/supabase';
import { DashboardChart } from './DashboardChart';
import { ChartPicker } from './ChartPicker';
import { cn } from '@/lib/utils';

const GRID_COLS = 12;
const ROW_HEIGHT = 60;

export function DashboardBuilderPage() {
  const { user } = useAuth();
  const { dashboardId } = useParams<{ dashboardId?: string }>();
  const navigate = useNavigate();

  const editing = !!dashboardId;

  // ----- Data -----

  const { data: existing, isLoading } = useQuery({
    queryKey: ['dashboard', dashboardId],
    queryFn: () => (dashboardId ? getDashboard(dashboardId) : Promise.resolve(null)),
    enabled: editing,
  });

  const [name, setName] = useState('Untitled dashboard');
  const [items, setItems] = useState<DashboardLayoutItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(!editing); // new dashboards start in edit
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existing && editing) {
      setName(existing.name);
      setItems(existing.layout ?? []);
    }
  }, [existing, editing]);

  // Map react-grid-layout positions back to our item array on every change.
  function handleLayoutChange(layout: Layout) {
    setItems((prev) => {
      const byId = new Map(layout.map((l) => [l.i, l]));
      return prev.map((it) => {
        const l = byId.get(it.chart_id);
        return l ? { ...it, x: l.x, y: l.y, w: l.w, h: l.h } : it;
      });
    });
  }

  function handleAddChart(chartId: string) {
    setPickerOpen(false);
    setItems((prev) => {
      if (prev.some((p) => p.chart_id === chartId)) return prev;
      const maxY = prev.reduce((m, it) => Math.max(m, it.y + it.h), 0);
      return [...prev, { chart_id: chartId, x: 0, y: maxY, w: 6, h: 4 }];
    });
  }

  function handleRemoveChart(chartId: string) {
    setItems((prev) => prev.filter((p) => p.chart_id !== chartId));
  }

  async function handleSave() {
    if (!user) return;
    const trimmed = name.trim() || 'Untitled dashboard';
    setSaving(true);
    try {
      if (editing && dashboardId) {
        await updateDashboard(dashboardId, { name: trimmed, layout: items });
        toast.success('Dashboard saved');
      } else {
        const created = await insertDashboard({
          user_id: user.id,
          name: trimmed,
          layout: items,
        });
        toast.success('Dashboard created');
        navigate(`/dashboards/${created.id}`, { replace: true });
      }
      setEditMode(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleExportPdf() {
    if (!canvasRef.current) return;
    try {
      await exportToPdf({
        element: canvasRef.current,
        filename: name || 'Dashboard',
        title: name,
      });
      toast.success('Exported to PDF');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF export failed');
    }
  }

  const gridLayout: LayoutItem[] = useMemo(
    () =>
      items.map((it) => ({
        i: it.chart_id,
        x: it.x,
        y: it.y,
        w: it.w,
        h: it.h,
        minW: 3,
        minH: 3,
      })),
    [items]
  );

  const excludeIds = items.map((i) => i.chart_id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (editing && !existing) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold">Dashboard not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted or you don't have access.
        </p>
        <Button asChild className="mt-6">
          <Link to="/dashboards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboards
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="-ml-3 text-muted-foreground">
            <Link to="/dashboards">
              <ArrowLeft className="mr-1 h-4 w-4" />
              All dashboards
            </Link>
          </Button>
          {editMode ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Untitled dashboard"
              className="h-9 max-w-md font-medium"
            />
          ) : (
            <h1 className="truncate text-xl font-semibold">{name}</h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editMode && (
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add chart
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={items.length === 0}>
            <Download className="mr-1 h-4 w-4" />
            Export PDF
          </Button>
          {editMode ? (
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-1 h-4 w-4" />
              {saving ? 'Saving…' : editing ? 'Save' : 'Create'}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Grid canvas */}
      <div ref={canvasRef} className="rounded-lg border bg-muted/20 p-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center text-sm text-muted-foreground">
            <Plus className="h-10 w-10 opacity-30" />
            <p>This dashboard is empty.</p>
            {editMode && (
              <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="mt-2">
                <Plus className="mr-1 h-4 w-4" />
                Add your first chart
              </Button>
            )}
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={gridLayout}
            cols={GRID_COLS}
            rowHeight={ROW_HEIGHT}
            width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 80, 1400) : 1200}
            margin={[12, 12]}
            containerPadding={[0, 0]}
            isDraggable={editMode}
            isResizable={editMode}
            draggableCancel="[data-no-drag]"
            onLayoutChange={handleLayoutChange}
          >
            {items.map((it) => (
              <div key={it.chart_id} className="overflow-hidden">
                <Card className={cn('relative h-full overflow-hidden', editMode && 'cursor-move')}>
                  {editMode && (
                    <button
                      type="button"
                      data-no-drag
                      onClick={() => handleRemoveChart(it.chart_id)}
                      className="absolute right-1 top-1 z-10 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 hover:!opacity-100"
                      aria-label="Remove chart"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <DashboardChart chartId={it.chart_id} />
                </Card>
              </div>
            ))}
          </GridLayout>
        )}
      </div>

      <ChartPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        excludeIds={excludeIds}
        onPick={handleAddChart}
      />

      {!editMode && items.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          <Label className="text-[11px]">Tip:</Label> Click <b>Edit</b> to rearrange or add charts.
        </p>
      )}
    </div>
  );
}
