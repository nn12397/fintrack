import { supabase } from '../lib/supabase';
import type { CreditCardPayment } from '../types';

export async function getCreditCardPayments(creditCardId: string) {
  const { data, error } = await supabase
    .from('credit_card_payments')
    .select('*')
    .eq('credit_card_id', creditCardId)
    .order('payment_date', { ascending: false });
  
  if (error) {
    throw error;
  }
  
  return data as CreditCardPayment[];
}

export async function createCreditCardPayment(payment: Omit<CreditCardPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('credit_card_payments')
    .insert({
      ...payment,
      user_id: userData.user.id,
    })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as CreditCardPayment;
}

export async function updateCreditCardPayment(id: string, payment: Partial<Omit<CreditCardPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('credit_card_payments')
    .update({
      ...payment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as CreditCardPayment;
}

export async function deleteCreditCardPayment(id: string) {
  const { error } = await supabase
    .from('credit_card_payments')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
  
  return true;
}