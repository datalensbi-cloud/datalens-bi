/**
 * Database schema types.
 * Will be auto-generated later via:
 *   npx supabase gen types typescript --project-id YOUR_REF > src/types/supabase.ts
 */
export type DatasetStatus = 'uploaded' | 'parsed' | 'parse_failed';

/** Role a column plays in chart building. Auto-pre-tagged by type; user can override. */
export type ColumnRole = 'dimension' | 'measure';

/** Strategies for handling null values in a column. */
export type NullStrategy = 'keep' | 'drop' | 'replace_zero' | 'replace_mean';

/** Per-column user override. All fields optional — partial overrides allowed. */
export interface ColumnOverride {
  display_name?: string | null;
  type?: 'number' | 'string' | 'date' | 'boolean' | null;
  role?: ColumnRole | null;
  null_strategy?: NullStrategy | null;
}

/** Map keyed by original column name. */
export type ColumnOverrides = Record<string, ColumnOverride>;

/** Supported chart types — Phase 1: bar/line/pie/scatter. Phase 2: pivot, kpi. */
export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'pivot' | 'kpi';

/** Aggregation function applied to Y/value columns. */
export type AggregationFn = 'SUM' | 'AVG' | 'COUNT' | 'COUNT_DISTINCT' | 'MIN' | 'MAX';

/** Filter operators — see lib/filters.ts for semantics. */
export type FilterOp =
  | 'in'
  | 'between'
  | 'date_between'
  | 'contains'
  | 'is_null'
  | 'is_not_null';

export interface FilterCondition {
  column: string;
  op: FilterOp;
  value?: unknown;
}

/** Date bucketing period for time-series X-axis grouping. */
export type DateGroupPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

/** One cell in a dashboard grid layout. */
export interface DashboardLayoutItem {
  chart_id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Chart configuration — schema-less JSONB. Knobs accumulate across phases. */
export interface ChartConfig {
  // Bar / Line / Pie / Scatter
  x?: string;
  y?: string;
  /** Aggregation applied to Y when X has duplicate values. Default: SUM. */
  aggregation?: AggregationFn;
  /** When set and X column is a date, bucket X values into this period. */
  xGroupBy?: DateGroupPeriod;

  // Pivot
  pivotRow?: string;
  pivotCol?: string;
  pivotValue?: string;
  pivotAggregation?: AggregationFn;
  pivotShowTotals?: boolean;

  // KPI
  kpiColumn?: string;
  kpiAggregation?: AggregationFn;

  // Universal — apply across chart types
  filters?: FilterCondition[];

  // Display
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      datasets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          original_filename: string;
          file_path: string;
          parsed_path: string | null;
          row_count: number | null;
          column_count: number | null;
          file_size_bytes: number;
          mime_type: string;
          file_hash: string | null;
          status: DatasetStatus;
          column_overrides: ColumnOverrides;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          original_filename: string;
          file_path: string;
          parsed_path?: string | null;
          row_count?: number | null;
          column_count?: number | null;
          file_size_bytes: number;
          mime_type: string;
          file_hash?: string | null;
          status?: DatasetStatus;
          column_overrides?: ColumnOverrides;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          original_filename?: string;
          file_path?: string;
          parsed_path?: string | null;
          row_count?: number | null;
          column_count?: number | null;
          file_size_bytes?: number;
          mime_type?: string;
          file_hash?: string | null;
          status?: DatasetStatus;
          column_overrides?: ColumnOverrides;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      charts: {
        Row: {
          id: string;
          user_id: string;
          dataset_id: string;
          name: string;
          chart_type: ChartType;
          config: ChartConfig;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dataset_id: string;
          name: string;
          chart_type: ChartType;
          config?: ChartConfig;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          dataset_id?: string;
          name?: string;
          chart_type?: ChartType;
          config?: ChartConfig;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      dashboards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          layout: DashboardLayoutItem[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          layout?: DashboardLayoutItem[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          layout?: DashboardLayoutItem[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Dataset = Database['public']['Tables']['datasets']['Row'];
export type Chart = Database['public']['Tables']['charts']['Row'];
export type Dashboard = Database['public']['Tables']['dashboards']['Row'];
