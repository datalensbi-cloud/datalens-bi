import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileSpreadsheet, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getDataset } from '@/lib/datasets';
import { downloadParsedJSON } from '@/lib/storage';
import { detectColumns } from '@/lib/column-types';
import { formatBytes, formatNumber } from '@/lib/utils';
import { PreviewTable } from './PreviewTable';
import { ColumnSummaryPanel } from './ColumnSummaryPanel';

interface ParsedFile {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

const PREVIEW_ROW_LIMIT = 100;

export function PreviewPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

  // Type detection runs against the FULL row set (not just the preview), so
  // stats reflect the actual data. Detection is fast even on 50k rows.
  const detectedColumns = useMemo(() => {
    if (!parsed) return [];
    return detectColumns(parsed.columns, parsed.rows);
  }, [parsed]);

  // First-N rows for the preview table itself.
  const previewRows = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.slice(0, PREVIEW_ROW_LIMIT);
  }, [parsed]);

  const selectedColumn = selectedIndex !== null ? detectedColumns[selectedIndex] : null;
  const selectedValues = useMemo(() => {
    if (!parsed || selectedColumn === null || selectedColumn === undefined) return [];
    return parsed.rows.map((r) => r[selectedColumn.name]);
  }, [parsed, selectedColumn]);

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

        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight" title={dataset.name}>
              {dataset.name}
            </h1>
            <p className="truncate text-sm text-muted-foreground" title={dataset.original_filename}>
              {dataset.original_filename}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {parsed && (
            <Badge variant="secondary" className="font-normal">
              {formatNumber(parsed.rowCount)} rows × {parsed.columns.length} columns
            </Badge>
          )}
          <Badge variant="outline" className="font-normal">
            {formatBytes(dataset.file_size_bytes)}
          </Badge>
          <Badge variant="outline" className="font-normal">
            Showing first {Math.min(parsed?.rowCount ?? 0, PREVIEW_ROW_LIMIT)} rows
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
            Click any column header to see its summary.
          </p>
          <PreviewTable
            columns={detectedColumns}
            rows={previewRows}
            selectedIndex={selectedIndex}
            onSelectColumn={setSelectedIndex}
          />
          <ColumnSummaryPanel
            open={selectedIndex !== null}
            onOpenChange={(open) => {
              if (!open) setSelectedIndex(null);
            }}
            column={selectedColumn ?? null}
            values={selectedValues}
            totalRowCount={parsed.rowCount}
          />
        </>
      ) : null}
    </div>
  );
}
