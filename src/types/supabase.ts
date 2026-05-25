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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Dataset = Database['public']['Tables']['datasets']['Row'];
