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
import type { Dataset } from '@/types/supabase';

interface DuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: Dataset | null;
  onOpenExisting: () => void;
  onUploadAsCopy: () => void;
  onCancel: () => void;
}

export function DuplicateDialog({
  open,
  onOpenChange,
  existing,
  onOpenExisting,
  onUploadAsCopy,
  onCancel,
}: DuplicateDialogProps) {
  const date = existing?.created_at
    ? new Date(existing.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>You've uploaded this exact file before</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{existing?.name ?? ''}</span> was added on{' '}
            {date} with the same content. What do you want to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onUploadAsCopy}>Upload as a copy</AlertDialogAction>
          <AlertDialogAction onClick={onOpenExisting} className="bg-primary">
            Use existing
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
