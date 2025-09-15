import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useFinance } from './FinanceContext';
import { useInternationalization } from './InternationalizationContext';
import {
  CreditCardBillCycle,
  CreditCardBillPayment,
  CreditCardSettings,
  CreditCardBillFormData,
  CreditCardPaymentFormData,
  CreditCardBillAnalytics,
  CreditCardBillSummary,
  MidCycleImportData,
  CreditCardBill,
  DEFAULT_CREDIT_CARD_SETTINGS
} from '../types/credit_card_bills';

interface CreditCardBillContextType {
  // Data
  creditCardBills: CreditCardBillCycle[];
  creditCardPayments: CreditCardBillPayment[];
  creditCardSettings: CreditCardSettings[];
  creditCardBillSummaries: CreditCardBillSummary[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Credit Card Bill Management
  createCreditCardBill: (formData: CreditCardBillFormData) => Promise<CreditCardBillCycle>;
  updateCreditCardBill: (id: string, updates: Partial<CreditCardBillCycle>) => Promise<void>;
  deleteCreditCardBill: (id: string) => Promise<void>;
  
  // Payment Management
  makeCreditCardPayment: (paymentData: CreditCardPaymentFormData) => Promise<CreditCardBillPayment>;
  getCreditCardPayments: (billCycleId: string) => Promise<CreditCardBillPayment[]>;
  
  // Settings Management
  updateCreditCardSettings: (accountId: string, settings: Partial<CreditCardSettings>) => Promise<void>;
  getCreditCardSettings: (accountId: string) => Promise<CreditCardSettings | null>;
  
  // Mid-Cycle Import
  importMidCycleBalance: (importData: MidCycleImportData) => Promise<CreditCardBillCycle>;
  
  // Auto-Generation
  generateCreditCardBills: () => Promise<void>;
  
  // Analytics
  getCreditCardBillAnalytics: (accountId?: string) => Promise<CreditCardBillAnalytics>;
  
  // Notifications
  getUpcomingBills: () => CreditCardBillCycle[];
  getOverdueBills: () => CreditCardBillCycle[];
  
  // Utility Functions
  calculateMinimumDue: (balance: number, percentage: number) => number;
  calculateCreditUtilization: (balance: number, limit: number) => number;
  formatCreditCardBillAmount: (bill: CreditCardBillCycle) => string;
  getBillStatusColor: (status: string) => string;
  getPaymentStatusColor: (status: string) => string;
}

const CreditCardBillContext = createContext<CreditCardBillContextType | undefined>(undefined);

export const useCreditCardBills = () => {
  const context = useContext(CreditCardBillContext);
  if (!context) {
    throw new Error('useCreditCardBills must be used within a CreditCardBillProvider');
  }
  return context;
};

interface CreditCardBillProviderProps {
  children: ReactNode;
}

export const CreditCardBillProvider: React.FC<CreditCardBillProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { accounts, addTransaction, updateAccount } = useFinance();
  const { formatCurrency, convertCurrency } = useInternationalization();
  
