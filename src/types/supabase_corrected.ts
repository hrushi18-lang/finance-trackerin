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
          updated_at?: string
        }
      }
      financial_accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'bank_savings' | 'bank_current' | 'bank_student' | 'digital_wallet' | 'cash' | 'credit_card' | 'investment'
          balance: number
          institution: string | null
          platform: string | null
          account_number: string | null
          is_visible: boolean
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'bank_savings' | 'bank_current' | 'bank_student' | 'digital_wallet' | 'cash' | 'credit_card' | 'investment'
          balance?: number
          institution?: string | null
          platform?: string | null
          account_number?: string | null
          is_visible?: boolean
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'bank_savings' | 'bank_current' | 'bank_student' | 'digital_wallet' | 'cash' | 'credit_card' | 'investment'
          balance?: number
          institution?: string | null
          platform?: string | null
          account_number?: string | null
          is_visible?: boolean
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
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
          original_amount: number | null
          original_currency: string | null
          original_transaction_id: string | null
          reason: string | null
          recurring_transaction_id: string | null
          status: 'completed' | 'pending' | 'cancelled'
          transfer_to_account_id: string | null
          type: 'income' | 'expense' | 'transfer'
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
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
          reason?: string | null
          recurring_transaction_id?: string | null
          status?: 'completed' | 'pending' | 'cancelled'
          transfer_to_account_id?: string | null
          type: 'income' | 'expense' | 'transfer'
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
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
          original_transaction_id?: string | null
          reason?: string | null
          recurring_transaction_id?: string | null
          status?: 'completed' | 'pending' | 'cancelled'
          transfer_to_account_id?: string | null
          type?: 'income' | 'expense' | 'transfer'
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          category: string
          created_at: string
          current_amount: number | null
          description: string | null
          is_archived: boolean
          target_amount: number
          target_date: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          category: string
          created_at?: string
          current_amount?: number | null
          description?: string | null
          is_archived?: boolean
          target_amount: number
          target_date: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          category?: string
          created_at?: string
          current_amount?: number | null
          description?: string | null
          is_archived?: boolean
          target_amount?: number
          target_date?: string
          updated_at?: string
        }
      }
      liabilities: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          created_at: string
          due_date: string
          interest_rate: number
          monthly_payment: number
          name: string
          remaining_amount: number
          status: 'active' | 'paid_off' | 'defaulted' | 'restructured' | 'closed'
          total_amount: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          created_at?: string
          due_date: string
          interest_rate: number
          monthly_payment: number
          name: string
          remaining_amount: number
          status?: 'active' | 'paid_off' | 'defaulted' | 'restructured' | 'closed'
          total_amount: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          created_at?: string
          due_date?: string
          interest_rate?: number
          monthly_payment?: number
          name?: string
          remaining_amount?: number
          status?: 'active' | 'paid_off' | 'defaulted' | 'restructured' | 'closed'
          total_amount?: number
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          amount: number
          category: string
          created_at: string
          period: 'weekly' | 'monthly' | 'yearly'
          spent: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
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
          account_id?: string | null
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
          account_id: string | null
          amount: number
          auto_create: boolean
          auto_pay: boolean
          auto_process: boolean
          bill_type: string | null
          category: string
          created_at: string
          current_occurrences: number
          day_of_month: number | null
          day_of_week: number | null
          description: string
          end_date: string | null
          frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
          is_active: boolean
          is_bill: boolean
          last_processed_date: string | null
          last_reminder_sent: string | null
          max_occurrences: number | null
          month_of_year: number | null
          next_occurrence_date: string
          notification_days: number
          payment_method: string | null
          priority: string
          reminder_days: number
          smart_reminders: boolean
          start_date: string
          status: string | null
          type: 'income' | 'expense'
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          amount: number
          auto_create?: boolean
          auto_pay?: boolean
          auto_process?: boolean
          bill_type?: string | null
          category: string
          created_at?: string
          current_occurrences?: number
          day_of_month?: number | null
          day_of_week?: number | null
          description: string
          end_date?: string | null
          frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
          is_active?: boolean
          is_bill?: boolean
          last_processed_date?: string | null
          last_reminder_sent?: string | null
          max_occurrences?: number | null
          month_of_year?: number | null
          next_occurrence_date: string
          notification_days?: number
          payment_method?: string | null
          priority?: string
          reminder_days?: number
          smart_reminders?: boolean
          start_date: string
          status?: string | null
          type: 'income' | 'expense'
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          amount?: number
          auto_create?: boolean
          auto_pay?: boolean
          auto_process?: boolean
          bill_type?: string | null
          category?: string
          created_at?: string
          current_occurrences?: number
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string
          end_date?: string | null
          frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
          is_active?: boolean
          is_bill?: boolean
          last_processed_date?: string | null
          last_reminder_sent?: string | null
          max_occurrences?: number | null
          month_of_year?: number | null
          next_occurrence_date?: string
          notification_days?: number
          payment_method?: string | null
          priority?: string
          reminder_days?: number
          smart_reminders?: boolean
          start_date?: string
          status?: string | null
          type?: 'income' | 'expense'
          updated_at?: string
        }
      }
      enhanced_liabilities: {
        Row: {
          id: string
          user_id: string
          name: string
          liability_type: 'personal_loan' | 'student_loan' | 'auto_loan' | 'mortgage' | 'credit_card' | 'bnpl' | 'installment' | 'other'
          description: string | null
          total_amount: number
          remaining_amount: number
          interest_rate: number
          monthly_payment: number | null
          minimum_payment: number | null
          payment_day: number
          loan_term_months: number | null
          remaining_term_months: number | null
          start_date: string
          due_date: string | null
          next_payment_date: string | null
          linked_asset_id: string | null
          is_secured: boolean
          disbursement_account_id: string | null
          default_payment_account_id: string | null
          provides_funds: boolean
          affects_credit_score: boolean
          status: 'active' | 'paid_off' | 'defaulted' | 'restructured' | 'closed'
          is_active: boolean
          auto_generate_bills: boolean
          bill_generation_day: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          liability_type: 'personal_loan' | 'student_loan' | 'auto_loan' | 'mortgage' | 'credit_card' | 'bnpl' | 'installment' | 'other'
          description?: string | null
          total_amount: number
          remaining_amount: number
          interest_rate?: number
          monthly_payment?: number | null
          minimum_payment?: number | null
          payment_day?: number
          loan_term_months?: number | null
          remaining_term_months?: number | null
          start_date: string
          due_date?: string | null
          next_payment_date?: string | null
          linked_asset_id?: string | null
          is_secured?: boolean
          disbursement_account_id?: string | null
          default_payment_account_id?: string | null
          provides_funds?: boolean
          affects_credit_score?: boolean
          status?: 'active' | 'paid_off' | 'defaulted' | 'restructured' | 'closed'
          is_active?: boolean
          auto_generate_bills?: boolean
          bill_generation_day?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          liability_type?: 'personal_loan' | 'student_loan' | 'auto_loan' | 'mortgage' | 'credit_card' | 'bnpl' | 'installment' | 'other'
          description?: string | null
          total_amount?: number
          remaining_amount?: number
          interest_rate?: number
          monthly_payment?: number | null
          minimum_payment?: number | null
          payment_day?: number
          loan_term_months?: number | null
          remaining_term_months?: number | null
          start_date?: string
          due_date?: string | null
          next_payment_date?: string | null
          linked_asset_id?: string | null
          is_secured?: boolean
          disbursement_account_id?: string | null
          default_payment_account_id?: string | null
          provides_funds?: boolean
          affects_credit_score?: boolean
          status?: 'active' | 'paid_off' | 'defaulted' | 'restructured' | 'closed'
          is_active?: boolean
          auto_generate_bills?: boolean
          bill_generation_day?: number
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          user_id: string
          name: string
          asset_type: string
          description: string | null
          purchase_value: number
          current_value: number
          depreciation_rate: number
          purchase_date: string
          last_valuation_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          asset_type: string
          description?: string | null
          purchase_value: number
          current_value: number
          depreciation_rate?: number
          purchase_date: string
          last_valuation_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          asset_type?: string
          description?: string | null
          purchase_value?: number
          current_value?: number
          depreciation_rate?: number
          purchase_date?: string
          last_valuation_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bills: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string
          bill_type: 'fixed' | 'variable' | 'one_time' | 'liability_linked'
          amount: number
          estimated_amount: number | null
          frequency: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom' | 'one_time'
          custom_frequency_days: number | null
          due_date: string
          next_due_date: string
          last_paid_date: string | null
          default_account_id: string | null
          auto_pay: boolean
          linked_liability_id: string | null
          is_emi: boolean
          is_active: boolean
          is_essential: boolean
          reminder_days_before: number
          send_due_date_reminder: boolean
          send_overdue_reminder: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category: string
          bill_type: 'fixed' | 'variable' | 'one_time' | 'liability_linked'
          amount: number
          estimated_amount?: number | null
          frequency: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom' | 'one_time'
          custom_frequency_days?: number | null
          due_date: string
          next_due_date: string
          last_paid_date?: string | null
          default_account_id?: string | null
          auto_pay?: boolean
          linked_liability_id?: string | null
          is_emi?: boolean
          is_active?: boolean
          is_essential?: boolean
          reminder_days_before?: number
          send_due_date_reminder?: boolean
          send_overdue_reminder?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string
          bill_type?: 'fixed' | 'variable' | 'one_time' | 'liability_linked'
          amount?: number
          estimated_amount?: number | null
          frequency?: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom' | 'one_time'
          custom_frequency_days?: number | null
          due_date?: string
          next_due_date?: string
          last_paid_date?: string | null
          default_account_id?: string | null
          auto_pay?: boolean
          linked_liability_id?: string | null
          is_emi?: boolean
          is_active?: boolean
          is_essential?: boolean
          reminder_days_before?: number
          send_due_date_reminder?: boolean
          send_overdue_reminder?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bill_instances: {
        Row: {
          id: string
          bill_id: string
          user_id: string
          due_date: string
          amount: number
          actual_amount: number | null
          status: 'pending' | 'paid' | 'failed' | 'skipped' | 'overdue'
          payment_method: 'auto' | 'manual' | 'other_account' | null
          paid_date: string | null
          paid_from_account_id: string | null
          transaction_id: string | null
          failure_reason: string | null
          retry_count: number
          max_retries: number
          late_fee: number
          penalty_applied: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bill_id: string
          user_id: string
          due_date: string
          amount: number
          actual_amount?: number | null
          status?: 'pending' | 'paid' | 'failed' | 'skipped' | 'overdue'
          payment_method?: 'auto' | 'manual' | 'other_account' | null
          paid_date?: string | null
          paid_from_account_id?: string | null
          transaction_id?: string | null
          failure_reason?: string | null
          retry_count?: number
          max_retries?: number
          late_fee?: number
          penalty_applied?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bill_id?: string
          user_id?: string
          due_date?: string
          amount?: number
          actual_amount?: number | null
          status?: 'pending' | 'paid' | 'failed' | 'skipped' | 'overdue'
          payment_method?: 'auto' | 'manual' | 'other_account' | null
          paid_date?: string | null
          paid_from_account_id?: string | null
          transaction_id?: string | null
          failure_reason?: string | null
          retry_count?: number
          max_retries?: number
          late_fee?: number
          penalty_applied?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      liability_payments: {
        Row: {
          id: string
          liability_id: string
          user_id: string
          amount: number
          payment_date: string
          payment_type: 'regular' | 'extra' | 'minimum' | 'full' | 'partial'
          principal_amount: number
          interest_amount: number
          fees_amount: number
          paid_from_account_id: string | null
          transaction_id: string | null
          bill_instance_id: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          liability_id: string
          user_id: string
          amount: number
          payment_date: string
          payment_type: 'regular' | 'extra' | 'minimum' | 'full' | 'partial'
          principal_amount?: number
          interest_amount?: number
          fees_amount?: number
          paid_from_account_id?: string | null
          transaction_id?: string | null
          bill_instance_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          liability_id?: string
          user_id?: string
          amount?: number
          payment_date?: string
          payment_type?: 'regular' | 'extra' | 'minimum' | 'full' | 'partial'
          principal_amount?: number
          interest_amount?: number
          fees_amount?: number
          paid_from_account_id?: string | null
          transaction_id?: string | null
          bill_instance_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          notification_type: 'bill_reminder' | 'bill_overdue' | 'liability_due' | 'payment_failed' | 'payment_success' | 'bill_generated'
          bill_id: string | null
          bill_instance_id: string | null
          liability_id: string | null
          scheduled_for: string
          sent_at: string | null
          status: 'pending' | 'sent' | 'failed' | 'cancelled'
          send_email: boolean
          send_push: boolean
          send_sms: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          notification_type: 'bill_reminder' | 'bill_overdue' | 'liability_due' | 'payment_failed' | 'payment_success' | 'bill_generated'
          bill_id?: string | null
          bill_instance_id?: string | null
          liability_id?: string | null
          scheduled_for: string
          sent_at?: string | null
          status?: 'pending' | 'sent' | 'failed' | 'cancelled'
          send_email?: boolean
          send_push?: boolean
          send_sms?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          notification_type?: 'bill_reminder' | 'bill_overdue' | 'liability_due' | 'payment_failed' | 'payment_success' | 'bill_generated'
          bill_id?: string | null
          bill_instance_id?: string | null
          liability_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: 'pending' | 'sent' | 'failed' | 'cancelled'
          send_email?: boolean
          send_push?: boolean
          send_sms?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      account_transfers: {
        Row: {
          id: string
          user_id: string
          from_account_id: string
          to_account_id: string
          amount: number
          description: string
          transfer_date: string
          from_transaction_id: string | null
          to_transaction_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          from_account_id: string
          to_account_id: string
          amount: number
          description: string
          transfer_date?: string
          from_transaction_id?: string | null
          to_transaction_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          from_account_id?: string
          to_account_id?: string
          amount?: number
          description?: string
          transfer_date?: string
          from_transaction_id?: string | null
          to_transaction_id?: string | null
          created_at?: string
        }
      }
      user_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'income' | 'expense'
          icon: string | null
          color: string | null
          created_at: string
          updated_at: string
          parent_id: string | null
          description: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'income' | 'expense'
          icon?: string | null
          color?: string | null
          created_at?: string
          updated_at?: string
          parent_id?: string | null
          description?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'income' | 'expense'
          icon?: string | null
          color?: string | null
          created_at?: string
          updated_at?: string
          parent_id?: string | null
          description?: string | null
          sort_order?: number
        }
      }
      category_budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          period: 'weekly' | 'monthly' | 'yearly'
          alert_threshold: number
          rollover_unused: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          amount: number
          period: 'weekly' | 'monthly' | 'yearly'
          alert_threshold?: number
          rollover_unused?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          amount?: number
          period?: 'weekly' | 'monthly' | 'yearly'
          alert_threshold?: number
          rollover_unused?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bill_reminders: {
        Row: {
          id: string
          user_id: string
          recurring_transaction_id: string
          due_date: string
          amount: number
          status: 'pending' | 'paid' | 'overdue' | 'cancelled'
          reminder_days: number
          payment_method: string | null
          priority: 'high' | 'medium' | 'low'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recurring_transaction_id: string
          due_date: string
          amount: number
          status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
          reminder_days?: number
          payment_method?: string | null
          priority?: 'high' | 'medium' | 'low'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recurring_transaction_id?: string
          due_date?: string
          amount?: number
          status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
          reminder_days?: number
          payment_method?: string | null
          priority?: 'high' | 'medium' | 'low'
          created_at?: string
          updated_at?: string
        }
      }
      debt_payments: {
        Row: {
          id: string
          user_id: string
          liability_id: string
          payment_amount: number
          principal_amount: number
          interest_amount: number
          payment_date: string
          payment_method: string | null
          transaction_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          liability_id: string
          payment_amount: number
          principal_amount: number
          interest_amount: number
          payment_date?: string
          payment_method?: string | null
          transaction_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          liability_id?: string
          payment_amount?: number
          principal_amount?: number
          interest_amount?: number
          payment_date?: string
          payment_method?: string | null
          transaction_id?: string | null
          created_at?: string
        }
      }
      transaction_splits: {
        Row: {
          id: string
          user_id: string
          parent_transaction_id: string
          category: string
          amount: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          parent_transaction_id: string
          category: string
          amount: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          parent_transaction_id?: string
          category?: string
          amount?: number
          description?: string | null
          created_at?: string
        }
      }
      financial_insights: {
        Row: {
          id: string
          user_id: string
          insight_type: 'spending_pattern' | 'savings_opportunity' | 'budget_alert' | 'goal_progress' | 'debt_optimization'
          title: string
          description: string
          impact_level: 'high' | 'medium' | 'low'
          is_read: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          insight_type: 'spending_pattern' | 'savings_opportunity' | 'budget_alert' | 'goal_progress' | 'debt_optimization'
          title: string
          description: string
          impact_level: 'high' | 'medium' | 'low'
          is_read?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          insight_type?: 'spending_pattern' | 'savings_opportunity' | 'budget_alert' | 'goal_progress' | 'debt_optimization'
          title?: string
          description?: string
          impact_level?: 'high' | 'medium' | 'low'
          is_read?: boolean
          expires_at?: string | null
          created_at?: string
        }
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
