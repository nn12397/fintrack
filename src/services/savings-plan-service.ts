import { supabase } from '../lib/supabase';
import type { SavingsPlan } from '../types';

export async function getSavingsPlans() {
  const { data, error } = await supabase
    .from('savings_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as SavingsPlan[];
}

export async function createSavingsPlan(plan: Omit<SavingsPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('savings_plans')
    .insert({
      ...plan,
      user_id: userData.user.id,
      schedule_type: plan.schedule_type || 'Custom Schedule',
      payment_type: plan.payment_type || 'Monthly',
      plan_type: plan.plan_type || 'goal_amount',
    })
    .select()
    .single();

  if (error) throw error;
  return data as SavingsPlan;
}

export async function updateSavingsPlan(id: string, plan: Partial<Omit<SavingsPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('savings_plans')
    .update({
      ...plan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as SavingsPlan;
}

export async function deleteSavingsPlan(id: string) {
  const { error } = await supabase
    .from('savings_plans')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}