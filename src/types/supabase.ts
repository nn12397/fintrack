export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bills: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          due_date: string
          category_id: string
          frequency: string
          is_autopay: boolean
          credit_card_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
          is_paid: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: number
          due_date: string
          category_id: string
          frequency: string
          is_autopay?: boolean
          credit_card_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          is_paid?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number
          due_date?: string
          category_id?: string
          frequency?: string
          is_autopay?: boolean
          credit_card_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          is_paid?: boolean
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      credit_cards: {
        Row: {
          id: string
          user_id: string
          name: string
          current_balance: number
          credit_limit: number
          interest_rate: number
          minimum_payment: number
          due_date: string
          is_autopay: boolean
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          current_balance: number
          credit_limit: number
          interest_rate: number
          minimum_payment: number
          due_date: string
          is_autopay?: boolean
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          current_balance?: number
          credit_limit?: number
          interest_rate?: number
          minimum_payment?: number
          due_date?: string
          is_autopay?: boolean
          updated_at?: string
          created_at?: string
        }
      }
      payoff_plans: {
        Row: {
          id: string
          user_id: string
          name: string
          cards: string[]
          strategy: string
          monthly_payment: number
          target_months: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          cards: string[]
          strategy: string
          monthly_payment: number
          target_months?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          cards?: string[]
          strategy?: string
          monthly_payment?: number
          target_months?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      spending_budgets: {
        Row: {
          id: string
          user_id: string
          amount: number
          frequency: string
          is_auto_calculated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          frequency: string
          is_auto_calculated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          frequency?: string
          is_auto_calculated?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          monthly_income: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          monthly_income: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          monthly_income?: number
          created_at?: string
          updated_at?: string
        }
      }
      purchase_goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_amount: number
          current_amount: number
          target_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target_amount: number
          current_amount?: number
          target_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_amount?: number
          current_amount?: number
          target_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      savings_plans: {
        Row: {
          id: string
          user_id: string
          savings_id: string
          name: string
          goal_amount: number
          target_date: string | null
          current_amount: number
          payment_frequency: string
          payment_amount: number
          payment_day: number | null
          payment_week_day: number | null
          start_date: string
          end_date: string | null
          is_active: boolean
          plan_type: 'goal_amount' | 'running_savings'
          schedule_type: 'Per Paycheck' | 'Custom Schedule'
          payment_type: 'Monthly' | 'Bi-Monthly' | 'Bi-Weekly' | 'Weekly'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          savings_id: string
          name: string
          goal_amount: number
          target_date?: string | null
          current_amount?: number
          payment_frequency: string
          payment_amount: number
          payment_day?: number | null
          payment_week_day?: number | null
          start_date: string
          end_date?: string | null
          is_active?: boolean
          plan_type?: 'goal_amount' | 'running_savings'
          schedule_type?: 'Per Paycheck' | 'Custom Schedule'
          payment_type?: 'Monthly' | 'Bi-Monthly' | 'Bi-Weekly' | 'Weekly'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          savings_id?: string
          name?: string
          goal_amount?: number
          target_date?: string | null
          current_amount?: number
          payment_frequency?: string
          payment_amount?: number
          payment_day?: number | null
          payment_week_day?: number | null
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          plan_type?: 'goal_amount' | 'running_savings'
          schedule_type?: 'Per Paycheck' | 'Custom Schedule'
          payment_type?: 'Monthly' | 'Bi-Monthly' | 'Bi-Weekly' | 'Weekly'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}