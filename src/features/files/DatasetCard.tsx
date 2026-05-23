import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, MoreVertical, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { deleteDataset } from '@/lib/datasets';
import { formatBytes, formatNumber } from '@/lib/utils';
import type { Dataset } from '@/types/supabase';

interface DatasetCardProps {
  dataset: Dataset;
  onDeleted: () => void;
}

export function DatasetCard({ dataset, onDeleted }: DatasetCardProps) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const uploadedDate = new Date(dataset.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  function handleCardClick(e: React.MouseEvent) {
    // Don't navigate if the click came from the kebab menu or dialog
    if ((e.target as HTMLElement).closest('[data-no-card-nav]')) return;
    navigate(`/files/${dataset.id}`);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDataset(dataset);
      toast.success(`Deleted "${dataset.name}"`);
      onDeleted();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error(msg);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <Card
      onClick={handleCardClick}
      className="group relative cursor-pointer overflow-hidden p-5 transition-shadow hover:shadow-md hover:border-primary/30"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium" title={dataset.name}>
            {dataset.name}
          </p>
          <p
            className="truncate text-xs text-muted-foreground"
            title={dataset.original_filename}
          >
            {dataset.original_filename}
          </p>
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
        {dataset.row_count !== null && dataset.column_count !== null && (
          <Badge variant="secondary" className="font-normal">
            {formatNumber(dataset.row_count)} rows × {dataset.column_count} cols
          </Badge>
        )}
        <Badge variant="outline" className="font-normal">
          {formatBytes(dataset.file_size_bytes)}
        </Badge>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">Uploaded {uploadedDate}</p>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent data-no-card-nav>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{dataset.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the file and its parsed data permanently. Charts or templates that
              depend on it will break. This action cannot be undone.
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
