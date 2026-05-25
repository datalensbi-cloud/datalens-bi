import { useDraggable } from '@dnd-kit/core';
import type { EffectiveColumn } from '@/lib/apply-overrides';
import { ColumnTypeBadge } from '@/features/files/ColumnTypeBadge';
import { cn } from '@/lib/utils';

interface DraggableColumnProps {
  column: EffectiveColumn;
}

export function DraggableColumn({ column }: DraggableColumnProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: column.name,
    data: { column },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex cursor-grab items-center gap-2 rounded border bg-background px-2 py-1.5 text-sm shadow-sm transition-shadow active:cursor-grabbing',
        'hover:border-primary/40 hover:shadow',
        isDragging && 'opacity-30'
      )}
    >
      <ColumnTypeBadge type={column.effectiveType} />
      <span className="truncate" title={column.displayName}>
        {column.displayName}
      </span>
    </div>
  );
}
