export interface User {
  id: string;
  email: string;
}

export interface DebitCard {
  id: string;
  user_id: string;
  name: string;
  bank_name: string;
  last_four_digits: string;
  available_balance: number;
  account_type: 'checking' | 'savings';
  is_primary: boolean;
  auto_reload_enabled: boolean;
  auto_reload_threshold: number | null;
  auto_reload_amount: number | null;
  created_at: string;
  updated_at: string;
  type: 'debit';
}

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  category_id: string;
  bill_type: 'one-time' | 'recurring';
  frequency: string;
  is_autopay: boolean;
  card_id: string | null;
  notes: string | null;
  recurrence_interval?: string;
  start_date?: string;
  end_date?: string;
  recurrence_day?: number;
  recurrence_week_day?: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  card?: CreditCard | DebitCard;
  is_paid: boolean;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  current_balance: number;
  credit_limit: number;
  interest_rate: number;
  minimum_payment: number;
  due_date: string;
  is_autopay: boolean;
  payment_amount: number;
  payment_frequency: PaymentFrequency;
  payment_day: number | null;
  payment_week_day: number | null;
  payment_start_date: string | null;
  payment_end_date: string | null;
  created_at: string;
  updated_at: string;
  utilization?: number;
  recent_payments?: CreditCardPayment[];
  planned_payments?: CreditCardPayment[];
  type: 'credit';
}

export interface CreditCardPayment {
  id: string;
  credit_card_id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  previous_balance: number;
  new_balance: number;
  payment_type: 'one-time' | 'recurring';
  recurrence_interval?: string;
  start_date?: string;
  end_date?: string;
  recurrence_day?: number;
  recurrence_week_day?: number;
  created_at: string;
  updated_at: string;
}

export type PaymentFrequency = 'weekly' | 'bi-weekly' | 'bi-monthly' | 'monthly';

export interface PayoffPlan {
  id: string;
  user_id: string;
  name: string;
  cards: string[];
  strategy: 'highest_interest' | 'lowest_balance' | 'highest_balance' | 'custom';
  monthly_payment: number;
  target_months: number | null;
  created_at: string;
  updated_at: string;
  selected_cards?: CreditCard[];
  payoff_timeline?: PayoffTimeline;
}

export interface PayoffTimeline {
  total_months: number;
  total_interest: number;
  cards: PayoffCardDetail[];
}

export interface PayoffCardDetail {
  card_id: string;
  card_name: string;
  months_to_payoff: number;
  interest_paid: number;
  monthly_payments: number[];
}

export interface SpendingBudget {
  id: string;
  user_id: string;
  amount: number;
  frequency: string;
  is_auto_calculated: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  created_at: string;
  updated_at: string;
  progress?: number;
}

export interface Paycheck {
  id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  frequency: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  income_amount: number;
  income_frequency: 'weekly' | 'bi-weekly' | 'bi-monthly' | 'monthly' | 'specific-date';
  income_day: number | null;  // For monthly: 1-31, For bi-weekly: 0-6 (Sunday-Saturday)
  income_start_date: string | null;
  user_entry_next_paydate: string | null;  // For bi-weekly frequency
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  income: number;
  total_bills: number;
  total_debt: number;
  available_income: number;
  debt_to_income_ratio: number;
}

export interface SavingsAccount {
  id: string;
  user_id: string;
  name: string;
  account_type: 'financial_institute' | 'cash' | 'piggy_bank';
  institution_name: string | null;
  current_balance: number;
  target_balance: number | null;
  notes: string | null;
  is_primary: boolean;
  auto_transfer_enabled: boolean;
  auto_transfer_threshold: number | null;
  auto_transfer_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsPlan {
  id: string;
  savings_id: string;
  name: string;
  goal_amount: number;
  target_date: string;
  current_amount: number;
  payment_frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'specific-date';
  payment_amount: number;
  payment_day: number | null;
  payment_week_day: number | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  plan_type: 'goal_amount' | 'running_savings';
  schedule_type: 'Per Paycheck' | 'Custom Schedule';
  payment_type: 'Monthly' | 'Bi-Monthly' | 'Bi-Weekly' | 'Weekly';
  created_at: string;
  updated_at: string;
}

export interface SavingsPayment {
  id: string;
  savings_id: string;
  amount: number;
  payment_date: string;
  payment_type: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}