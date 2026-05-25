import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ColumnOverride, ColumnRole, NullStrategy } from '@/types/supabase';
import type { ColumnType } from '@/lib/column-types';
import type { EffectiveColumn } from '@/lib/apply-overrides';

interface ColumnEditSectionProps {
  column: EffectiveColumn;
  override: ColumnOverride;
  onChange: (override: ColumnOverride) => void;
  onResetColumn: () => void;
}

export function ColumnEditSection({
  column,
  override,
  onChange,
  onResetColumn,
}: ColumnEditSectionProps) {
  // Local mirror of the rename input so typing feels instant.
  // Parent debounces saves; we just update local + emit changes.
  const [nameDraft, setNameDraft] = useState(override.display_name ?? '');

  // Keep nameDraft in sync if parent state changes externally (e.g. after Reset)
  useEffect(() => {
    setNameDraft(override.display_name ?? '');
  }, [override.display_name]);

  function update(patch: Partial<ColumnOverride>) {
    onChange({ ...override, ...patch });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Edit
        </h3>
        {column.hasOverride && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-mr-2 h-7 text-xs"
            onClick={onResetColumn}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset column
          </Button>
        )}
      </div>

      {/* Rename */}
      <div className="space-y-1.5">
        <Label htmlFor="col-rename" className="text-xs">
          Display name
        </Label>
        <Input
          id="col-rename"
          value={nameDraft}
          placeholder={column.name}
          onChange={(e) => {
            setNameDraft(e.target.value);
            update({ display_name: e.target.value || null });
          }}
        />
        <p className="text-[11px] text-muted-foreground">
          Original column key:{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{column.name}</code>
        </p>
      </div>

      <Separator />

      {/* Type override */}
      <div className="space-y-1.5">
        <Label className="text-xs">Type</Label>
        <Select
          value={override.type ?? '__auto__'}
          onValueChange={(v) =>
            update({ type: v === '__auto__' ? null : (v as ColumnType) })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__auto__">Auto-detected ({column.type})</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="string">Text</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Dimension / Measure role */}
      <div className="space-y-1.5">
        <Label className="text-xs">Role in charts</Label>
        <ToggleGroup
          type="single"
          value={column.effectiveRole}
          onValueChange={(v) => {
            if (v) update({ role: v as ColumnRole });
          }}
          className="grid grid-cols-2 gap-2"
        >
          <ToggleGroupItem value="dimension" className="border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            Dimension
          </ToggleGroupItem>
          <ToggleGroupItem value="measure" className="border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            Measure
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-[11px] text-muted-foreground">
          Dimensions group/slice data (categories, dates); Measures get aggregated (sum, avg).
        </p>
      </div>

      <Separator />

      {/* Null handling strategy */}
      <div className="space-y-2">
        <Label className="text-xs">Null handling</Label>
        <RadioGroup
          value={override.null_strategy ?? 'keep'}
          onValueChange={(v) =>
            update({ null_strategy: v === 'keep' ? null : (v as NullStrategy) })
          }
          className="space-y-2"
        >
          <NullOption value="keep" label="Keep" description="Show null cells as muted —" />
          <NullOption
            value="drop"
            label="Drop rows"
            description="Hide any row where this column is null"
          />
          {column.effectiveType === 'number' && (
            <>
              <NullOption
                value="replace_zero"
                label="Replace with 0"
                description="Substitute nulls with zero"
              />
              <NullOption
                value="replace_mean"
                label="Replace with mean"
                description="Substitute nulls with the column average"
              />
            </>
          )}
        </RadioGroup>
        {column.effectiveType !== 'number' && (
          <p className="text-[11px] text-muted-foreground">
            Replace strategies are only available for numeric columns.
          </p>
        )}
      </div>
    </div>
  );
}

function NullOption({
  value,
  label,
  description,
}: {
  value: string;
  label: string;
  description: string;
}) {
  const id = `null-${value}`;
  return (
    <div className="flex items-start gap-2">
      <RadioGroupItem value={value} id={id} className="mt-0.5" />
      <Label htmlFor={id} className="flex flex-col gap-0.5 font-normal cursor-pointer">
        <span className="text-sm">{label}</span>
        <span className="text-[11px] text-muted-foreground">{description}</span>
      </Label>
    </div>
  );
}
