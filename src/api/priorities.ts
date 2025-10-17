import { supabase } from "@/integrations/supabase/client";

export interface Priority {
  id: string;
  user_id: string;
  type: 'global_goal' | 'temporary_goal' | 'plan_trip' | 'plan_event';
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  location_name?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'paused';
  time_scope?: 'day' | 'week';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export async function fetchActivePriorities(type?: Priority['type']) {
  let query = supabase
    .from('priorities')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Priority[];
}

export async function createPriority(priority: Partial<Priority>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('priorities')
    .insert({ ...priority, user_id: user.id } as any)
    .select()
    .single();

  if (error) throw error;
  return data as Priority;
}

export async function updatePriority(id: string, updates: Partial<Priority>) {
  const { data, error } = await supabase
    .from('priorities')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Priority;
}

export async function deletePriority(id: string) {
  const { error } = await supabase
    .from('priorities')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function restorePriority(id: string) {
  const { error } = await supabase
    .from('priorities')
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) throw error;
}
