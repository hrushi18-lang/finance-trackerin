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
      profiles: {
        Row: {
          id: string
          avatar_url: string | null
          created_at: string
          email: string | null
          avatar_url: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string
          name?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          affects_balance: boolean
          amount: number
          attachments: Json | null
          category: string
          created_at: string
          date: string
          description: string
          exchange_rate: number
          is_refund: boolean
          is_split: boolean
          notes: string | null
          date: string
          created_at: string
          updated_at: string
          recurring_transaction_id: string | null
        }
        Insert: {
          id?: string
          account_id: string
          affects_balance?: boolean
          amount: number
          attachments?: Json | null
          category: string
          created_at?: string
          date: string
          description: string
          exchange_rate?: number
          is_refund?: boolean
          is_split?: boolean
          notes?: string | null
          original_amount?: number | null
          original_currency?: string | null
          original_transaction_id?: string | null
          date: string
          created_at?: string
          updated_at?: string
          recurring_transaction_id?: string | null
        }
        Update: {
          id?: string
          account_id?: string
          affects_balance?: boolean
          amount?: number
          attachments?: Json | null
          category?: string
          created_at?: string
          date?: string
          description?: string
          exchange_rate?: number
          is_refund?: boolean
          is_split?: boolean
          notes?: string | null
          original_amount?: number | null
          original_currency?: string | null
          description?: string
          date?: string
          updated_at?: string
          recurring_transaction_id?: string | null
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          category: string
          created_at: string
          current_amount: number | null
          description: string | null
          target_date: string
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          created_at?: string
          current_amount?: number | null
          description?: string | null
          target_date: string
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: string
          created_at?: string
          current_amount?: number | null
          description?: string | null
          target_date?: string
          category?: string
          updated_at?: string
        }
      }
      liabilities: {
        Row: {
          id: string
          user_id: string
          created_at: string
          due_date: string
          interest_rate: number
          monthly_payment: number
          interest_rate: number
          monthly_payment: number
          due_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          due_date: string
          interest_rate: number
          monthly_payment: number
          interest_rate: number
          monthly_payment: number
          due_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          due_date?: string
          interest_rate?: number
          monthly_payment?: number
          interest_rate?: number
          monthly_payment?: number
          due_date?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          amount: number
          category: string
          created_at: string
          period: 'weekly' | 'monthly' | 'yearly'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          amount: number
          created_at?: string
          period: 'weekly' | 'monthly' | 'yearly'
          spent?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          amount?: number
          created_at?: string
          period?: 'weekly' | 'monthly' | 'yearly'
          spent?: number | null
          updated_at?: string
        }
      }
      recurring_transactions: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
          account_id: string | null
          auto_create: boolean
          auto_pay: boolean
          auto_process: boolean
          bill_type: string | null
          start_date: string
          end_date: string | null
          is_bill: boolean
          last_reminder_sent: string | null
          next_occurrence_date: string
          last_processed_date: string | null
          notification_days: number
          is_active: boolean
          day_of_week: number | null
          day_of_month: number | null
          month_of_year: number | null
          max_occurrences: number | null
          current_occurrences: number
          created_at: string
          priority: string
          reminder_days: number
          smart_reminders: boolean
          status: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
          start_date: string
          auto_create?: boolean
          auto_pay?: boolean
          auto_process?: boolean
          bill_type?: string | null
          end_date?: string | null
          is_bill?: boolean
          last_reminder_sent?: string | null
          next_occurrence_date: string
          last_processed_date?: string | null
          is_active?: boolean
          notification_days?: number
          priority?: string
          day_of_week?: number | null
          day_of_month?: number | null
          month_of_year?: number | null
          max_occurrences?: number | null
          current_occurrences?: number
          created_at?: string
          updated_at?: string
          reminder_days?: number
          smart_reminders?: boolean
          status?: string | null
        }
        Update: {
          id?: string
          account_id?: string | null
          user_id?: string
          type?: 'income' | 'expense'
          amount?: number
          category?: string
          description?: string
          frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
          start_date?: string
          end_date?: string | null
          auto_create?: boolean
          auto_pay?: boolean
          auto_process?: boolean
          bill_type?: string | null
          is_bill?: boolean
          last_reminder_sent?: string | null
          next_occurrence_date?: string
          last_processed_date?: string | null
          is_active?: boolean
          notification_days?: number
          day_of_week?: number | null
          priority?: string
          day_of_month?: number | null
          month_of_year?: number | null
          max_occurrences?: number | null
          current_occurrences?: number
          created_at?: string
          updated_at?: string
        }
        reminder_days?: number
        smart_reminders?: boolean
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}