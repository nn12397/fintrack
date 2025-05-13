import { supabase } from '../lib/supabase';
import type { SavingsAccount } from '../types';

export async function getSavingsAccounts(): Promise<SavingsAccount[]> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('savings_accounts')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data as SavingsAccount[];
}

export async function createSavingsAccount(account: Partial<SavingsAccount>): Promise<SavingsAccount> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('savings_accounts')
    .insert({
      ...account,
      user_id: userData.user.id,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SavingsAccount;
}

export async function updateSavingsAccount(id: string, account: Partial<SavingsAccount>): Promise<SavingsAccount> {
  const { data, error } = await supabase
    .from('savings_accounts')
    .update({
      ...account,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SavingsAccount;
}