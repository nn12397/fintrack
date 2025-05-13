import { supabase } from '../lib/supabase';
import type { SavingsPayment } from '../types';

export async function getSavingsPayments(savingsId: string) {
  const { data, error } = await supabase
    .from('savings_payments')
    .select('*')
    .eq('savings_id', savingsId)
    .order('payment_date', { ascending: false });

  if (error) throw error;
  return data as SavingsPayment[];
}

export async function getRecentSavingsPayments(limit: number = 5) {
  const { data, error } = await supabase
    .from('savings_payments')
    .select('*')
    .order('payment_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as SavingsPayment[];
}

export async function createSavingsPayment(payment: Omit<SavingsPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('savings_payments')
    .insert({
      savings_id: payment.savings_id,
      amount: payment.amount,
      payment_date: payment.payment_date,
      payment_type: payment.payment_type,
      user_id: userData.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as SavingsPayment;
}

export async function updateSavingsPayment(id: string, payment: Partial<Omit<SavingsPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('savings_payments')
    .update({
      ...payment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as SavingsPayment;
}

export async function deleteSavingsPayment(id: string) {
  const { error } = await supabase
    .from('savings_payments')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function updatePaymentPaidStatus(id: string, paidStatus: boolean | null) {
  const { data, error } = await supabase
    .from('savings_payments')
    .update({
      paid_status: paidStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as SavingsPayment;
}