import { supabase } from '../lib/supabase';
import type { SavingsAccount, SavingsPlan, SavingsPayment } from '../types';

export async function getSavingsAccounts() {
  const { data, error } = await supabase
    .from('savings')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as SavingsAccount[];
}

export async function createSavingsAccount(account: Omit<SavingsAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  try {
    const { data, error } = await supabase
      .from('savings')
      .insert({
        ...account,
        user_id: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('A savings account with this ID already exists. Please try again.');
      }
      throw error;
    }

    return data as SavingsAccount;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create savings account');
  }
}

export async function updateSavingsAccount(id: string, account: Partial<Omit<SavingsAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('savings')
    .update({
      ...account,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as SavingsAccount;
}

export async function deleteSavingsAccount(id: string) {
  const { error } = await supabase
    .from('savings')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}