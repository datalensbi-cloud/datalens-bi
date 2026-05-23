import { Hash, Type, Calendar, ToggleLeft, Key } from 'lucide-react';
import type { ColumnType } from '@/lib/column-types';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<
  ColumnType,
  { label: string; icon: typeof Hash; classes: string }
> = {
  number: {
    label: '#',
    icon: Hash,
    classes:
      'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900',
  },
  string: {
    label: 'T',
    icon: Type,
    classes:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
  date: {
    label: 'Date',
    icon: Calendar,
    classes:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  },
  boolean: {
    label: 'Bool',
    icon: ToggleLeft,
    classes:
      'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-900',
  },
};

export function ColumnTypeBadge({ type }: { type: ColumnType }) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium',
        config.classes
      )}
      title={`Type: ${type}`}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </span>
  );
}

export function PrimaryKeyBadge() {
  return (
    <span
      className="inline-flex h-5 items-center gap-1 rounded border border-amber-200 bg-amber-100 px-1.5 text-[10px] font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
      title="Every value in this column is unique — likely a primary key or join column."
    >
      <Key className="h-3 w-3" />
      <span>Key</span>
    </span>
  );
}
