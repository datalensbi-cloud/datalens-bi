/**
 * Database schema types.
 * Will be auto-generated later via:
 *   npx supabase gen types typescript --project-id YOUR_REF > src/types/supabase.ts
 */
export type DatasetStatus = 'uploaded' | 'parsed' | 'parse_failed';

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
