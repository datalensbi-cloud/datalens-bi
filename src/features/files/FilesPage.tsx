import { FileSpreadsheet } from 'lucide-react';
import { ComingSoonPage } from '@/components/ComingSoonPage';

export function FilesPage() {
  return (
    <ComingSoonPage
      title="Files"
      description="Upload CSV and Excel files, preview them, manage your file library."
      icon={FileSpreadsheet}
      shipsDay={3}
      features={[
        'Drag-and-drop upload for CSV and XLSX (up to 50 MB)',
        'Auto-detect column types — number, text, date, boolean',
        'Preview first 100 rows before committing',
        'Rename columns and tag them as Dimension or Measure',
        'Upload history with re-open and delete actions',
      ]}
    />
  );
}
