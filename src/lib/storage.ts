import { supabase } from './supabase';

const BUCKET = 'datasets';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Upload a raw file (CSV/XLSX) to the user's folder.
 * Path convention: {userId}/{fileId}.{ext}
 */
export async function uploadRawFile(opts: {
  userId: string;
  fileId: string;
  file: File;
  ext: string;
}): Promise<string> {
  const path = `${opts.userId}/${opts.fileId}.${opts.ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, opts.file, {
    cacheControl: '3600',
    upsert: false,
    contentType: opts.file.type || undefined,
  });
  if (error) throw error;
  return path;
}

/**
 * Upload the parsed JSON blob alongside the raw file.
 * Path convention: {userId}/{fileId}.json
 */
export async function uploadParsedJSON(opts: {
  userId: string;
  fileId: string;
  data: unknown;
}): Promise<string> {
  const path = `${opts.userId}/${opts.fileId}.json`;
  const blob = new Blob([JSON.stringify(opts.data)], { type: 'application/json' });
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    cacheControl: '3600',
    upsert: false,
    contentType: 'application/json',
  });
  if (error) throw error;
  return path;
}

/**
 * Delete one or more files from the datasets bucket.
 * Safe to call on paths that don't exist.
 */
export async function deleteFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw error;
}

/**
 * Download a parsed JSON blob and return it as a JS object.
 * Used by Day 4's preview screen.
 */
export async function downloadParsedJSON<T = unknown>(path: string): Promise<T> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw error;
  const text = await data.text();
  return JSON.parse(text) as T;
}
