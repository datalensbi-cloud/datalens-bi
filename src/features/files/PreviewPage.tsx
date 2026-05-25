import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileSpreadsheet, AlertCircle, RotateCcw, Check, Loader2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getDataset, updateColumnOverrides } from '@/lib/datasets';
import { downloadParsedJSON } from '@/lib/storage';
import { detectColumns } from '@/lib/column-types';
import { applyOverrides, applyNullStrategies } from '@/lib/apply-overrides';
import { formatBytes, formatNumber, cn } from '@/lib/utils';
import type { ColumnOverride, ColumnOverrides } from '@/types/supabase';
import { PreviewTable } from './PreviewTable';
import { ColumnSummaryPanel } from './ColumnSummaryPanel';

interface ParsedFile {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

const PREVIEW_ROW_LIMIT = 100;
const SAVE_DEBOUNCE_MS = 500;

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function PreviewPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const queryClient = useQueryClient();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<ColumnOverrides>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimer = useRef<number | null>(null);

  const {
    data: dataset,
    isLoading: datasetLoading,
    error: datasetError,
  } = useQuery({
    queryKey: ['dataset', datasetId],
    queryFn: () => (datasetId ? getDataset(datasetId) : Promise.resolve(null)),
    enabled: !!datasetId,
  });

  const {
    data: parsed,
    isLoading: parsedLoading,
    error: parsedError,
  } = useQuery({
    queryKey: ['dataset-parsed', datasetId, dataset?.parsed_path],
    queryFn: () =>
      dataset?.parsed_path
        ? downloadParsedJSON<ParsedFile>(dataset.parsed_path)
        : Promise.resolve(null),
    enabled: !!dataset?.parsed_path,
  });

  // Initialize local overrides state from dataset row once it loads.
  // We deliberately do NOT sync back on every dataset refetch — local state
  // is the source of truth while the user is editing.
  useEffect(() => {
    if (dataset && Object.keys(overrides).length === 0) {
      setOverrides(dataset.column_overrides ?? {});
    }
  }, [dataset, overrides]);

