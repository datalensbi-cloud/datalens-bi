/**
 * Date grouping — buckets date values into Day/Week/Month/Quarter/Year periods
 * for time-series chart X-axes.
 *
 * Used by build-chart-option when xGroupBy is set and X column is a date.
 */

export type DateGroupPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

const DATE_GROUP_LABELS: Record<DateGroupPeriod, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  quarter: 'Quarter',
  year: 'Year',
};

export function getDateGroupLabel(period: DateGroupPeriod): string {
  return DATE_GROUP_LABELS[period];
}

export const ALL_DATE_PERIODS: DateGroupPeriod[] = ['day', 'week', 'month', 'quarter', 'year'];

function parseDate(v: unknown): Date | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** ISO week number (1-53), Monday-based per ISO 8601. */
function getISOWeek(d: Date): { year: number; week: number } {
  // Thursday in current week decides the year
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = (target.getTime() - firstThursday.getTime()) / (24 * 60 * 60 * 1000);
  const week = 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return { year: target.getUTCFullYear(), week };
}

/**
 * Bucket a single value into a labeled period.
 * Returns null if the value isn't parseable as a date.
 */
export function bucketDate(value: unknown, period: DateGroupPeriod): string | null {
  const d = parseDate(value);
  if (!d) return null;

  const y = d.getFullYear();
  const m = d.getMonth() + 1; // 1-12

  switch (period) {
    case 'day':
      return `${y}-${pad2(m)}-${pad2(d.getDate())}`;
    case 'week': {
      const { year, week } = getISOWeek(d);
      return `${year}-W${pad2(week)}`;
    }
    case 'month':
      return `${y}-${pad2(m)}`;
    case 'quarter':
      return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
    case 'year':
      return String(y);
  }
}