  // State
  const [creditCardBills, setCreditCardBills] = useState<CreditCardBillCycle[]>([]);
  const [creditCardPayments, setCreditCardPayments] = useState<CreditCardBillPayment[]>([]);
  const [creditCardSettings, setCreditCardSettings] = useState<CreditCardSettings[]>([]);
  const [creditCardBillSummaries, setCreditCardBillSummaries] = useState<CreditCardBillSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load credit card bills
  const loadCreditCardBills = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: billsError } = await supabase
        .from('credit_card_bill_cycles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (billsError) throw billsError;
      
      const bills = data?.map(bill => ({
        ...bill,
        cycleStartDate: new Date(bill.cycle_start_date),
        cycleEndDate: new Date(bill.cycle_end_date),
        statementDate: new Date(bill.statement_date),
        dueDate: new Date(bill.due_date),
        createdAt: new Date(bill.created_at),
        updatedAt: new Date(bill.updated_at)
      })) || [];
      
      setCreditCardBills(bills);
    } catch (err: any) {
      console.error('Error loading credit card bills:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load credit card payments
  const loadCreditCardPayments = async () => {
    if (!user) return;
    
    try {
      const { data, error: paymentsError } = await supabase
        .from('credit_card_bill_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (paymentsError) throw paymentsError;
      
      const payments = data?.map(payment => ({
        ...payment,
        paymentDate: new Date(payment.payment_date),
        createdAt: new Date(payment.created_at)
      })) || [];
      
      setCreditCardPayments(payments);
    } catch (err: any) {
      console.error('Error loading credit card payments:', err);
    }
  };

  // Load credit card settings
  const loadCreditCardSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error: settingsError } = await supabase
        .from('credit_card_settings')
        .select('*')
        .eq('user_id', user.id);
      
      if (settingsError) throw settingsError;
      
      const settings = data?.map(setting => ({
        ...setting,
        createdAt: new Date(setting.created_at),
        updatedAt: new Date(setting.updated_at)
      })) || [];
      
      setCreditCardSettings(settings);
    } catch (err: any) {
      console.error('Error loading credit card settings:', err);
    }
  };

  // Load all data on mount
  useEffect(() => {
    if (user) {
      loadCreditCardBills();
      loadCreditCardPayments();
      loadCreditCardSettings();
    }
  }, [user]);

  // Create credit card bill
  const createCreditCardBill = async (formData: CreditCardBillFormData): Promise<CreditCardBillCycle> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error: insertError } = await supabase
        .from('credit_card_bill_cycles')
        .insert({
          user_id: user.id,
          credit_card_account_id: formData.creditCardAccountId,
          cycle_start_date: new Date().toISOString().split('T')[0],
          cycle_end_date: new Date().toISOString().split('T')[0],
          statement_date: new Date().toISOString().split('T')[0],
          due_date: new Date().toISOString().split('T')[0],
          minimum_due: 0,
          full_balance_due: 0,
          remaining_balance: 0,
          cycle_status: 'unbilled',
          payment_status: 'pending',
          currency_code: formData.primaryCurrency,
          original_amount: 0,
          original_currency: formData.primaryCurrency,
          exchange_rate_used: 1.0
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      const newBill: CreditCardBillCycle = {
        ...data,
        cycleStartDate: new Date(data.cycle_start_date),
        cycleEndDate: new Date(data.cycle_end_date),
        statementDate: new Date(data.statement_date),
        dueDate: new Date(data.due_date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
      
      setCreditCardBills(prev => [newBill, ...prev]);
      return newBill;
    } catch (err: any) {
      console.error('Error creating credit card bill:', err);
      throw err;
    }
  };

  // Update credit card bill
  const updateCreditCardBill = async (id: string, updates: Partial<CreditCardBillCycle>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { error: updateError } = await supabase
        .from('credit_card_bill_cycles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
      setCreditCardBills(prev => prev.map(bill => 
        bill.id === id ? { ...bill, ...updates, updatedAt: new Date() } : bill
      ));
    } catch (err: any) {
      console.error('Error updating credit card bill:', err);
      throw err;
    }
  };

  // Delete credit card bill
  const deleteCreditCardBill = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { error: deleteError } = await supabase
        .from('credit_card_bill_cycles')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (deleteError) throw deleteError;
      
      setCreditCardBills(prev => prev.filter(bill => bill.id !== id));
    } catch (err: any) {
      console.error('Error deleting credit card bill:', err);
      throw err;
    }
  };

  // Make credit card payment
  const makeCreditCardPayment = async (paymentData: CreditCardPaymentFormData): Promise<CreditCardBillPayment> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Get the bill cycle
      const billCycle = creditCardBills.find(bill => bill.id === paymentData.billCycleId);
      if (!billCycle) throw new Error('Bill cycle not found');
      
      // Get account currency for proper conversion
      const account = accounts.find(acc => acc.id === paymentData.sourceAccountId);
      const accountCurrency = account?.currencycode || billCycle.currencyCode;
      const billCurrency = billCycle.currencyCode;
      
      // Use the BillLiabilityService for consistent multi-currency handling
      const { BillLiabilityService } = await import('../services/billLiabilityService');
      const transactionData = await BillLiabilityService.createCreditCardPaymentTransaction(
        paymentData.paymentAmount,
        paymentData.sourceAccountId,
        accountCurrency,
        billCurrency,
        paymentData.billCycleId,
        paymentData.paymentType,
        paymentData.notes
      );

      // Create transaction with multi-currency support
      const transaction = await addTransaction(transactionData);
      
      // Record payment with multi-currency support
      const { data, error: paymentError } = await supabase
        .from('credit_card_bill_payments')
        .insert({
          user_id: user.id,
          bill_cycle_id: paymentData.billCycleId,
          transaction_id: transaction.id,
          payment_amount: transactionData.amount,
          payment_type: paymentData.paymentType,
          payment_method: paymentData.paymentMethod || 'bank_transfer',
          payment_date: paymentData.paymentDate.toISOString().split('T')[0],
          source_account_id: paymentData.sourceAccountId,
          currency_code: billCurrency,
          original_amount: transactionData.native_amount,
          original_currency: transactionData.native_currency,
          exchange_rate_used: transactionData.exchange_rate,
          conversion_source: transactionData.conversion_source,
          notes: paymentData.notes
        })
        .select()
        .single();
      
      if (paymentError) throw paymentError;
      
      const newPayment: CreditCardBillPayment = {
        ...data,
        paymentDate: new Date(data.payment_date),
        createdAt: new Date(data.created_at)
      };
      
      setCreditCardPayments(prev => [newPayment, ...prev]);
      
      // Update bill cycle with converted amount
      const newRemainingBalance = billCycle.remainingBalance - transactionData.amount;
      const newPaymentStatus = newRemainingBalance <= 0 ? 'paid_full' : 
                              transactionData.amount >= billCycle.minimumDue ? 'paid_minimum' : 'paid_partial';
      const newCycleStatus = newRemainingBalance <= 0 ? 'paid_full' : 
                            transactionData.amount >= billCycle.minimumDue ? 'paid_minimum' : 'partially_paid';
      
      await updateCreditCardBill(paymentData.billCycleId, {
        amountPaid: billCycle.amountPaid + transactionData.amount,
        remainingBalance: newRemainingBalance,
        paymentStatus: newPaymentStatus,
        cycleStatus: newCycleStatus
      });
      
      return newPayment;
    } catch (err: any) {
      console.error('Error making credit card payment:', err);
      throw err;
    }
  };

  // Get credit card payments for a bill cycle
  const getCreditCardPayments = async (billCycleId: string): Promise<CreditCardBillPayment[]> => {
    return creditCardPayments.filter(payment => payment.billCycleId === billCycleId);
  };

  // Update credit card settings
  const updateCreditCardSettings = async (accountId: string, settings: Partial<CreditCardSettings>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { error: upsertError } = await supabase
        .from('credit_card_settings')
        .upsert({
          user_id: user.id,
          credit_card_account_id: accountId,
          ...settings,
          updated_at: new Date().toISOString()
        });
      
      if (upsertError) throw upsertError;
      
      // Reload settings
      await loadCreditCardSettings();
    } catch (err: any) {
      console.error('Error updating credit card settings:', err);
      throw err;
    }
  };

  // Get credit card settings for an account
  const getCreditCardSettings = async (accountId: string): Promise<CreditCardSettings | null> => {
    return creditCardSettings.find(setting => setting.creditCardAccountId === accountId) || null;
  };

  // Import mid-cycle balance
  const importMidCycleBalance = async (importData: MidCycleImportData): Promise<CreditCardBillCycle> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const currentDate = new Date();
      const cycleStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), importData.billingCycleStartDay);
      const cycleEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, importData.billingCycleEndDay);
      const statementDate = cycleEndDate;
      const dueDate = new Date(statementDate);
      dueDate.setDate(dueDate.getDate() + importData.dueDateDaysAfterStatement);
      
      const minimumDue = calculateMinimumDue(importData.currentOutstandingBalance, importData.minimumDuePercentage);
      
      const { data, error: insertError } = await supabase
        .from('credit_card_bill_cycles')
        .insert({
          user_id: user.id,
          credit_card_account_id: importData.creditCardAccountId,
          cycle_start_date: cycleStartDate.toISOString().split('T')[0],
          cycle_end_date: cycleEndDate.toISOString().split('T')[0],
          statement_date: statementDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          opening_balance: importData.currentOutstandingBalance,
          closing_balance: importData.currentOutstandingBalance,
          total_charges: 0,
          total_payments: 0,
          total_credits: 0,
          interest_charged: 0,
          fees_charged: 0,
          minimum_due: minimumDue,
          full_balance_due: importData.currentOutstandingBalance,
          amount_paid: 0,
          remaining_balance: importData.currentOutstandingBalance,
          cycle_status: 'billed',
          payment_status: 'pending',
          currency_code: importData.currencyCode,
          original_amount: importData.currentOutstandingBalance,
          original_currency: importData.currencyCode,
          exchange_rate_used: 1.0,
          is_imported: true,
          import_source: 'manual',
          notes: importData.notes
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      const newBill: CreditCardBillCycle = {
        ...data,
        cycleStartDate: new Date(data.cycle_start_date),
        cycleEndDate: new Date(data.cycle_end_date),
        statementDate: new Date(data.statement_date),
        dueDate: new Date(data.due_date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
      
      setCreditCardBills(prev => [newBill, ...prev]);
      return newBill;
    } catch (err: any) {
      console.error('Error importing mid-cycle balance:', err);
      throw err;
    }
  };

  // Generate credit card bills (auto-generation)
  const generateCreditCardBills = async (): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { error: functionError } = await supabase.rpc('auto_generate_credit_card_bills');
      
      if (functionError) throw functionError;
      
      // Reload bills after generation
      await loadCreditCardBills();
    } catch (err: any) {
      console.error('Error generating credit card bills:', err);
      throw err;
    }
  };

  // Get credit card bill analytics
  const getCreditCardBillAnalytics = async (accountId?: string): Promise<CreditCardBillAnalytics> => {
    const bills = accountId ? 
      creditCardBills.filter(bill => bill.creditCardAccountId === accountId) : 
      creditCardBills;
    
    const totalOutstandingBalance = bills.reduce((sum, bill) => sum + bill.remainingBalance, 0);
    const totalMinimumDue = bills.reduce((sum, bill) => sum + bill.minimumDue, 0);
    const totalFullBalanceDue = bills.reduce((sum, bill) => sum + bill.fullBalanceDue, 0);
    
    const payments = accountId ? 
      creditCardPayments.filter(payment => 
        bills.some(bill => bill.id === payment.billCycleId)
      ) : 
      creditCardPayments;
    
    const onTimePayments = payments.filter(payment => 
      payment.paymentDate <= new Date()
    ).length;
    
    const latePayments = payments.filter(payment => 
      payment.paymentDate > new Date()
    ).length;
    
    const minimumOnlyPayments = payments.filter(payment => 
      payment.paymentType === 'minimum'
    ).length;
    
    const fullPayments = payments.filter(payment => 
      payment.paymentType === 'full'
    ).length;
    
    return {
      totalOutstandingBalance,
      totalMinimumDue,
      totalFullBalanceDue,
      averageMonthlySpending: bills.reduce((sum, bill) => sum + bill.totalCharges, 0) / Math.max(bills.length, 1),
      paymentHistory: {
        onTimePayments,
        latePayments,
        minimumOnlyPayments,
        fullPayments
      },
      interestRisk: {
        totalCarriedForward: bills.filter(bill => bill.cycleStatus === 'carried_forward').reduce((sum, bill) => sum + bill.remainingBalance, 0),
        estimatedInterest: 0, // Would need interest rate calculation
        monthsWithCarryForward: bills.filter(bill => bill.cycleStatus === 'carried_forward').length
      },
      spendingPatterns: {
        categoryBreakdown: [], // Would need transaction analysis
        monthlyTrend: [] // Would need time series analysis
      }
    };
  };

  // Get upcoming bills
  const getUpcomingBills = (): CreditCardBillCycle[] => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return creditCardBills.filter(bill => 
      bill.cycleStatus === 'billed' && 
      bill.dueDate >= today && 
      bill.dueDate <= nextWeek
    );
  };

  // Get overdue bills
  const getOverdueBills = (): CreditCardBillCycle[] => {
    const today = new Date();
    
    return creditCardBills.filter(bill => 
      bill.cycleStatus === 'billed' && 
      bill.dueDate < today && 
      bill.remainingBalance > 0
    );
  };

  // Utility functions
  const calculateMinimumDue = (balance: number, percentage: number): number => {
    return Math.max(balance * (percentage / 100), 0);
  };

  const calculateCreditUtilization = (balance: number, limit: number): number => {
    return limit > 0 ? (balance / limit) * 100 : 0;
  };

  const formatCreditCardBillAmount = (bill: CreditCardBillCycle): string => {
    return `${formatCurrency(bill.remainingBalance, bill.currencyCode)} (Min: ${formatCurrency(bill.minimumDue, bill.currencyCode)})`;
  };

  const getBillStatusColor = (status: string): string => {
    switch (status) {
      case 'paid_full': return 'text-green-600 bg-green-100';
      case 'paid_minimum': return 'text-yellow-600 bg-yellow-100';
      case 'partially_paid': return 'text-orange-600 bg-orange-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'billed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case 'paid_full': return 'text-green-600 bg-green-100';
      case 'paid_minimum': return 'text-yellow-600 bg-yellow-100';
      case 'paid_partial': return 'text-orange-600 bg-orange-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const value: CreditCardBillContextType = {
    // Data
    creditCardBills,
    creditCardPayments,
    creditCardSettings,
    creditCardBillSummaries,
    
    // Loading states
    isLoading,
    error,
    
    // Credit Card Bill Management
    createCreditCardBill,
    updateCreditCardBill,
    deleteCreditCardBill,
    
    // Payment Management
    makeCreditCardPayment,
    getCreditCardPayments,
    
    // Settings Management
    updateCreditCardSettings,
    getCreditCardSettings,
    
    // Mid-Cycle Import
    importMidCycleBalance,
    
    // Auto-Generation
    generateCreditCardBills,
    
    // Analytics
    getCreditCardBillAnalytics,
    
    // Notifications
    getUpcomingBills,
    getOverdueBills,
    
    // Utility Functions
    calculateMinimumDue,
    calculateCreditUtilization,
    formatCreditCardBillAmount,
    getBillStatusColor,
    getPaymentStatusColor
  };

  return (
    <CreditCardBillContext.Provider value={value}>
      {children}
    </CreditCardBillContext.Provider>
  );
};
