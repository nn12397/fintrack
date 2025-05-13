import { supabase } from '../lib/supabase';
import type { DebitCard } from '../types';

export async function getDebitCardsForUser(): Promise<DebitCard[]> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('debit_cards')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('name');

  if (error) {
    throw error;
  }

  return data.map(card => ({
    ...card,
    type: 'debit'
  })) as DebitCard[];
}

export async function getDebitCardById(id: string): Promise<DebitCard | null> {
  const { data, error } = await supabase
    .from('debit_cards')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    type: 'debit'
  } as DebitCard;
}

export async function getDebitCardByName(name: string): Promise<DebitCard | null> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('debit_cards')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('name', name)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    type: 'debit'
  } as DebitCard;
}