import { supabase } from '../lib/supabase';
import type { SavingsPayment } from '../types';

export async function getRecentSavingsPayments(limit: number = 5): Promise<SavingsPayment[]> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('savings_payments')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('payment_date', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data as SavingsPayment[];
}

export async function createSavingsPayment(payment: Omit<SavingsPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<SavingsPayment> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('savings_payments')
    .insert({
      ...payment,
      user_id: userData.user.id,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SavingsPayment;
}

export async function deleteSavingsPayment(id: string): Promise<void> {
  const { error } = await supabase
    .from('savings_payments')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}