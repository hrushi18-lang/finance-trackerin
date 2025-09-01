import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CreditCard, Percent, Calendar, Wallet, ShoppingCart, Info, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { validateLiability, sanitizeFinancialData, toNumber } from '../../utils/validation'; // Already exists
import { Input } from '../common/Input'; // Already exists
import { Button } from '../common/Button'; // Already exists
import { EnhancedLiability, Transaction } from '../../types'; // Changed to EnhancedLiability
import { useInternationalization } from '../../contexts/InternationalizationContext'; // Already exists
import { CurrencyIcon } from '../common/CurrencyIcon'; // Already exists
import { useFinance } from '../../contexts/FinanceContext'; // Already exists

interface LiabilityFormData {
  name: string;
  type: 'loan' | 'credit_card' | 'mortgage' | 'purchase' | 'other';
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  due_date: string;
  start_date: string;
  linkedPurchaseId?: string; // Already exists
  // New fields from EnhancedLiability
  description?: string;
  minimumPayment?: number;
  paymentDay: number;
  loanTermMonths?: number;
  nextPaymentDate?: string;
  linkedAssetId?: string;
  isSecured: boolean;
  disbursementAccountId?: string;
  defaultPaymentAccountId?: string;
  providesFunds: boolean;
  affectsCreditScore: boolean;
  status: 'active' | 'paid_off' | 'defaulted' | 'restructured' | 'closed';
  isActive: boolean;
  autoGenerateBills: boolean;
  billGenerationDay: number;
}

