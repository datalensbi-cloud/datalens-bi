import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet } from 'lucide-react';

import { useAuth } from '@/features/auth/useAuth';
import { listDatasets } from '@/lib/datasets';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadDropzone } from './UploadDropzone';
import { DatasetCard } from './DatasetCard';

export function FilesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: datasets, isLoading, error } = useQuery({
    queryKey: ['datasets', user?.id],
    queryFn: () => (user ? listDatasets(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  function invalidateDatasets() {
    queryClient.invalidateQueries({ queryKey: ['datasets', user?.id] });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Files</h1>
        <p className="text-sm text-muted-foreground">
          Upload CSV or Excel files. Each file is parsed, stored privately, and added to your
          library.
        </p>
      </div>

      <UploadDropzone onUploaded={invalidateDatasets} />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your files {datasets && `(${datasets.length})`}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">
            Could not load your files. {error instanceof Error ? error.message : ''}
          </p>
        ) : !datasets || datasets.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-10 text-center">
            <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              No files yet. Drop a CSV or Excel above to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {datasets.map((d) => (
              <DatasetCard key={d.id} dataset={d} onDeleted={invalidateDatasets} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
