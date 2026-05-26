import { useMemo, useState } from 'react';
import { Filter, X, Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { EffectiveColumn } from '@/lib/apply-overrides';
import type { FilterCondition, FilterOp } from '@/types/supabase';

interface FilterPanelProps {
  columns: EffectiveColumn[];
  rows: Record<string, unknown>[];
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
}

export function FilterPanel({ columns, rows, conditions, onChange }: FilterPanelProps) {
  const [open, setOpen] = useState(false);

  const count = conditions.length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="mr-1 h-4 w-4" />
          Filters
          {count > 0 && (
            <Badge variant="default" className="ml-2 h-5 px-1.5 text-[10px]">
              {count}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Filters</span>
            {count > 0 && (
              <Button variant="ghost" size="sm" onClick={() => onChange([])}>
                Clear all
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {conditions.map((cond, idx) => (
            <FilterRow
              key={idx}
              columns={columns}
              rows={rows}
              condition={cond}
              onChange={(next) => {
                const newList = [...conditions];
                newList[idx] = next;
                onChange(newList);
              }}
              onRemove={() => onChange(conditions.filter((_, i) => i !== idx))}
            />
          ))}

          {conditions.length === 0 && (
            <p className="rounded border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              No filters yet. Add one to slice your data.
            </p>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => onChange([...conditions, { column: '', op: 'in', value: [] }])}
            disabled={columns.length === 0}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add filter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterRow({
  columns,
  rows,
  condition,
  onChange,
  onRemove,
}: {
  columns: EffectiveColumn[];
  rows: Record<string, unknown>[];
  condition: FilterCondition;
  onChange: (next: FilterCondition) => void;
  onRemove: () => void;
}) {
  const col = columns.find((c) => c.name === condition.column);
  const availableOps: FilterOp[] = useMemo(() => {
    if (!col) return ['in'];
    if (col.effectiveType === 'number') return ['between', 'in', 'is_null', 'is_not_null'];
    if (col.effectiveType === 'date') return ['date_between', 'in', 'is_null', 'is_not_null'];
    return ['in', 'contains', 'is_null', 'is_not_null'];
  }, [col]);

  return (
    <div className="space-y-2 rounded-md border bg-card p-3">
      <div className="flex items-start gap-2">
        <Select
          value={condition.column}
          onValueChange={(v) => onChange({ column: v, op: 'in', value: [] })}
        >
          <SelectTrigger className="h-8 flex-1 text-xs">
            <SelectValue placeholder="Pick column" />
          </SelectTrigger>
          <SelectContent>
            {columns.map((c) => (
              <SelectItem key={c.name} value={c.name}>
                {c.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onRemove}
          aria-label="Remove filter"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {col && (
        <>
          <Select
            value={condition.op}
            onValueChange={(v) =>
              onChange({ ...condition, op: v as FilterOp, value: defaultValueForOp(v as FilterOp) })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableOps.map((op) => (
                <SelectItem key={op} value={op}>
                  {OP_LABEL[op]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <FilterValueInput condition={condition} col={col} rows={rows} onChange={onChange} />
        </>
      )}
    </div>
  );
}

function FilterValueInput({
  condition,
  col,
  rows,
  onChange,
}: {
  condition: FilterCondition;
  col: EffectiveColumn;
  rows: Record<string, unknown>[];
  onChange: (next: FilterCondition) => void;
}) {
  // Compute distinct values unconditionally — React hooks must not be
  // called inside conditionals. Only the 'in' branch uses this; cheap
  // to compute (early-break at 100).
  const distinct = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const v = r[col.name];
      if (v != null && v !== '') set.add(String(v));
      if (set.size > 100) break;
    }
    return Array.from(set).slice(0, 100).sort();
  }, [rows, col.name]);

  if (condition.op === 'is_null' || condition.op === 'is_not_null') return null;

  if (condition.op === 'in') {
    const selected = (condition.value as string[]) ?? [];

    return (
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">
          Select values ({selected.length} chosen)
        </Label>
        <div className="max-h-48 space-y-0.5 overflow-y-auto rounded border bg-background p-2">
          {distinct.length === 0 ? (
            <p className="text-xs text-muted-foreground">No values found</p>
          ) : (
            distinct.map((v) => (
              <label key={v} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-accent">
                <input
                  type="checkbox"
                  checked={selected.includes(v)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, v]
                      : selected.filter((x) => x !== v);
                    onChange({ ...condition, value: next });
                  }}
                />
                <span className="truncate text-xs">{v}</span>
              </label>
            ))
          )}
        </div>
      </div>
    );
  }

  if (condition.op === 'contains') {
    return (
      <Input
        value={String(condition.value ?? '')}
        onChange={(e) => onChange({ ...condition, value: e.target.value })}
        placeholder="Substring to match"
        className="h-8 text-xs"
      />
    );
  }

  if (condition.op === 'between') {
    const range = (condition.value as { min?: number; max?: number }) ?? {};
    return (
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          value={range.min ?? ''}
          onChange={(e) =>
            onChange({
              ...condition,
              value: { ...range, min: e.target.value === '' ? undefined : Number(e.target.value) },
            })
          }
          placeholder="Min"
          className="h-8 text-xs"
        />
        <Input
          type="number"
          value={range.max ?? ''}
          onChange={(e) =>
            onChange({
              ...condition,
              value: { ...range, max: e.target.value === '' ? undefined : Number(e.target.value) },
            })
          }
          placeholder="Max"
          className="h-8 text-xs"
        />
      </div>
    );
  }

  if (condition.op === 'date_between') {
    const range = (condition.value as { from?: string; to?: string }) ?? {};
    return (
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          value={range.from ?? ''}
          onChange={(e) => onChange({ ...condition, value: { ...range, from: e.target.value || undefined } })}
          className="h-8 text-xs"
        />
        <Input
          type="date"
          value={range.to ?? ''}
          onChange={(e) => onChange({ ...condition, value: { ...range, to: e.target.value || undefined } })}
          className="h-8 text-xs"
        />
      </div>
    );
  }

  return null;
}

const OP_LABEL: Record<FilterOp, string> = {
  in: 'is one of',
  between: 'is between',
  date_between: 'is between',
  contains: 'contains',
  is_null: 'is empty',
  is_not_null: 'is not empty',
};

function defaultValueForOp(op: FilterOp): unknown {
  switch (op) {
    case 'in':
      return [];
    case 'between':
      return {};
    case 'date_between':
      return {};
    case 'contains':
      return '';
    case 'is_null':
    case 'is_not_null':
      return undefined;
  }
}
