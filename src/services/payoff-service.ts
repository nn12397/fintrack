import { supabase } from '../lib/supabase';
import type { PayoffPlan } from '../types';

export async function getPayoffPlans(): Promise<PayoffPlan[]> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('payoff_plans')
    .select(`
      *,
      selected_cards (
        id,
        name
      ),
      payoff_timeline:payoff_plan_timelines (
        total_months,
        total_interest,
        cards:payoff_plan_card_timelines (
          card_id,
          months_to_payoff
        )
      )
    `)
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data as PayoffPlan[];
}