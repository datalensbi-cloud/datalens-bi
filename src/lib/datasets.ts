import { supabase } from './supabase';
import { deleteFiles } from './storage';
import type { Dataset, DatasetStatus } from '@/types/supabase';

export async function listDatasets(userId: string): Promise<Dataset[]> {
  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function findDuplicateByHash(opts: {
  userId: string;
  hash: string;
}): Promise<Dataset | null> {
  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .eq('user_id', opts.userId)
    .eq('file_hash', opts.hash)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function insertDataset(row: {
  id: string;
  user_id: string;
  name: string;
  original_filename: string;
  file_path: string;
  parsed_path: string;
  row_count: number;
  column_count: number;
  file_size_bytes: number;
  mime_type: string;
  file_hash: string;
  status: DatasetStatus;
}): Promise<Dataset> {
  const { data, error } = await supabase.from('datasets').insert(row).select('*').single();
  if (error) throw error;
  return data;
}

/**
 * Delete a dataset row AND its associated storage files in one shot.
 * If either step fails, throws — the caller should refresh the list to show truth.
 */
export async function deleteDataset(dataset: Dataset): Promise<void> {
  const paths = [dataset.file_path];
  if (dataset.parsed_path) paths.push(dataset.parsed_path);

  // Storage first — if DB delete succeeds but storage fails, we have orphaned files.
  // If storage succeeds but DB fails, we get a phantom row (recoverable on next list).
  // Choosing storage-first because it's more recoverable.
  await deleteFiles(paths);

  const { error } = await supabase.from('datasets').delete().eq('id', dataset.id);
  if (error) throw error;
}
