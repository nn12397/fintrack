import { supabase } from '../lib/supabase';
import type { SavingsPlan } from '../types';

export async function getSavingsPlans(): Promise<SavingsPlan[]> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('savings_plans')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data as SavingsPlan[];
}

export async function createSavingsPlan(plan: Partial<SavingsPlan>): Promise<SavingsPlan> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('savings_plans')
    .insert({
      ...plan,
      user_id: userData.user.id,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SavingsPlan;
}

export async function updateSavingsPlan(id: string, plan: Partial<SavingsPlan>): Promise<SavingsPlan> {
  const { data, error } = await supabase
    .from('savings_plans')
    .update({
      ...plan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SavingsPlan;
}

export async function deleteSavingsPlan(id: string): Promise<void> {
  const { error } = await supabase
    .from('savings_plans')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}