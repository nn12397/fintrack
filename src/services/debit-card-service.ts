import { supabase } from '../lib/supabase';
import type { DebitCard } from '../types';

export async function getDebitCards() {
  const { data, error } = await supabase
    .from('debit_cards')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('name');
  
  if (error) {
    throw error;
  }
  
  return data as DebitCard[];
}

export async function getDebitCard(id: string) {
  const { data, error } = await supabase
    .from('debit_cards')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as DebitCard;
}

export async function createDebitCard(card: Omit<DebitCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('debit_cards')
    .insert({
      ...card,
      user_id: userData.user.id,
    })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as DebitCard;
}

export async function updateDebitCard(id: string, card: Partial<Omit<DebitCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('debit_cards')
    .update({
      ...card,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as DebitCard;
}

export async function deleteDebitCard(id: string) {
  const { error } = await supabase
    .from('debit_cards')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
  
  return true;
}