import { useState, type RefObject } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToExcel } from '@/lib/excel-export';
import { exportToPdf } from '@/lib/pdf-export';
import { groupAndAggregate } from '@/lib/aggregations';
import { buildPivot } from '@/lib/build-pivot';
import type { ChartType, ChartConfig } from '@/types/supabase';
import type { EffectiveColumn } from '@/lib/apply-overrides';

interface ExportMenuProps {
  chartName: string;
  chartType: ChartType;
  config: ChartConfig;
  columns: EffectiveColumn[];
  rows: Record<string, unknown>[];
  /** Ref to the DOM element to capture for PDF export */
  captureRef?: RefObject<HTMLDivElement | null>;
}

export function ExportMenu({
  chartName,
  chartType,
  config,
  columns,
  rows,
  captureRef,
}: ExportMenuProps) {
  const [exporting, setExporting] = useState(false);

  const filename = (chartName || 'Untitled').replace(/[^a-zA-Z0-9._-]/g, '_');

  async function handleExcel() {
    setExporting(true);
    try {
      if (chartType === 'pivot') {
        const pivot = buildPivot(rows, {
          rowField: config.pivotRow,
          colField: config.pivotCol,
          valueField: config.pivotValue,
          aggregation: config.pivotAggregation ?? 'SUM',
        });
        if (pivot.rowKeys.length === 0) {
          toast.error('Pivot has no data to export.');
          return;
        }
        const headers = [config.pivotRow ?? '', ...pivot.colKeys];
        const dataRows = pivot.rowKeys.map((rk, rIdx) => [
          rk,
          ...pivot.cells[rIdx]!.map((c) => Number(c.toFixed(4))),
        ]);
        await exportToExcel({
          filename,
          sheetName: chartName || 'Pivot',
          headers,
          rows: dataRows,
        });
      } else if (chartType === 'kpi') {
        toast.error('Use PDF export for KPI cards (single number).');
        return;
      } else if (chartType === 'bar' || chartType === 'line' || chartType === 'pie') {
        if (!config.x || !config.y) {
          toast.error('Set X and Y axes before exporting.');
          return;
        }
        const xCol = columns.find((c) => c.name === config.x);
        const yCol = columns.find((c) => c.name === config.y);
        const data = groupAndAggregate(rows, config.x, config.y, config.aggregation ?? 'SUM');
        await exportToExcel({
          filename,
          sheetName: chartName || 'Chart',
          headers: [xCol?.displayName ?? config.x, yCol?.displayName ?? config.y],
          rows: data.map((d) => [d.key == null ? '' : String(d.key), Number(d.value.toFixed(4))]),
        });
      } else if (chartType === 'scatter') {
        if (!config.x || !config.y) {
          toast.error('Set X and Y axes before exporting.');
          return;
        }
        const xCol = columns.find((c) => c.name === config.x);
        const yCol = columns.find((c) => c.name === config.y);
        await exportToExcel({
          filename,
          sheetName: chartName || 'Chart',
          headers: [xCol?.displayName ?? config.x, yCol?.displayName ?? config.y],
          rows: rows.map((r) => {
            const x = r[config.x!];
            const y = r[config.y!];
            return [
              typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean'
                ? x
                : x == null
                  ? null
                  : String(x),
              typeof y === 'string' || typeof y === 'number' || typeof y === 'boolean'
                ? y
                : y == null
                  ? null
                  : String(y),
            ];
          }),
        });
      }

      toast.success('Exported to Excel');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  async function handlePdf() {
    if (!captureRef?.current) {
      toast.error('Nothing to capture yet.');
      return;
    }
    setExporting(true);
    try {
      await exportToPdf({
        element: captureRef.current,
        filename,
        title: chartName,
      });
      toast.success('Exported to PDF');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          <Download className="mr-1 h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExcel} disabled={exporting || chartType === 'kpi'}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePdf} disabled={exporting}>
          <FileText className="mr-2 h-4 w-4" />
          PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