export const EnhancedLiabilityForm: React.FC<EnhancedLiabilityFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LiabilityFormData>({
    defaultValues: initialData || {
      type: 'loan',
      totalAmount: 0,
      remainingAmount: 0,
      interestRate: 0,
      monthlyPayment: 0,
      due_date: new Date().toISOString().split('T')[0],
      start_date: new Date().toISOString().split('T')[0],
      // New fields
      description: '',
      minimumPayment: 0,
      paymentDay: 1,
      loanTermMonths: undefined,
      nextPaymentDate: undefined,
      linkedAssetId: undefined,
      isSecured: false,
      disbursementAccountId: undefined,
      defaultPaymentAccountId: undefined,
      providesFunds: true,
      affectsCreditScore: true,
      status: 'active',
      isActive: true,
      autoGenerateBills: false,
      billGenerationDay: 1
    }
  });
  const selectedType = watch('type');
  const totalAmount = watch('totalAmount');
  const interestRate = watch('interestRate');
  const monthlyPayment = watch('monthlyPayment');
  const linkedPurchaseId = watch('linkedPurchaseId');

  // Load recent transactions for purchase linking
  useEffect(() => { // Already exists
    if (selectedType === 'purchase') {
      // Get recent expense transactions
      const recent = transactions // Already exists
        .filter(t => t.type === 'expense')
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 10);
      setRecentTransactions(recent);
    }
  }, [selectedType, transactions]);

  const handleFormSubmit = async (data: LiabilityFormData) => {
    try {
      setIsSubmitting(true); // Already exists
      setError(null);
      
      // Sanitize numeric fields
      const sanitizedData = sanitizeFinancialData(data, [
        'totalAmount', 
        'remainingAmount', 
        'interestRate', 
        'monthlyPayment' // Already exists
      ]);
      
      // Validate using schema
      const validatedData = validateLiability({
        ...sanitizedData,
        totalAmount: toNumber(sanitizedData.totalAmount),
        remainingAmount: toNumber(sanitizedData.remainingAmount),
        interestRate: toNumber(sanitizedData.interestRate),
        monthlyPayment: toNumber(sanitizedData.monthlyPayment), // Already exists
      });
      
      // For purchase type, addAsIncome should always be false
      const effectiveAddAsIncome = selectedType === 'purchase' ? false : addAsIncome;
      
      await onSubmit({
        name: validatedData.name,
        liabilityType: validatedData.type, // Map old 'type' to new 'liabilityType'
        description: validatedData.description,
        totalAmount: validatedData.totalAmount,
        remainingAmount: validatedData.remainingAmount,
        interestRate: validatedData.interestRate,
        monthlyPayment: validatedData.monthlyPayment,
        minimumPayment: validatedData.minimumPayment,
        paymentDay: validatedData.paymentDay,
        loanTermMonths: validatedData.loanTermMonths,
        startDate: new Date(validatedData.start_date),
        dueDate: validatedData.due_date ? new Date(validatedData.due_date) : undefined,
        nextPaymentDate: validatedData.nextPaymentDate ? new Date(validatedData.nextPaymentDate) : undefined,
        linkedAssetId: validatedData.linkedAssetId,
        isSecured: validatedData.isSecured,
        providesFunds: validatedData.providesFunds,
        due_date: typeof data.due_date === 'string' ? new Date(data.due_date) : data.due_date,
        start_date: typeof data.start_date === 'string' ? new Date(data.start_date) : data.start_date,
        linkedPurchaseId: data.linkedPurchaseId || undefined,
      }, effectiveAddAsIncome);
      
    } catch (error: any) {
      console.error('Error submitting liability:', error);
      setError(error.message || 'Failed to save liability. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      loan: '💰', // Already exists
      credit_card: '💳',
      mortgage: '🏠',
      purchase: '🛍️',
      other: '📝'
    };
    return icons[type as keyof typeof icons] || '💳';
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Error Message */} // Already exists
      {error && (
        <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} className="text-error-400" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* Header with Info */}
      <div className="bg-gradient-to-r from-warning-500/20 to-error-500/20 rounded-xl p-4 mb-6 border border-warning-500/30"> // Already exists
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <CreditCard size={20} className="mr-2 text-warning-400" />
          {initialData ? 'Edit Debt' : 'Add New Debt'}
        </h3>
        <p className="text-gray-300 text-sm">
          Track your loans, credit cards, and other debts to manage your financial obligations.
        </p>
      </div>

      {/* Debt Acquisition Type - Only for new liabilities and non-purchase types */}
      {!initialData && selectedType !== 'purchase' && ( // Already exists
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            What type of debt is this?
          </label>
          
          <div className="grid grid-cols-1 gap-3">
            <label className="cursor-pointer">
              <input
                type="radio"
                checked={addAsIncome}
                onChange={() => setAddAsIncome(true)}
                className="sr-only" // Already exists
              />
              <div className={`p-4 rounded-xl border-2 transition-colors ${
                addAsIncome 
                  ? 'border-success-500 bg-success-500/20 text-success-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <div className="flex items-center space-x-3">
                  <Wallet size={20} className={addAsIncome ? 'text-success-400' : 'text-gray-400'} />
                  <div>
                    <p className="font-medium">Cash Loan/Credit</p>
                    <p className="text-sm opacity-80">
                      I received cash/money directly - record as income
                    </p>
                  </div>
                </div>
              </div>
            </label>

            <label className="cursor-pointer">
              <input
                type="radio"
                checked={!addAsIncome}
                onChange={() => setAddAsIncome(false)}
                className="sr-only" // Already exists
              />
              <div className={`p-4 rounded-xl border-2 transition-colors ${
                !addAsIncome 
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <div className="flex items-center space-x-3">
                  <CreditCard size={20} className={!addAsIncome ? 'text-primary-400' : 'text-gray-400'} />
                  <div>
                    <p className="font-medium">Existing Debt</p>
                    <p className="text-sm opacity-80">
                      Track existing debt without adding income
                    </p>
                  </div>
                </div>
              </div>
            </label>
          </div>

          {/* Info Box */}
          <div className={`p-3 rounded-lg border mt-3 ${
            addAsIncome // Already exists
              ? 'bg-success-500/20 border-success-500/30 text-success-400' 
              : 'bg-primary-500/20 border-primary-500/30 text-primary-400'
          }`}>
            <div className="flex items-center">
              <Info size={16} className="mr-2" />
              <span className="text-sm font-medium">
                {addAsIncome 
                  ? 'The amount will be recorded as income (cash received)'
                  : 'Only the debt will be tracked - no income recorded'
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Liability Name */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input // Already exists
          label="Liability Name"
          type="text"
          icon={<CreditCard size={18} className="text-warning-400" />}
          {...register('name', { required: 'Name is required' })}
          error={errors.name?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder="e.g., Car Loan, Credit Card"
        />
      </div>

      {/* Liability Type */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Type // Already exists
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {['loan', 'credit_card', 'mortgage', 'purchase', 'other'].map((type) => (
            <label key={type} className="cursor-pointer">
              <input
                type="radio"
                value={type}
                {...register('type', { required: 'Type is required' })} // Already exists
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                selectedType === type
                  ? 'border-warning-500 bg-warning-500/20 text-warning-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <div className="text-xl mb-1">{getTypeIcon(type)}</div>
                <p className="font-medium capitalize">{type.replace('_', ' ')}</p>
              </div>
            </label>
          ))}
        </div>
        {errors.type && ( // Already exists
          <p className="text-sm text-error-400 mt-1">{errors.type.message}</p>
        )}
      </div>

      {/* Start Date */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input // Already exists
          label="Start Date"
          type="date"
          icon={<Clock size={18} className="text-blue-400" />}
          {...register('start_date', { required: 'Start date is required' })}
          error={errors.start_date?.message}
          className="bg-black/40 border-white/20 text-white"
          value={typeof initialData?.start_date === 'string' ? initialData.start_date : initialData?.start_date?.toISOString().split('T')[0]}
          helpText="When did you take on this debt?"
        />
      </div>

      {/* Link to Purchase Transaction - Only for purchase type */}
      {selectedType === 'purchase' && ( // Already exists
        <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-start space-x-3">
            <ShoppingCart size={18} className="text-purple-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-purple-400 mb-1">Purchase on Credit</h4>
              <p className="text-sm text-purple-300">
                This tracks a purchase you made on credit (like EMI, credit card, or installment plan). 
                No income will be recorded since you didn't receive cash - you received goods/services.
              </p>
              <p className="text-xs text-purple-200 mt-2">
                When you make payments, the money will be deducted from your account balance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Amount Fields */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20 space-y-4">
        <Input // Already exists
          label="Total Amount"
          type="number"
          step="0.01"
          icon={<CurrencyIcon currencyCode={currency.code} className="text-error-400" />}
          {...register('totalAmount', {
            required: 'Total amount is required',
            min: { value: 0.01, message: 'Amount must be greater than 0' },
          })}
          error={errors.totalAmount?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder="e.g., 10000"
          helpText="The original amount of the debt"
        />

        <Input
          label="Remaining Amount" // Already exists
          type="number"
          step="0.01"
          icon={<CurrencyIcon currencyCode={currency.code} className="text-orange-400" />}
          {...register('remainingAmount', {
            required: 'Remaining amount is required',
            min: { value: 0, message: 'Amount cannot be negative' },
            validate: value => !totalAmount || Number(value) <= Number(totalAmount) || 'Cannot exceed total amount'
          })}
          error={errors.remainingAmount?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder="e.g., 8500"
          helpText="The current balance you still owe"
        />
      </div>

      {/* Payment Details */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20 space-y-4">
        <Input // Already exists
          label="Interest Rate (%)"
          type="number"
          step="0.01"
          icon={<Percent size={18} className="text-purple-400" />}
          {...register('interestRate', {
            required: 'Interest rate is required',
            min: { value: 0, message: 'Interest rate cannot be negative' },
          })}
          error={errors.interestRate?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder="e.g., 5.25"
        />

        <Input
          label="Monthly Payment" // Already exists
          type="number"
          step="0.01"
          icon={<CurrencyIcon currencyCode={currency.code} className="text-blue-400" />}
          {...register('monthlyPayment', {
            required: 'Monthly payment is required',
            min: { value: 0.01, message: 'Payment must be greater than 0' },
          })}
          error={errors.monthlyPayment?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder="e.g., 350"
        />
      </div>

      {/* Due Date */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input // Already exists
          label="Next Due Date"
          type="date"
          icon={<Calendar size={18} className="text-green-400" />}
          {...register('due_date', { required: 'Due date is required' })}
          error={errors.due_date?.message}
          className="bg-black/40 border-white/20 text-white"
          value={typeof initialData?.due_date === 'string' ? initialData.due_date : initialData?.due_date?.toISOString().split('T')[0]}
          helpText="When is your next payment due?"
        /> // Already exists
        {/* Warn about past due dates */}
        {watch('due_date') && new Date(watch('due_date')) < new Date() && (
          <div className="mt-2 p-2 bg-warning-500/20 border border-warning-500/30 rounded text-xs text-warning-400">
            ⚠️ Due date is in the past. This is okay for historical debts.
          </div>
        )}
      </div>

      {/* Payment Summary */}
      {totalAmount && interestRate && monthlyPayment && Number(monthlyPayment) > 0 && ( // Already exists
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center">
            <ShieldCheck size={16} className="mr-2 text-blue-400" />
            Payment Summary
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-black/20 p-3 rounded-lg">
              <p className="text-gray-400 mb-1">Total Interest</p>
              <p className="text-error-400 font-medium">
                ~{currency.symbol}{((Number(totalAmount) * Number(interestRate) / 100) * (Number(totalAmount) / Number(monthlyPayment) / 12)).toFixed(2)}
              </p>
            </div>
            <div className="bg-black/20 p-3 rounded-lg">
              <p className="text-gray-400 mb-1">Est. Payoff</p>
              <p className="text-primary-400 font-medium">
                ~{Math.ceil(Number(totalAmount) / Number(monthlyPayment))} months
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-4 pt-4">
        <Button // Already exists
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          className="flex-1 border-white/20 text-white hover:bg-white/10"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button // Already exists
          type="submit" 
          className="flex-1 bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700"
          loading={isSubmitting}
        >
          {initialData ? 'Update' : 'Add'} Liability
        </Button>
      </div>
    </form>
  );
};
export const LiabilityForm: React.FC<LiabilityFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  return (
    <EnhancedLiabilityForm
      onSubmit={onSubmit}
      onCancel={onCancel}
      initialData={initialData}
    />
  );
};