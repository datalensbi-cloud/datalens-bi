import type { DetectedColumn, ColumnType } from './column-types';
import type { ColumnOverrides, ColumnRole, NullStrategy } from '@/types/supabase';

export interface EffectiveColumn extends DetectedColumn {
  /** Display name (override or original) */
  displayName: string;
  /** Type (override or detected) */
  effectiveType: ColumnType;
  /** Role (override or auto-tagged from type) */
  effectiveRole: ColumnRole;
  /** Null strategy (override or default 'keep') */
  effectiveNullStrategy: NullStrategy;
  /** True if any override is active on this column */
  hasOverride: boolean;
  /** Which override fields are set (for the indicator tooltip) */
  overrideSummary: string[];
}

const NULL_LABELS: Record<NullStrategy, string> = {
  keep: 'Keep nulls',
  drop: 'Drop rows with nulls',
  replace_zero: 'Replace nulls with 0',
  replace_mean: 'Replace nulls with mean',
};

const ROLE_LABELS: Record<ColumnRole, string> = {
  dimension: 'Dimension',
  measure: 'Measure',
};

/** Pure: combines detected columns with user overrides → effective columns */
export function applyOverrides(
  detected: DetectedColumn[],
  overrides: ColumnOverrides
): EffectiveColumn[] {
  return detected.map((col) => {
    const ov = overrides[col.name] ?? {};
    const effectiveType = (ov.type ?? col.type) as ColumnType;
    const autoRole: ColumnRole = effectiveType === 'number' ? 'measure' : 'dimension';
    const effectiveRole = ov.role ?? autoRole;
    const effectiveNullStrategy: NullStrategy = ov.null_strategy ?? 'keep';
    const displayName = ov.display_name?.trim() ? ov.display_name : col.name;

    const summary: string[] = [];
    if (ov.display_name?.trim()) summary.push(`Renamed from "${col.name}"`);
    if (ov.type) summary.push(`Type forced to ${ov.type} (detected: ${col.type})`);
    if (ov.role) summary.push(`Role: ${ROLE_LABELS[ov.role]}`);
    if (ov.null_strategy && ov.null_strategy !== 'keep') {
      summary.push(NULL_LABELS[ov.null_strategy]);
    }

    return {
      ...col,
      displayName,
      effectiveType,
      effectiveRole,
      effectiveNullStrategy,
      hasOverride: summary.length > 0,
      overrideSummary: summary,
    };
  });
}

function parseAsNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const n = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function isNullish(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

function computeMean(rows: Record<string, unknown>[], columnName: string): number {
  let sum = 0;
  let count = 0;
  for (const row of rows) {
    const n = parseAsNumber(row[columnName]);
    if (n !== null) {
      sum += n;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

/**
 * Apply null-handling strategies to a row set.
 * Drop strategy filters rows; replace strategies mutate cell values.
 * Returns a new array — does not mutate input.
 */
export function applyNullStrategies(
  rows: Record<string, unknown>[],
  effectiveColumns: EffectiveColumn[]
): Record<string, unknown>[] {
  const dropCols = effectiveColumns.filter((c) => c.effectiveNullStrategy === 'drop');
  const replaceZeroCols = effectiveColumns.filter(
    (c) => c.effectiveNullStrategy === 'replace_zero'
  );
  const replaceMeanCols = effectiveColumns.filter(
    (c) => c.effectiveNullStrategy === 'replace_mean' && c.effectiveType === 'number'
  );

  if (dropCols.length === 0 && replaceZeroCols.length === 0 && replaceMeanCols.length === 0) {
    return rows;
  }

  // Pre-compute means once on the un-filtered data
  const means: Record<string, number> = {};
  for (const col of replaceMeanCols) {
    means[col.name] = computeMean(rows, col.name);
  }

  // Drop rows where any drop-strategy column is null
  let working = rows;
  if (dropCols.length > 0) {
    working = working.filter((row) =>
      dropCols.every((col) => !isNullish(row[col.name]))
    );
  }

  // Replace nulls (zero or mean)
  if (replaceZeroCols.length > 0 || replaceMeanCols.length > 0) {
    working = working.map((row) => {
      let newRow: Record<string, unknown> | null = null;
      for (const col of replaceZeroCols) {
        if (isNullish(row[col.name])) {
          if (!newRow) newRow = { ...row };
          newRow[col.name] = 0;
        }
      }
      for (const col of replaceMeanCols) {
        if (isNullish(row[col.name])) {
          if (!newRow) newRow = { ...row };
          newRow[col.name] = means[col.name] ?? 0;
        }
      }
      return newRow ?? row;
    });
  }

  return working;
}
