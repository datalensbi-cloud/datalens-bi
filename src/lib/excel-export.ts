import ExcelJS from 'exceljs';

/**
 * Generic Excel export: takes a 2D array (header row + data rows),
 * styles header row, auto-fits column widths, triggers download.
 *
 * For Phase 2 we ship one shape: flat rows. Sprint 2 may add
 * multi-sheet workbooks and embedded charts.
 */
export async function exportToExcel(opts: {
  filename: string;
  sheetName: string;
  headers: string[];
  rows: (string | number | boolean | null)[][];
}): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DataLens BI';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(opts.sheetName.slice(0, 31)); // Excel limit

  // Header row
  const headerRow = sheet.addRow(opts.headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }, // tailwind slate-200
    };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
    };
  });

  // Data rows
  for (const row of opts.rows) {
    sheet.addRow(row);
  }

  // Auto-fit columns based on content
  sheet.columns.forEach((col, i) => {
    const headerLen = opts.headers[i]?.length ?? 10;
    let maxLen = headerLen;
    for (const row of opts.rows) {
      const v = row[i];
      const s = v == null ? '' : String(v);
      if (s.length > maxLen) maxLen = s.length;
    }
    col.width = Math.min(Math.max(maxLen + 2, 10), 50);
  });

  // Freeze the header
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = opts.filename.endsWith('.xlsx') ? opts.filename : `${opts.filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
