import { supabase } from '../lib/supabase';
import { getBills } from './bill-service';
import { getCreditCards } from './credit-card-service';
import { getUserProfile } from './profile-service';
import type { SpendingBudget, FinancialSummary } from '../types';

export async function getSpendingBudget() {
  const { data, error } = await supabase
    .from('spending_budgets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows gracefully
  
  if (error) {
    console.error('Error fetching spending budget:', error);
    return null;
  }
  
  return data as SpendingBudget | null;
}

export async function createSpendingBudget(budget: Omit<SpendingBudget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('spending_budgets')
    .insert({
      ...budget,
      user_id: userData.user.id,
    })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as SpendingBudget;
}

export async function updateSpendingBudget(id: string, budget: Partial<Omit<SpendingBudget, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('spending_budgets')
    .update({
      ...budget,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as SpendingBudget;
}

export async function calculateFinancialSummary(): Promise<FinancialSummary> {
  // Get user profile, bills, and credit cards
  const profile = await getUserProfile();
  const bills = await getBills();
  const creditCards = await getCreditCards();
  
  // Calculate monthly income
  const income = profile?.monthly_income || 0;
  
  // Calculate total monthly bills
  const monthlyBills = bills.reduce((total, bill) => {
    // Convert bill frequency to monthly amount
    let monthlyAmount = bill.amount;
    switch (bill.frequency) {
      case 'weekly':
        monthlyAmount *= 4.33; // Average weeks in a month
        break;
      case 'bi-weekly':
        monthlyAmount *= 2.17; // Average bi-weeks in a month
        break;
      case 'quarterly':
        monthlyAmount /= 3;
        break;
      case 'annually':
        monthlyAmount /= 12;
        break;
      // monthly is already correct
    }
    return total + monthlyAmount;
  }, 0);
  
  // Calculate total credit card minimums
  const totalMinimumPayments = creditCards.reduce(
    (total, card) => total + card.minimum_payment, 
    0
  );
  
  // Calculate total credit card debt
  const totalDebt = creditCards.reduce(
    (total, card) => total + card.current_balance, 
    0
  );
  
  // Calculate available income after bills and minimum payments
  const availableIncome = income - monthlyBills - totalMinimumPayments;
  
  // Calculate debt-to-income ratio
  const debtToIncomeRatio = income > 0 ? (totalDebt / income) : 0;
  
  return {
    income,
    total_bills: monthlyBills,
    total_debt: totalDebt,
    available_income: availableIncome,
    debt_to_income_ratio: debtToIncomeRatio
  };
}

export async function calculateRecommendedSpending(): Promise<{
  spending: number;
  debt_payment: number;
}> {
  const summary = await calculateFinancialSummary();
  
  // If no available income, return zeros
  if (summary.available_income <= 0) {
    return {
      spending: 0,
      debt_payment: 0
    };
  }
  
  // Calculate recommended allocation based on debt-to-income ratio
  let spendingRatio = 0.3; // Default 30% to spending
  
  // Adjust ratio based on debt-to-income
  if (summary.debt_to_income_ratio > 0.5) {
    // High debt - allocate more to debt payment
    spendingRatio = 0.2;
  } else if (summary.debt_to_income_ratio < 0.2) {
    // Low debt - allow more spending
    spendingRatio = 0.4;
  }
  
  const recommendedSpending = summary.available_income * spendingRatio;
  const recommendedDebtPayment = summary.available_income - recommendedSpending;
  
  return {
    spending: Math.round(recommendedSpending),
    debt_payment: Math.round(recommendedDebtPayment)
  };
}