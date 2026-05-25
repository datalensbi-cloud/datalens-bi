import { useDroppable } from '@dnd-kit/core';
import { X } from 'lucide-react';
import { ColumnTypeBadge } from '@/features/files/ColumnTypeBadge';
import type { EffectiveColumn } from '@/lib/apply-overrides';
import { cn } from '@/lib/utils';

interface AxisDropZoneProps {
  id: 'x' | 'y';
  label: string;
  column: EffectiveColumn | null;
  onClear: () => void;
}

export function AxisDropZone({ id, label, column, onClear }: AxisDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div
        ref={setNodeRef}
        className={cn(
          'flex h-10 items-center gap-2 rounded border-2 border-dashed bg-background px-2 text-sm transition-colors',
          isOver
            ? 'border-primary bg-primary/5'
            : column
              ? 'border-solid border-muted-foreground/30'
              : 'border-muted-foreground/25'
        )}
      >
        {column ? (
          <>
            <ColumnTypeBadge type={column.effectiveType} />
            <span className="flex-1 truncate" title={column.displayName}>
              {column.displayName}
            </span>
            <button
              type="button"
              onClick={onClear}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Clear ${label} axis`}
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            {isOver ? 'Drop to set' : 'Drop a column here'}
          </span>
        )}
      </div>
    </div>
  );
}
