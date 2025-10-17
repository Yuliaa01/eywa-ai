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

  // Validation for temporary goals
  if (priority.type === 'temporary_goal') {
    if (!priority.time_scope || (priority.time_scope !== 'day' && priority.time_scope !== 'week')) {
      throw new Error('Temporary goals must have time_scope of "day" or "week"');
    }
    if (!priority.start_date || !priority.end_date) {
      throw new Error('Temporary goals must have valid start_date and end_date');
    }
  }

  // Validation for global goals
  if (priority.type === 'global_goal') {
    // time_scope not used for global goals
    const insertData = { ...priority, time_scope: null, user_id: user.id };
    const { data, error } = await supabase
      .from('priorities')
      .insert(insertData as any)
      .select()
      .single();
    if (error) throw error;
    return data as Priority;
  }

  const { data, error } = await supabase
    .from('priorities')
    .insert({ ...priority, user_id: user.id } as any)
    .select()
    .single();

  if (error) throw error;
  return data as Priority;
}

export async function updatePriority(id: string, updates: Partial<Priority>) {
  // Validation for temporary goals
  if (updates.type === 'temporary_goal') {
    if (updates.time_scope && updates.time_scope !== 'day' && updates.time_scope !== 'week') {
      throw new Error('Temporary goals must have time_scope of "day" or "week"');
    }
  }

  // For global goals, clear time_scope if being updated
  if (updates.type === 'global_goal') {
    updates = { ...updates, time_scope: null };
  }

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
