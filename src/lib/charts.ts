import { supabase } from './supabase';
import type { Chart, ChartConfig, ChartType } from '@/types/supabase';

export async function listCharts(userId: string): Promise<Chart[]> {
  const { data, error } = await supabase
    .from('charts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function listChartsForDataset(userId: string, datasetId: string): Promise<Chart[]> {
  const { data, error } = await supabase
    .from('charts')
    .select('*')
    .eq('user_id', userId)
    .eq('dataset_id', datasetId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getChart(id: string): Promise<Chart | null> {
  const { data, error } = await supabase.from('charts').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function insertChart(row: {
  user_id: string;
  dataset_id: string;
  name: string;
  chart_type: ChartType;
  config: ChartConfig;
}): Promise<Chart> {
  const { data, error } = await supabase.from('charts').insert(row).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateChart(
  id: string,
  patch: { name?: string; chart_type?: ChartType; config?: ChartConfig }
): Promise<void> {
  const { error } = await supabase.from('charts').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteChart(id: string): Promise<void> {
  const { error } = await supabase.from('charts').delete().eq('id', id);
  if (error) throw error;
}
