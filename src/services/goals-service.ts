import { supabase } from '../lib/supabase';
import { calculateFinancialSummary } from './budget-service';
import { addMonths, format } from 'date-fns';
import type { PurchaseGoal } from '../types';

export async function getPurchaseGoals() {
  const { data, error } = await supabase
    .from('purchase_goals')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    throw error;
  }
  
  return (data as PurchaseGoal[]).map(goal => ({
    ...goal,
    progress: goal.target_amount > 0 
      ? (goal.current_amount / goal.target_amount) * 100 
      : 0
  }));
}

export async function getPurchaseGoal(id: string) {
  const { data, error } = await supabase
    .from('purchase_goals')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw error;
  }
  
  const goal = data as PurchaseGoal;
  return {
    ...goal,
    progress: goal.target_amount > 0 
      ? (goal.current_amount / goal.target_amount) * 100 
      : 0
  };
}

export async function createPurchaseGoal(goal: Omit<PurchaseGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'progress' | 'estimated_completion'>) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('purchase_goals')
    .insert({
      ...goal,
      user_id: userData.user.id,
    })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  const newGoal = data as PurchaseGoal;
  return {
    ...newGoal,
    progress: newGoal.target_amount > 0 
      ? (newGoal.current_amount / newGoal.target_amount) * 100 
      : 0
  };
}

export async function updatePurchaseGoal(id: string, goal: Partial<Omit<PurchaseGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'progress' | 'estimated_completion'>>) {
  const { data, error } = await supabase
    .from('purchase_goals')
    .update({
      ...goal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  const updatedGoal = data as PurchaseGoal;
  return {
    ...updatedGoal,
    progress: updatedGoal.target_amount > 0 
      ? (updatedGoal.current_amount / updatedGoal.target_amount) * 100 
      : 0
  };
}

export async function deletePurchaseGoal(id: string) {
  const { error } = await supabase
    .from('purchase_goals')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
  
  return true;
}

export async function estimateGoalCompletion(goalId: string, monthlyContribution?: number): Promise<string> {
  // Get the goal details
  const goal = await getPurchaseGoal(goalId);
  
  // If the goal is already complete, return current date
  if (goal.current_amount >= goal.target_amount) {
    return format(new Date(), 'yyyy-MM-dd');
  }
  
  // If monthly contribution is provided, use it, otherwise calculate from financial summary
  let contribution = monthlyContribution;
  if (!contribution) {
    const summary = await calculateFinancialSummary();
    // Default to 10% of available income for this goal
    contribution = summary.available_income * 0.1;
  }
  
  // If no contribution possible, return null
  if (!contribution || contribution <= 0) {
    return '';
  }
  
  // Calculate remaining amount needed
  const remaining = goal.target_amount - goal.current_amount;
  
  // Calculate months needed
  const monthsNeeded = Math.ceil(remaining / contribution);
  
  // Calculate estimated completion date
  const completionDate = addMonths(new Date(), monthsNeeded);
  return format(completionDate, 'yyyy-MM-dd');
}