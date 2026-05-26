import { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToExcel } from '@/lib/excel-export';
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
}

export function ExportMenu({ chartName, chartType, config, columns, rows }: ExportMenuProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExcel() {
    setExporting(true);
    try {
      const filename = (chartName || 'Untitled').replace(/[^a-zA-Z0-9._-]/g, '_');

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
              typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean' ? x : (x == null ? null : String(x)),
              typeof y === 'string' || typeof y === 'number' || typeof y === 'boolean' ? y : (y == null ? null : String(y)),
            ];
          }),
        });
      } else {
        toast.error(`Excel export not implemented for ${chartType} yet.`);
        return;
      }

      toast.success('Exported to Excel');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          <Download className="mr-1 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExcel} disabled={exporting}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