  // Cleanup pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  function scheduleSave(newOverrides: ColumnOverrides) {
    if (!datasetId) return;
    setSaveStatus('saving');
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await updateColumnOverrides(datasetId, newOverrides);
        setSaveStatus('saved');
        // Bust the dataset query cache so a fresh navigate-back picks up new state
        queryClient.invalidateQueries({ queryKey: ['dataset', datasetId] });
        window.setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (err) {
        setSaveStatus('error');
        toast.error(err instanceof Error ? err.message : 'Failed to save column overrides');
      }
    }, SAVE_DEBOUNCE_MS);
  }

  function updateOverrideForColumn(columnName: string, partial: ColumnOverride) {
    // Strip empty fields so the JSON stays clean
    const cleaned: ColumnOverride = {};
    if (partial.display_name?.trim()) cleaned.display_name = partial.display_name.trim();
    if (partial.type) cleaned.type = partial.type;
    if (partial.role) cleaned.role = partial.role;
    if (partial.null_strategy && partial.null_strategy !== 'keep') {
      cleaned.null_strategy = partial.null_strategy;
    }

    const next: ColumnOverrides = { ...overrides };
    if (Object.keys(cleaned).length === 0) {
      delete next[columnName];
    } else {
      next[columnName] = cleaned;
    }
    setOverrides(next);
    scheduleSave(next);
  }

  function resetColumn(columnName: string) {
    const next: ColumnOverrides = { ...overrides };
    delete next[columnName];
    setOverrides(next);
    scheduleSave(next);
  }

  function resetAllOverrides() {
    setOverrides({});
    scheduleSave({});
  }

  const detectedColumns = useMemo(() => {
    if (!parsed) return [];
    return detectColumns(parsed.columns, parsed.rows);
  }, [parsed]);

  const effectiveColumns = useMemo(
    () => applyOverrides(detectedColumns, overrides),
    [detectedColumns, overrides]
  );

  const processedRows = useMemo(() => {
    if (!parsed) return [];
    return applyNullStrategies(parsed.rows, effectiveColumns);
  }, [parsed, effectiveColumns]);

  const previewRows = useMemo(
    () => processedRows.slice(0, PREVIEW_ROW_LIMIT),
    [processedRows]
  );

  const selectedColumn =
    selectedIndex !== null && effectiveColumns[selectedIndex] !== undefined
      ? effectiveColumns[selectedIndex]
      : null;
  const selectedValues = useMemo(() => {
    if (!parsed || !selectedColumn) return [];
    return processedRows.map((r) => r[selectedColumn.name]);
  }, [parsed, selectedColumn, processedRows]);

  const hasAnyOverride = Object.keys(overrides).length > 0;
  const droppedRowCount = parsed ? parsed.rowCount - processedRows.length : 0;

  const isLoading = datasetLoading || parsedLoading;
  const error = datasetError ?? parsedError;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold">File not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "This dataset doesn't exist or you don't have access to it."}
        </p>
        <Button asChild className="mt-6">
          <Link to="/files">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Files
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2 text-muted-foreground">
          <Link to="/files">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Files
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-semibold tracking-tight" title={dataset.name}>
                {dataset.name}
              </h1>
              <p
                className="truncate text-sm text-muted-foreground"
                title={dataset.original_filename}
              >
                {dataset.original_filename}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SaveIndicator status={saveStatus} />
            {hasAnyOverride && <ResetAllButton onReset={resetAllOverrides} />}
            <Button asChild size="sm">
              <Link to={`/charts/new?dataset=${dataset.id}`}>
                <BarChart3 className="mr-1 h-4 w-4" />
                Build chart
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {parsed && (
            <Badge variant="secondary" className="font-normal">
              {formatNumber(parsed.rowCount)} rows × {parsed.columns.length} columns
            </Badge>
          )}
          {droppedRowCount > 0 && (
            <Badge variant="outline" className="font-normal">
              {formatNumber(droppedRowCount)} dropped by null filters
            </Badge>
          )}
          <Badge variant="outline" className="font-normal">
            {formatBytes(dataset.file_size_bytes)}
          </Badge>
          <Badge variant="outline" className="font-normal">
            Showing first {Math.min(processedRows.length, PREVIEW_ROW_LIMIT)} rows
          </Badge>
        </div>
      </div>

      {parsed && parsed.rowCount === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            This file has no rows. Try uploading a different version.
          </p>
        </div>
      ) : parsed ? (
        <>
          <p className="text-sm text-muted-foreground">
            Click any column header to see its summary and edit its overrides.
          </p>
          <PreviewTable
            columns={effectiveColumns}
            rows={previewRows}
            selectedIndex={selectedIndex}
            onSelectColumn={setSelectedIndex}
          />
          <ColumnSummaryPanel
            open={selectedIndex !== null}
            onOpenChange={(open) => {
              if (!open) setSelectedIndex(null);
            }}
            column={selectedColumn}
            values={selectedValues}
            totalRowCount={processedRows.length}
            override={selectedColumn ? (overrides[selectedColumn.name] ?? {}) : {}}
            onOverrideChange={(o) => {
              if (selectedColumn) updateOverrideForColumn(selectedColumn.name, o);
            }}
            onResetColumn={() => {
              if (selectedColumn) resetColumn(selectedColumn.name);
            }}
          />
        </>
      ) : null}
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs',
        status === 'error' ? 'text-destructive' : 'text-muted-foreground'
      )}
      aria-live="polite"
    >
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3 w-3 text-emerald-600" />
          Saved
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-3 w-3" />
          Save failed
        </>
      )}
    </div>
  );
}

function ResetAllButton({ onReset }: { onReset: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RotateCcw className="mr-1 h-3 w-3" />
          Reset all overrides
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset all column overrides?</AlertDialogTitle>
          <AlertDialogDescription>
            This wipes every override you've made on this dataset — renames, type changes,
            Dim/Measure tags, and null-handling strategies. Detected types come back. This cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onReset}>Reset all</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
