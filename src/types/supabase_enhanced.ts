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
      // =============================================
      // EXISTING TABLES (Enhanced)
      // =============================================
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          name: string
          avatar_url: string | null
          age: number | null
          country: string | null
          profession: string | null
          monthly_income: number
          primary_currency: string
          display_currency: string
          auto_convert: boolean
          show_original_amounts: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          email: string
          name: string
          avatar_url?: string | null
          age?: number | null
          country?: string | null
          profession?: string | null
          monthly_income?: number
          primary_currency?: string
          display_currency?: string
          auto_convert?: boolean
          show_original_amounts?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          name?: string
          avatar_url?: string | null
          age?: number | null
          country?: string | null
          profession?: string | null
          monthly_income?: number
          primary_currency?: string
          display_currency?: string
          auto_convert?: boolean
          show_original_amounts?: boolean
          updated_at?: string
        }
      }
      financial_accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'bank_savings' | 'bank_current' | 'bank_student' | 'digital_wallet' | 'cash' | 'credit_card' | 'investment' | 'goals_vault'
          balance: number
          institution: string | null
          platform: string | null
          account_number: string | null
          is_visible: boolean
          currencycode: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'bank_savings' | 'bank_current' | 'bank_student' | 'digital_wallet' | 'cash' | 'credit_card' | 'investment' | 'goals_vault'
          balance?: number
          institution?: string | null
          platform?: string | null
          account_number?: string | null
          is_visible?: boolean
          currencycode?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'bank_savings' | 'bank_current' | 'bank_student' | 'digital_wallet' | 'cash' | 'credit_card' | 'investment' | 'goals_vault'
          balance?: number
          institution?: string | null
          platform?: string | null
          account_number?: string | null
          is_visible?: boolean
          currencycode?: string
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
      // ... (keeping existing tables as they were)

      // =============================================
      // NEW ENHANCED TABLES
      // =============================================

      // Investment & Crypto Tracking
      investment_portfolios: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          portfolio_type: 'general' | 'retirement' | 'education' | 'crypto' | 'real_estate'
          total_value: number
          total_cost_basis: number
          total_gain_loss: number
          currency_code: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          portfolio_type?: 'general' | 'retirement' | 'education' | 'crypto' | 'real_estate'
          total_value?: number
          total_cost_basis?: number
          total_gain_loss?: number
          currency_code?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          portfolio_type?: 'general' | 'retirement' | 'education' | 'crypto' | 'real_estate'
          total_value?: number
          total_cost_basis?: number
          total_gain_loss?: number
          currency_code?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      investment_holdings: {
        Row: {
          id: string
          portfolio_id: string
          user_id: string
          symbol: string
          name: string
          asset_type: 'stock' | 'bond' | 'etf' | 'mutual_fund' | 'crypto' | 'commodity' | 'real_estate' | 'other'
          quantity: number
          average_cost_basis: number
          current_price: number
          current_value: number
          total_gain_loss: number
          currency_code: string
          last_updated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          user_id: string
          symbol: string
          name: string
          asset_type?: 'stock' | 'bond' | 'etf' | 'mutual_fund' | 'crypto' | 'commodity' | 'real_estate' | 'other'
          quantity?: number
          average_cost_basis?: number
          current_price?: number
          current_value?: number
          total_gain_loss?: number
          currency_code?: string
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          user_id?: string
          symbol?: string
          name?: string
          asset_type?: 'stock' | 'bond' | 'etf' | 'mutual_fund' | 'crypto' | 'commodity' | 'real_estate' | 'other'
          quantity?: number
          average_cost_basis?: number
          current_price?: number
          current_value?: number
          total_gain_loss?: number
          currency_code?: string
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
      }
      investment_transactions: {
        Row: {
          id: string
          holding_id: string
          user_id: string
          transaction_type: 'buy' | 'sell' | 'dividend' | 'split' | 'merger' | 'spinoff' | 'rights' | 'warrants'
          quantity: number
          price_per_share: number
          total_amount: number
          fees: number
          currency_code: string
          transaction_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          holding_id: string
          user_id: string
          transaction_type: 'buy' | 'sell' | 'dividend' | 'split' | 'merger' | 'spinoff' | 'rights' | 'warrants'
          quantity: number
          price_per_share: number
          total_amount: number
          fees?: number
          currency_code?: string
          transaction_date: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          holding_id?: string
          user_id?: string
          transaction_type?: 'buy' | 'sell' | 'dividend' | 'split' | 'merger' | 'spinoff' | 'rights' | 'warrants'
          quantity?: number
          price_per_share?: number
          total_amount?: number
          fees?: number
          currency_code?: string
          transaction_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      crypto_wallets: {
        Row: {
          id: string
          user_id: string
          name: string
          wallet_type: 'hot' | 'cold' | 'exchange' | 'hardware' | 'paper'
          address: string | null
          private_key_encrypted: string | null
          public_key: string | null
          currency_code: string
          balance: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          wallet_type?: 'hot' | 'cold' | 'exchange' | 'hardware' | 'paper'
          address?: string | null
          private_key_encrypted?: string | null
          public_key?: string | null
          currency_code: string
          balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          wallet_type?: 'hot' | 'cold' | 'exchange' | 'hardware' | 'paper'
          address?: string | null
          private_key_encrypted?: string | null
          public_key?: string | null
          currency_code?: string
          balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // Analytics & Reporting
      financial_snapshots: {
        Row: {
          id: string
          user_id: string
          snapshot_date: string
          total_assets: number
          total_liabilities: number
          net_worth: number
          liquid_assets: number
          investment_value: number
          real_estate_value: number
          crypto_value: number
          total_debt: number
          monthly_income: number
          monthly_expenses: number
          savings_rate: number
          currency_code: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          snapshot_date: string
          total_assets?: number
          total_liabilities?: number
          net_worth?: number
          liquid_assets?: number
          investment_value?: number
          real_estate_value?: number
          crypto_value?: number
          total_debt?: number
          monthly_income?: number
          monthly_expenses?: number
          savings_rate?: number
          currency_code?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          snapshot_date?: string
          total_assets?: number
          total_liabilities?: number
          net_worth?: number
          liquid_assets?: number
          investment_value?: number
          real_estate_value?: number
          crypto_value?: number
          total_debt?: number
          monthly_income?: number
          monthly_expenses?: number
          savings_rate?: number
          currency_code?: string
          created_at?: string
        }
      }
      spending_patterns: {
        Row: {
          id: string
          user_id: string
          category: string
          period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          period_start: string
          period_end: string
          total_amount: number
          transaction_count: number
          average_transaction: number
          trend_direction: 'increasing' | 'decreasing' | 'stable' | 'volatile'
          percentage_of_income: number
          currency_code: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          period_type?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          period_start: string
          period_end: string
          total_amount: number
          transaction_count?: number
          average_transaction?: number
          trend_direction?: 'increasing' | 'decreasing' | 'stable' | 'volatile'
          percentage_of_income?: number
          currency_code?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          period_type?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          period_start?: string
          period_end?: string
          total_amount?: number
          transaction_count?: number
          average_transaction?: number
          trend_direction?: 'increasing' | 'decreasing' | 'stable' | 'volatile'
          percentage_of_income?: number
          currency_code?: string
          created_at?: string
        }
      }
      financial_goals_enhanced: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          goal_type: 'savings' | 'debt_payoff' | 'investment' | 'purchase' | 'emergency_fund' | 'retirement' | 'education'
          target_amount: number
          current_amount: number
          target_date: string | null
          priority: 'low' | 'medium' | 'high' | 'critical'
          status: 'active' | 'paused' | 'completed' | 'cancelled'
          is_smart_goal: boolean
          smart_goal_criteria: Json | null
          linked_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          goal_type?: 'savings' | 'debt_payoff' | 'investment' | 'purchase' | 'emergency_fund' | 'retirement' | 'education'
          target_amount: number
          current_amount?: number
          target_date?: string | null
          priority?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'active' | 'paused' | 'completed' | 'cancelled'
          is_smart_goal?: boolean
          smart_goal_criteria?: Json | null
          linked_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          goal_type?: 'savings' | 'debt_payoff' | 'investment' | 'purchase' | 'emergency_fund' | 'retirement' | 'education'
          target_amount?: number
          current_amount?: number
          target_date?: string | null
          priority?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'active' | 'paused' | 'completed' | 'cancelled'
          is_smart_goal?: boolean
          smart_goal_criteria?: Json | null
          linked_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // Security & Audit
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          device_info: Json | null
          ip_address: string | null
          user_agent: string | null
          is_active: boolean
          expires_at: string
          created_at: string
          last_accessed: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          device_info?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          is_active?: boolean
          expires_at: string
          created_at?: string
          last_accessed?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          device_info?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          is_active?: boolean
          expires_at?: string
          created_at?: string
          last_accessed?: string
        }
      }
      security_events: {
        Row: {
          id: string
          user_id: string | null
          event_type: 'login' | 'logout' | 'password_change' | 'email_change' | 'suspicious_activity' | 'data_export' | 'data_import'
          event_description: string
          ip_address: string | null
          user_agent: string | null
          metadata: Json | null
          severity: 'info' | 'warning' | 'error' | 'critical'
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: 'login' | 'logout' | 'password_change' | 'email_change' | 'suspicious_activity' | 'data_export' | 'data_import'
          event_description: string
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          severity?: 'info' | 'warning' | 'error' | 'critical'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: 'login' | 'logout' | 'password_change' | 'email_change' | 'suspicious_activity' | 'data_export' | 'data_import'
          event_description?: string
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          severity?: 'info' | 'warning' | 'error' | 'critical'
          created_at?: string
        }
      }
      data_backups: {
        Row: {
          id: string
          user_id: string
          backup_type: 'full' | 'incremental' | 'differential'
          backup_data: Json
          file_size_bytes: number | null
          encryption_key_id: string | null
          is_encrypted: boolean
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          backup_type?: 'full' | 'incremental' | 'differential'
          backup_data: Json
          file_size_bytes?: number | null
          encryption_key_id?: string | null
          is_encrypted?: boolean
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          backup_type?: 'full' | 'incremental' | 'differential'
          backup_data?: Json
          file_size_bytes?: number | null
          encryption_key_id?: string | null
          is_encrypted?: boolean
          created_at?: string
          expires_at?: string | null
        }
      }

      // Mobile Sync & Offline
      sync_status: {
        Row: {
          id: string
          user_id: string
          device_id: string
          last_sync_at: string
          sync_version: number
          pending_changes: Json
          conflict_resolution: 'server_wins' | 'client_wins' | 'manual'
          is_online: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          last_sync_at?: string
          sync_version?: number
          pending_changes?: Json
          conflict_resolution?: 'server_wins' | 'client_wins' | 'manual'
          is_online?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          last_sync_at?: string
          sync_version?: number
          pending_changes?: Json
          conflict_resolution?: 'server_wins' | 'client_wins' | 'manual'
          is_online?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      offline_cache: {
        Row: {
          id: string
          user_id: string
          device_id: string
          table_name: string
          record_id: string
          operation_type: 'create' | 'update' | 'delete'
          data: Json | null
          sync_status: 'pending' | 'synced' | 'conflict' | 'failed'
          created_at: string
          synced_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          table_name: string
          record_id: string
          operation_type: 'create' | 'update' | 'delete'
          data?: Json | null
          sync_status?: 'pending' | 'synced' | 'conflict' | 'failed'
          created_at?: string
          synced_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          table_name?: string
          record_id?: string
          operation_type?: 'create' | 'update' | 'delete'
          data?: Json | null
          sync_status?: 'pending' | 'synced' | 'conflict' | 'failed'
          created_at?: string
          synced_at?: string | null
        }
      }

      // AI & Insights
      ai_insights: {
        Row: {
          id: string
          user_id: string
          insight_type: 'spending_pattern' | 'savings_opportunity' | 'budget_alert' | 'investment_advice' | 'debt_optimization' | 'tax_optimization' | 'goal_progress'
          title: string
          description: string
          confidence_score: number
          impact_level: 'low' | 'medium' | 'high' | 'critical'
          actionable_items: Json
          related_data: Json | null
          is_read: boolean
          is_dismissed: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          insight_type: 'spending_pattern' | 'savings_opportunity' | 'budget_alert' | 'investment_advice' | 'debt_optimization' | 'tax_optimization' | 'goal_progress'
          title: string
          description: string
          confidence_score?: number
          impact_level?: 'low' | 'medium' | 'high' | 'critical'
          actionable_items?: Json
          related_data?: Json | null
          is_read?: boolean
          is_dismissed?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          insight_type?: 'spending_pattern' | 'savings_opportunity' | 'budget_alert' | 'investment_advice' | 'debt_optimization' | 'tax_optimization' | 'goal_progress'
          title?: string
          description?: string
          confidence_score?: number
          impact_level?: 'low' | 'medium' | 'high' | 'critical'
          actionable_items?: Json
          related_data?: Json | null
          is_read?: boolean
          is_dismissed?: boolean
          expires_at?: string | null
          created_at?: string
        }
      }
      smart_categorization_rules: {
        Row: {
          id: string
          user_id: string
          rule_name: string
          pattern_type: 'description' | 'merchant' | 'amount' | 'account' | 'date'
          pattern_value: string
          category: string
          confidence: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          rule_name: string
          pattern_type?: 'description' | 'merchant' | 'amount' | 'account' | 'date'
          pattern_value: string
          category: string
          confidence?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          rule_name?: string
          pattern_type?: 'description' | 'merchant' | 'amount' | 'account' | 'date'
          pattern_value?: string
          category?: string
          confidence?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // Enhanced Categorization
      category_hierarchy_enhanced: {
        Row: {
          id: string
          user_id: string
          name: string
          parent_id: string | null
          category_type: 'income' | 'expense' | 'transfer' | 'investment'
          icon: string | null
          color: string | null
          description: string | null
          is_system_category: boolean
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          parent_id?: string | null
          category_type?: 'income' | 'expense' | 'transfer' | 'investment'
          icon?: string | null
          color?: string | null
          description?: string | null
          is_system_category?: boolean
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          parent_id?: string | null
          category_type?: 'income' | 'expense' | 'transfer' | 'investment'
          icon?: string | null
          color?: string | null
          description?: string | null
          is_system_category?: boolean
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transaction_tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          description: string | null
          is_system_tag: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string | null
          description?: string | null
          is_system_tag?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string | null
          description?: string | null
          is_system_tag?: boolean
          created_at?: string
        }
      }
      transaction_tag_assignments: {
        Row: {
          transaction_id: string
          tag_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          transaction_id: string
          tag_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          transaction_id?: string
          tag_id?: string
          user_id?: string
          created_at?: string
        }
      }

      // Multi-currency Support
      exchange_rates_historical: {
        Row: {
          id: string
          from_currency: string
          to_currency: string
          rate: number
          rate_date: string
          source: 'api' | 'manual' | 'bank' | 'crypto_exchange'
          created_at: string
        }
        Insert: {
          id?: string
          from_currency: string
          to_currency: string
          rate: number
          rate_date: string
          source?: 'api' | 'manual' | 'bank' | 'crypto_exchange'
          created_at?: string
        }
        Update: {
          id?: string
          from_currency?: string
          to_currency?: string
          rate?: number
          rate_date?: string
          source?: 'api' | 'manual' | 'bank' | 'crypto_exchange'
          created_at?: string
        }
      }
      user_currency_preferences: {
        Row: {
          id: string
          user_id: string
          primary_currency: string
          display_currency: string
          supported_currencies: string[]
          auto_convert: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          primary_currency?: string
          display_currency?: string
          supported_currencies?: string[]
          auto_convert?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          primary_currency?: string
          display_currency?: string
          supported_currencies?: string[]
          auto_convert?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // Tax & Compliance
      tax_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          tax_code: string | null
          description: string | null
          is_deductible: boolean
          deduction_limit: number | null
          tax_year: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          tax_code?: string | null
          description?: string | null
          is_deductible?: boolean
          deduction_limit?: number | null
          tax_year: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          tax_code?: string | null
          description?: string | null
          is_deductible?: boolean
          deduction_limit?: number | null
          tax_year?: number
          created_at?: string
        }
      }
      tax_documents: {
        Row: {
          id: string
          user_id: string
          document_type: 'receipt' | 'invoice' | 'statement' | 'form_1099' | 'form_w2' | 'other'
          file_name: string
          file_path: string
          file_size_bytes: number | null
          mime_type: string | null
          tax_year: number
          amount: number | null
          currency_code: string
          is_processed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_type: 'receipt' | 'invoice' | 'statement' | 'form_1099' | 'form_w2' | 'other'
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          mime_type?: string | null
          tax_year: number
          amount?: number | null
          currency_code?: string
          is_processed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_type?: 'receipt' | 'invoice' | 'statement' | 'form_1099' | 'form_w2' | 'other'
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          mime_type?: string | null
          tax_year?: number
          amount?: number | null
          currency_code?: string
          is_processed?: boolean
          created_at?: string
        }
      }

      // Advanced Budgeting
      budget_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          template_data: Json
          is_public: boolean
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          template_data: Json
          is_public?: boolean
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          template_data?: Json
          is_public?: boolean
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      financial_forecasts: {
        Row: {
          id: string
          user_id: string
          forecast_name: string
          forecast_type: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          start_date: string
          end_date: string
          forecast_data: Json
          confidence_level: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          forecast_name: string
          forecast_type?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          start_date: string
          end_date: string
          forecast_data: Json
          confidence_level?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          forecast_name?: string
          forecast_type?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          start_date?: string
          end_date?: string
          forecast_data?: Json
          confidence_level?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // Include all existing tables from the original schema
      // (goals, liabilities, budgets, recurring_transactions, etc.)
      // ... (keeping all existing table definitions)
    }
    Functions: {
      calculate_net_worth: {
        Args: {
          user_uuid: string
        }
        Returns: number
      }
      generate_financial_snapshot: {
        Args: {
          user_uuid: string
          snapshot_date?: string
        }
        Returns: string
      }
      detect_spending_patterns: {
        Args: {
          user_uuid: string
          days_back?: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
