import { supabase } from '../lib/supabase';
import type { CreditCard } from '../types';

export async function getCreditCardsForUser(): Promise<CreditCard[]> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('name');

  if (error) {
    throw error;
  }

  return data.map(card => ({
    ...card,
    type: 'credit',
    utilization: card.credit_limit > 0 
      ? (card.current_balance / card.credit_limit) * 100 
      : 0
  })) as CreditCard[];
}

export async function getCreditCardById(id: string): Promise<CreditCard | null> {
  const { data, error } = await supabase
    .from('credit_cards')
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
    type: 'credit',
    utilization: data.credit_limit > 0 
      ? (data.current_balance / data.credit_limit) * 100 
      : 0
  } as CreditCard;
}

export async function getCreditCardByName(name: string): Promise<CreditCard | null> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('credit_cards')
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
    type: 'credit',
    utilization: data.credit_limit > 0 
      ? (data.current_balance / data.credit_limit) * 100 
      : 0
  } as CreditCard;
}