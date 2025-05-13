import { supabase } from '../lib/supabase';
import type { Paycheck } from '../types';
import { parseISO, format, isValid } from 'date-fns';

export async function getPaychecks() {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('paychecks')
    .select('*')
    .order('payment_date', { ascending: true });

  if (error) {
    throw error;
  }

  return data as Paycheck[];
}

export async function getUpcomingPaychecks() {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('paychecks')
    .select('*')
    .gte('payment_date', new Date().toISOString().split('T')[0])
    .order('payment_date', { ascending: true });

  if (error) {
    throw error;
  }

  return data as Paycheck[];
}

export async function getNextPaycheckDate(): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('paychecks')
    .select('payment_date')
    .gt('payment_date', today)
    .order('payment_date', { ascending: true })
    .limit(1);

  if (error) {
    throw error;
  }

  // Check if we have data and a payment date
  if (!data?.[0]?.payment_date) {
    return null;
  }

  // Validate the date string
  const dateStr = data[0].payment_date;
  const parsedDate = parseISO(dateStr);
  
  // Check if the parsed date is valid
  if (!isValid(parsedDate)) {
    console.error(`Invalid date found in database: ${dateStr}`);
    return null;
  }

  return format(parsedDate, 'yyyy-MM-dd');
}

// Alias for backward compatibility
export const getNextScheduledPayDate = getNextPaycheckDate;