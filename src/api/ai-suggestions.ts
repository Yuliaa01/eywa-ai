import { supabase } from "@/integrations/supabase/client";

export interface AISuggestion {
  id: string;
  user_id: string;
  title: string;
  reasoning?: string;
  category: 'movement' | 'nutrition' | 'sleep' | 'recovery' | 'mindset' | 'medical';
  date: string;
  duration_min?: number;
  completed_at?: string;
  context?: any;
  created_at: string;
  accepted?: boolean;
}

export async function fetchTodaySuggestions() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('activity_suggestions')
    .select('*')
    .eq('date', today)
    .is('completed_at', null)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) throw error;
  return data as AISuggestion[];
}

export async function generateSuggestions() {
  const { data, error } = await supabase.functions.invoke('generate-ai-suggestions');
  
  if (error) throw error;
  return data;
}

export async function completeSuggestion(id: string) {
  const { error } = await supabase
    .from('activity_suggestions')
    .update({ 
      completed_at: new Date().toISOString(),
      accepted: true 
    })
    .eq('id', id);

  if (error) throw error;
}

export async function dismissSuggestion(id: string) {
  const { error } = await supabase
    .from('activity_suggestions')
    .update({ 
      accepted: false 
    })
    .eq('id', id);

  if (error) throw error;
}
