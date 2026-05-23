import { useCallback, useRef, useState } from 'react';
import { FileSpreadsheet, Upload, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { cn, formatBytes } from '@/lib/utils';
import { computeFileHash } from '@/lib/hash';
import { nameFromFilename } from '@/lib/name-from-filename';
import { parseFile, isSupportedFile, getFileExtension, ParseError } from '@/lib/parsers';
import {
  uploadRawFile,
  uploadParsedJSON,
  deleteFiles,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/storage';
import { findDuplicateByHash, insertDataset } from '@/lib/datasets';
import type { Dataset } from '@/types/supabase';
import { DuplicateDialog } from './DuplicateDialog';

type UploadStage =
  | { kind: 'idle' }
  | { kind: 'hashing'; file: File }
  | { kind: 'parsing'; file: File }
  | { kind: 'uploading'; file: File; progress: number; label: string }
  | { kind: 'error'; message: string };

interface UploadDropzoneProps {
  onUploaded: () => void;
}

export function UploadDropzone({ onUploaded }: UploadDropzoneProps) {
  const { user } = useAuth();
  const [stage, setStage] = useState<UploadStage>({ kind: 'idle' });
  const [isDragOver, setIsDragOver] = useState(false);
  const [duplicate, setDuplicate] = useState<{ file: File; hash: string; existing: Dataset } | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = stage.kind !== 'idle' && stage.kind !== 'error';

  const processFile = useCallback(
    async (file: File, options: { asCopy?: boolean; skipDedup?: boolean } = {}) => {
      if (!user) return;

      // 1. Validation
      if (!isSupportedFile(file.name)) {
        toast.error('Only CSV and Excel files are supported (.csv, .tsv, .xlsx, .xls).');
        return;
      }
      if (file.size === 0) {
        toast.error('File is empty.');
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(
          `File is ${formatBytes(file.size)} — cap is ${formatBytes(MAX_FILE_SIZE_BYTES)}.`
        );
        return;
      }

      // 2. Hash + dedup check
      let hash: string;
      try {
        setStage({ kind: 'hashing', file });
        hash = await computeFileHash(file);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to read file';
        setStage({ kind: 'error', message: msg });
        toast.error(msg);
        return;
      }

      if (!options.skipDedup) {
        try {
          const existing = await findDuplicateByHash({ userId: user.id, hash });
          if (existing) {
            setStage({ kind: 'idle' });
            setDuplicate({ file, hash, existing });
            return;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Duplicate check failed';
          setStage({ kind: 'error', message: msg });
          toast.error(msg);
          return;
        }
      }

      // 3. Parse
      setStage({ kind: 'parsing', file });
      let parsed;
      try {
        parsed = await parseFile(file);
      } catch (err) {
        const msg = err instanceof ParseError ? err.message : 'Could not parse this file';
        setStage({ kind: 'error', message: msg });
        toast.error(msg);
        return;
      }

      // 4. Upload — raw → parsed JSON → DB row. Rollback on any failure.
      const fileId = crypto.randomUUID();
      const ext = getFileExtension(file.name);
      let rawPath: string | null = null;
      let parsedPath: string | null = null;

      try {
        setStage({ kind: 'uploading', file, progress: 20, label: 'Uploading raw file' });
        rawPath = await uploadRawFile({ userId: user.id, fileId, file, ext });

        setStage({ kind: 'uploading', file, progress: 60, label: 'Saving parsed data' });
        parsedPath = await uploadParsedJSON({ userId: user.id, fileId, data: parsed });

        setStage({ kind: 'uploading', file, progress: 90, label: 'Finishing up' });
        const baseName = nameFromFilename(file.name);
        const name = options.asCopy ? `${baseName} (copy)` : baseName;

        await insertDataset({
          id: fileId,
          user_id: user.id,
          name,
          original_filename: file.name,
          file_path: rawPath,
          parsed_path: parsedPath,
          row_count: parsed.rowCount,
          column_count: parsed.columns.length,
          file_size_bytes: file.size,
          mime_type: file.type || 'application/octet-stream',
          file_hash: hash,
          status: 'parsed',
        });

        toast.success(
          `"${name}" uploaded — ${parsed.rowCount.toLocaleString()} rows × ${parsed.columns.length} columns`
        );
        onUploaded();
        setStage({ kind: 'idle' });
      } catch (err) {
        // Rollback any uploaded files on failure
        const paths = [rawPath, parsedPath].filter((p): p is string => p !== null);
        if (paths.length > 0) {
          try {
            await deleteFiles(paths);
          } catch {
            /* best effort */
          }
        }
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setStage({ kind: 'error', message: msg });
        toast.error(msg);
      }
    },
    [user, onUploaded]
  );

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset so picking the same file again still fires onChange
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (busy) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!busy) setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    // Ignore leave events fired when crossing child elements inside the dropzone.
    // currentTarget is the dropzone; relatedTarget is what we're entering next.
    // If relatedTarget is a child of the dropzone, the user is still inside.
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) return;
    setIsDragOver(false);
  }

  // ---------- Render ----------

  if (stage.kind === 'hashing' || stage.kind === 'parsing' || stage.kind === 'uploading') {
    const label =
      stage.kind === 'hashing'
        ? 'Checking for duplicates'
        : stage.kind === 'parsing'
          ? 'Parsing your data'
          : stage.label;
    const progress = stage.kind === 'uploading' ? stage.progress : undefined;

    return (
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <FileSpreadsheet className="h-10 w-10 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium">{stage.file.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{formatBytes(stage.file.size)}</p>
            <p className="mt-3 text-sm">{label}…</p>
            <Progress value={progress ?? undefined} className="mt-2" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'group flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-background p-10 text-center transition-colors',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          stage.kind === 'error' && 'border-destructive/50 bg-destructive/5'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileInput}
        />

        {stage.kind === 'error' ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-destructive">Upload failed</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">{stage.message}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Click or drop another file to try again
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setStage({ kind: 'idle' });
              }}
            >
              <X className="mr-1 h-3 w-3" />
              Dismiss
            </Button>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {isDragOver ? 'Drop to upload' : 'Drag a file here or click to browse'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                CSV, TSV, or Excel · up to {formatBytes(MAX_FILE_SIZE_BYTES)}
              </p>
            </div>
          </>
        )}
      </button>

      <DuplicateDialog
        open={duplicate !== null}
        onOpenChange={(open) => {
          if (!open) setDuplicate(null);
        }}
        existing={duplicate?.existing ?? null}
        onOpenExisting={() => {
          if (duplicate) {
            toast.info(`"${duplicate.existing.name}" is already in your library.`);
            setDuplicate(null);
          }
        }}
        onUploadAsCopy={() => {
          if (duplicate) {
            const file = duplicate.file;
            setDuplicate(null);
            processFile(file, { asCopy: true, skipDedup: true });
          }
        }}
        onCancel={() => setDuplicate(null)}
      />
    </>
  );
}
