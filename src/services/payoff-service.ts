import { supabase } from '../lib/supabase';
import { getCreditCard } from './credit-card-service';
import type { PayoffPlan, PayoffTimeline, CreditCard, PayoffCardDetail } from '../types';

export async function getPayoffPlans() {
  const { data, error } = await supabase
    .from('payoff_plans')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    throw error;
  }
  
  const plans = data as PayoffPlan[];
  
  // Fetch details for each plan
  const plansWithDetails = await Promise.all(
    plans.map(async (plan) => {
      const selectedCards = await Promise.all(
        plan.cards.map(cardId => getCreditCard(cardId))
      );
      
      const payoffTimeline = calculatePayoffTimeline(
        selectedCards, 
        plan.strategy, 
        plan.monthly_payment,
        plan.target_months
      );
      
      return {
        ...plan,
        selected_cards: selectedCards,
        payoff_timeline: payoffTimeline
      };
    })
  );
  
  return plansWithDetails;
}

export async function getPayoffPlan(id: string) {
  const { data, error } = await supabase
    .from('payoff_plans')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw error;
  }
  
  const plan = data as PayoffPlan;
  
  // Fetch selected cards
  const selectedCards = await Promise.all(
    plan.cards.map(cardId => getCreditCard(cardId))
  );
  
  // Calculate payoff timeline
  const payoffTimeline = calculatePayoffTimeline(
    selectedCards, 
    plan.strategy, 
    plan.monthly_payment,
    plan.target_months
  );
  
  return {
    ...plan,
    selected_cards: selectedCards,
    payoff_timeline: payoffTimeline
  };
}

export async function createPayoffPlan(plan: Omit<PayoffPlan, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'selected_cards' | 'payoff_timeline'>) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('payoff_plans')
    .insert({
      ...plan,
      user_id: userData.user.id,
    })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as PayoffPlan;
}

export async function updatePayoffPlan(id: string, plan: Partial<Omit<PayoffPlan, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'selected_cards' | 'payoff_timeline'>>) {
  const { data, error } = await supabase
    .from('payoff_plans')
    .update({
      ...plan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as PayoffPlan;
}

export async function deletePayoffPlan(id: string) {
  const { error } = await supabase
    .from('payoff_plans')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
  
  return true;
}

// Calculation functions
export function calculatePayoffTimeline(
  cards: CreditCard[],
  strategy: PayoffPlan['strategy'],
  monthlyPayment: number,
  targetMonths: number | null
): PayoffTimeline {
  // Clone cards to avoid modifying originals
  const workingCards = cards.map(card => ({
    ...card,
    currentBalance: card.current_balance,
    monthlyInterestRate: card.interest_rate / 100 / 12,
  }));
  
  // Sort cards based on strategy
  switch (strategy) {
    case 'highest_interest':
      workingCards.sort((a, b) => b.interest_rate - a.interest_rate);
      break;
    case 'lowest_balance':
      workingCards.sort((a, b) => a.current_balance - b.current_balance);
      break;
    case 'highest_balance':
      workingCards.sort((a, b) => b.current_balance - a.current_balance);
      break;
    // For custom, use the order provided
  }
  
  // Calculate minimum payment total
  const totalMinimumPayment = workingCards.reduce(
    (sum, card) => sum + card.minimum_payment, 
    0
  );
  
  // Ensure monthly payment is at least the sum of minimum payments
  const availablePayment = Math.max(monthlyPayment, totalMinimumPayment);
  
  // Initialize trackers
  const cardPayments: Record<string, number[]> = {};
  workingCards.forEach(card => {
    cardPayments[card.id] = [];
  });
  
  let totalMonths = 0;
  let totalInterestPaid = 0;
  let remainingBalance = workingCards.reduce(
    (sum, card) => sum + card.currentBalance, 
    0
  );
  
  // Simulation loop - max 360 months (30 years) as safety
  while (remainingBalance > 0 && totalMonths < 360) {
    totalMonths++;
    let remainingMonthlyPayment = availablePayment;
    
    // Pay minimum on all cards
    workingCards.forEach(card => {
      if (card.currentBalance <= 0) return;
      
      // Calculate interest
      const interestAmount = card.currentBalance * card.monthlyInterestRate;
      totalInterestPaid += interestAmount;
      
      // Apply minimum payment
      const minimumPayment = Math.min(card.minimum_payment, card.currentBalance + interestAmount);
      card.currentBalance = card.currentBalance + interestAmount - minimumPayment;
      remainingMonthlyPayment -= minimumPayment;
      
      // Record payment
      cardPayments[card.id].push(minimumPayment);
    });
    
    // Apply extra payment according to strategy
    for (const card of workingCards) {
      if (card.currentBalance <= 0 || remainingMonthlyPayment <= 0) continue;
      
      const extraPayment = Math.min(remainingMonthlyPayment, card.currentBalance);
      card.currentBalance -= extraPayment;
      remainingMonthlyPayment -= extraPayment;
      
      // Update the last payment record to include the extra amount
      const lastIndex = cardPayments[card.id].length - 1;
      cardPayments[card.id][lastIndex] += extraPayment;
      
      if (remainingMonthlyPayment <= 0) break;
    }
    
    // Recalculate remaining balance
    remainingBalance = workingCards.reduce(
      (sum, card) => sum + card.currentBalance, 
      0
    );
  }
  
  // Create result object
  const cardDetails: PayoffCardDetail[] = workingCards.map(card => ({
    card_id: card.id,
    card_name: card.name,
    months_to_payoff: cardPayments[card.id].length,
    interest_paid: cardPayments[card.id].reduce((sum, payment) => sum + payment, 0) - card.current_balance,
    monthly_payments: cardPayments[card.id]
  }));
  
  return {
    total_months: totalMonths,
    total_interest: totalInterestPaid,
    cards: cardDetails
  };
}

export function calculateOptimalPayment(
  cards: CreditCard[],
  targetMonths: number
): number {
  if (cards.length === 0 || targetMonths <= 0) {
    return 0;
  }
  
  // Total debt
  const totalDebt = cards.reduce((sum, card) => sum + card.current_balance, 0);
  
  // Sum of minimum payments
  const totalMinimum = cards.reduce((sum, card) => sum + card.minimum_payment, 0);
  
  // Starting guess - simple division of debt by months
  let lowPayment = totalMinimum;
  let highPayment = (totalDebt / targetMonths) * 1.5; // Add buffer for interest
  
  // Binary search to find optimal payment
  while (highPayment - lowPayment > 1) {
    const midPayment = (lowPayment + highPayment) / 2;
    const timeline = calculatePayoffTimeline(cards, 'highest_interest', midPayment, null);
    
    if (timeline.total_months <= targetMonths) {
      highPayment = midPayment;
    } else {
      lowPayment = midPayment;
    }
  }
  
  // Return the higher payment to ensure we meet the target
  return Math.ceil(highPayment);
}