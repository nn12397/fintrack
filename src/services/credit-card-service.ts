import { supabase } from '../lib/supabase';
import type { CreditCard } from '../types';

export async function getCreditCards() {
  const { data: cardsData, error: cardsError } = await supabase
    .from('credit_cards')
    .select('*')
    .order('name');
  
  if (cardsError) {
    throw cardsError;
  }

  // Get recent and upcoming payments for each card
  const cards = await Promise.all(cardsData.map(async (card) => {
    // Get recent payments (last 3)
    const { data: recentPayments } = await supabase
      .from('credit_card_payments')
      .select('*')
      .eq('credit_card_id', card.id)
      .lte('payment_date', new Date().toISOString())
      .order('payment_date', { ascending: false })
      .limit(3);

    // Get upcoming payments (next 3)
    const { data: upcomingPayments } = await supabase
      .from('credit_card_payments')
      .select('*')
      .eq('credit_card_id', card.id)
      .gt('payment_date', new Date().toISOString())
      .order('payment_date', { ascending: true })
      .limit(3);

    return {
      ...card,
      type: 'credit',
      utilization: card.credit_limit > 0 
        ? (card.current_balance / card.credit_limit) * 100 
        : 0,
      recent_payments: recentPayments || [],
      planned_payments: upcomingPayments || []
    };
  }));
  
  return cards as CreditCard[];
}

export async function getCreditCard(id: string) {
  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw error;
  }
  
  return {
    ...data,
    type: 'credit',
    utilization: data.credit_limit > 0 
      ? (data.current_balance / data.credit_limit) * 100 
      : 0
  } as CreditCard;
}

export async function createCreditCard(card: Omit<CreditCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }
  
  // Remove client-side only properties before sending to Supabase
  const { planned_payments, recent_payments, type, utilization, ...cardData } = card;
  
  const { data, error } = await supabase
    .from('credit_cards')
    .insert({
      ...cardData,
      user_id: userData.user.id,
    })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return {
    ...data,
    type: 'credit',
    utilization: data.credit_limit > 0 
      ? (data.current_balance / data.credit_limit) * 100 
      : 0
  } as CreditCard;
}

export async function updateCreditCard(id: string, card: Partial<Omit<CreditCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  // Remove client-side only properties before sending to Supabase
  const { planned_payments, recent_payments, type, utilization, ...cardData } = card;
  
  const { data, error } = await supabase
    .from('credit_cards')
    .update({
      ...cardData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return {
    ...data,
    type: 'credit',
    utilization: data.credit_limit > 0 
      ? (data.current_balance / data.credit_limit) * 100 
      : 0
  } as CreditCard;
}

export async function deleteCreditCard(id: string) {
  const { error } = await supabase
    .from('credit_cards')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
  
  return true;
}