import { supabase } from './supabase';
import type { Dashboard, DashboardLayoutItem } from '@/types/supabase';

export async function listDashboards(userId: string): Promise<Dashboard[]> {
  const { data, error } = await supabase
    .from('dashboards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getDashboard(id: string): Promise<Dashboard | null> {
  const { data, error } = await supabase
    .from('dashboards')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function insertDashboard(row: {
  user_id: string;
  name: string;
  description?: string;
  layout?: DashboardLayoutItem[];
}): Promise<Dashboard> {
  const { data, error } = await supabase
    .from('dashboards')
    .insert({ ...row, layout: row.layout ?? [] })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateDashboard(
  id: string,
  patch: Partial<Pick<Dashboard, 'name' | 'description' | 'layout'>>
): Promise<void> {
  const { error } = await supabase.from('dashboards').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteDashboard(id: string): Promise<void> {
  const { error } = await supabase.from('dashboards').delete().eq('id', id);
  if (error) throw error;
}
