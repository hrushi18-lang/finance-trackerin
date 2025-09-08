import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CreditCard, Calendar, Percent, Wallet, Plus, ToggleLeft, ToggleRight, AlertCircle, Calculator, Building, Car, Home, GraduationCap, ShoppingCart } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useFinance } from '../../contexts/FinanceContextOffline';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface EnhancedLiabilityFormData {
  name: string;
  liabilityType: 'personal_loan' | 'student_loan' | 'auto_loan' | 'mortgage' | 'credit_card' | 'bnpl' | 'installment' | 'other';
  description?: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment?: number;
  minimumPayment?: number;
  paymentDay: number;
  loanTermMonths?: number;
  startDate: string;
  dueDate?: string;
  linkedAssetId?: string;
  isSecured: boolean;
  disbursementAccountId?: string;
  defaultPaymentAccountId?: string;
  providesFunds: boolean;
  affectsCreditScore: boolean;
  autoGenerateBills: boolean;
  billGenerationDay: number;
  activityScope: 'general' | 'account_specific' | 'category_based';
  accountIds: string[];
  targetCategory?: string;
}

interface EnhancedLiabilityFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

export const EnhancedLiabilityForm: React.FC<EnhancedLiabilityFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const { currency, formatCurrency } = useInternationalization();
  const { accounts } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EnhancedLiabilityFormData>({
    defaultValues: initialData || {
      liabilityType: 'personal_loan',
      interestRate: 0,
      paymentDay: 1,
      startDate: new Date().toISOString().split('T')[0],
      isSecured: false,
      providesFunds: true,
      affectsCreditScore: true,
      autoGenerateBills: true,
      billGenerationDay: 1,
      activityScope: 'general',
      accountIds: []
    }
  });

  const selectedType = watch('liabilityType');
  const totalAmount = watch('totalAmount');
  const interestRate = watch('interestRate');
  const monthlyPayment = watch('monthlyPayment');
  const providesFunds = watch('providesFunds');
  const autoGenerateBills = watch('autoGenerateBills');

  const liabilityTypes = [
    { 
      value: 'personal_loan', 
      label: 'Personal Loan', 
      icon: Wallet, 
      color: 'blue',
      description: 'Bank personal loans, private loans',
      defaultProvidesFunds: true
    },
    { 
      value: 'student_loan', 
      label: 'Student Loan', 
      icon: GraduationCap, 
      color: 'purple',
      description: 'Education loans, course fees',
      defaultProvidesFunds: false // Usually paid directly to institution
    },
    { 
      value: 'auto_loan', 
      label: 'Auto Loan', 
      icon: Car, 
      color: 'green',
      description: 'Car loans, vehicle financing',
      defaultProvidesFunds: false // Usually paid directly to dealer
    },
    { 
      value: 'mortgage', 
      label: 'Mortgage', 
      icon: Home, 
      color: 'orange',
      description: 'Home loans, property financing',
      defaultProvidesFunds: false // Usually paid directly to seller
    },
    { 
      value: 'credit_card', 
      label: 'Credit Card', 
      icon: CreditCard, 
      color: 'red',
      description: 'Credit card outstanding balance',
      defaultProvidesFunds: false
    },
    { 
      value: 'bnpl', 
      label: 'Buy Now Pay Later', 
      icon: ShoppingCart, 
      color: 'pink',
      description: 'BNPL services, installment plans',
      defaultProvidesFunds: false
    },
    { 
      value: 'installment', 
      label: 'Installment Plan', 
      icon: Calendar, 
      color: 'indigo',
      description: 'EMI purchases, payment plans',
      defaultProvidesFunds: false
    },
    { 
      value: 'other', 
      label: 'Other Liability', 
      icon: CreditCard, 
      color: 'gray',
      description: 'Custom liability type',
      defaultProvidesFunds: true
    }
  ];

  const handleFormSubmit = async (data: EnhancedLiabilityFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const formattedData = {
        ...data,
        totalAmount: Number(data.totalAmount),
        remainingAmount: Number(data.remainingAmount),
        interestRate: Number(data.interestRate),
        monthlyPayment: data.monthlyPayment ? Number(data.monthlyPayment) : undefined,
        minimumPayment: data.minimumPayment ? Number(data.minimumPayment) : undefined,
        loanTermMonths: data.loanTermMonths ? Number(data.loanTermMonths) : undefined,
        startDate: new Date(data.startDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        nextPaymentDate: data.dueDate ? new Date(data.dueDate) : undefined
      };

      await onSubmit(formattedData);
    } catch (error: any) {
      console.error('Error submitting liability:', error);
      setError(error.message || 'Failed to save liability');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: isSelected ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-white/20 hover:border-blue-400/50',
      purple: isSelected ? 'border-purple-500 bg-purple-500/20 text-purple-400' : 'border-white/20 hover:border-purple-400/50',
      green: isSelected ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-white/20 hover:border-green-400/50',
      orange: isSelected ? 'border-orange-500 bg-orange-500/20 text-orange-400' : 'border-white/20 hover:border-orange-400/50',
      red: isSelected ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-white/20 hover:border-red-400/50',
      pink: isSelected ? 'border-pink-500 bg-pink-500/20 text-pink-400' : 'border-white/20 hover:border-pink-400/50',
      indigo: isSelected ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'border-white/20 hover:border-indigo-400/50',
      gray: isSelected ? 'border-gray-500 bg-gray-500/20 text-gray-400' : 'border-white/20 hover:border-gray-400/50',
    };
    return colors[color as keyof typeof colors];
  };

  const calculateEMI = () => {
    if (totalAmount && interestRate && monthlyPayment) {
      const principal = totalAmount;
      const rate = interestRate / 100 / 12;
      const months = principal / monthlyPayment;
      
      return {
        totalMonths: Math.ceil(months),
        totalInterest: (monthlyPayment * months) - principal,
        totalPayable: monthlyPayment * months
      };
    }
    return null;
  };

  const emiCalculation = calculateEMI();

  // Auto-set providesFunds based on liability type
  React.useEffect(() => {
    const selectedTypeConfig = liabilityTypes.find(t => t.value === selectedType);
    if (selectedTypeConfig) {
      setValue('providesFunds', selectedTypeConfig.defaultProvidesFunds);
    }
  }, [selectedType, setValue]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} className="text-error-400" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="flex justify-center space-x-2 mb-6">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              step < currentStep
                ? 'bg-primary-500 text-white'
                : step === currentStep
                ? 'bg-primary-500/70 text-white ring-4 ring-primary-500/30'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            {step}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Liability Details</h3>
            <p className="text-sm text-gray-400">What type of debt or obligation is this?</p>
          </div>

          {/* Header */}
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl p-4 border border-red-500/30">
            <h3 className="text-lg font-semibold text-white mb-2">Enhanced Debt Tracking</h3>
            <p className="text-gray-300 text-sm">
              Add comprehensive debt information with automated payment scheduling.
            </p>
          </div>

          {/* Liability Name */}
          <Input
            label="Debt Name"
            type="text"
            placeholder="e.g., Car Loan, Credit Card"
            icon={<CreditCard size={18} className="text-red-400" />}
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
            className="bg-black/20 border-white/20 text-white"
          />

          {/* Liability Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Debt Type</label>
            <div className="grid grid-cols-2 gap-3">
              {liabilityTypes.map((type) => {
                const isSelected = selectedType === type.value;
                const IconComponent = type.icon;
                
                return (
                  <label key={type.value} className="cursor-pointer">
                    <input
                      type="radio"
                      value={type.value}
                      {...register('liabilityType', { required: 'Type is required' })}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-lg border-2 transition-colors ${getColorClasses(type.color, isSelected)}`}>
                      <div className="flex items-center space-x-3">
                        <IconComponent size={20} />
                        <div>
                          <p className="font-medium text-sm">{type.label}</p>
                          <p className="text-xs opacity-80">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.liabilityType && (
              <p className="text-sm text-error-400 mt-1">{errors.liabilityType.message}</p>
            )}
          </div>

          {/* Description */}
          <Input
            label="Description (Optional)"
            type="text"
            placeholder="Additional details about this debt"
            {...register('description')}
            className="bg-black/20 border-white/20 text-white"
          />

          <Button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="w-full"
            disabled={!watch('name') || !watch('liabilityType')}
          >
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: Financial Details */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Financial Details</h3>
            <p className="text-sm text-gray-400">Enter the amounts and payment terms</p>
          </div>

          {/* Funds Flow Toggle */}
          <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-white">Does this provide funds to you?</h4>
                <p className="text-sm text-blue-300">
                  {providesFunds 
                    ? 'Money will be added to your account when created'
                    : 'No money added - debt tracks an existing obligation'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={() => setValue('providesFunds', !providesFunds)}
              >
                {providesFunds ? (
                  <ToggleRight size={32} className="text-blue-400" />
                ) : (
                  <ToggleLeft size={32} className="text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* Amount Fields */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Amount"
              type="number"
              step="any"
              icon={<CurrencyIcon currencycode={currency.code} className="text-error-400" />}
              {...register('totalAmount', {
                required: 'Total amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' }
              })}
              error={errors.totalAmount?.message}
              className="bg-black/20 border-white/20 text-white"
            />

            <Input
              label="Remaining Amount"
              type="number"
              step="any"
              icon={<CurrencyIcon currencycode={currency.code} className="text-orange-400" />}
              {...register('remainingAmount', {
                required: 'Remaining amount is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.remainingAmount?.message}
              className="bg-black/20 border-white/20 text-white"
            />
          </div>

          {/* Interest and Payment */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Interest Rate (%)"
              type="number"
              step="0.01"
              icon={<Percent size={18} className="text-purple-400" />}
              {...register('interestRate', {
                required: 'Interest rate is required',
                min: { value: 0, message: 'Rate cannot be negative' }
              })}
              error={errors.interestRate?.message}
              className="bg-black/20 border-white/20 text-white"
            />

            <Input
              label="Monthly Payment"
              type="number"
              step="0.01"
              icon={<CurrencyIcon currencycode={currency.code} className="text-blue-400" />}
              {...register('monthlyPayment', {
                min: { value: 0.01, message: 'Payment must be greater than 0' }
              })}
              error={errors.monthlyPayment?.message}
              className="bg-black/20 border-white/20 text-white"
            />
          </div>

          {/* Payment Day */}
          <Input
            label="Payment Day of Month"
            type="number"
            min="1"
            max="31"
            {...register('paymentDay', {
              required: 'Payment day is required',
              min: { value: 1, message: 'Day must be between 1-31' },
              max: { value: 31, message: 'Day must be between 1-31' }
            })}
            error={errors.paymentDay?.message}
            className="bg-black/20 border-white/20 text-white"
          />

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex-1"
              disabled={!watch('totalAmount') || !watch('remainingAmount')}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Advanced Settings */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Advanced Settings</h3>
            <p className="text-sm text-gray-400">Configure accounts and automation</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              icon={<Calendar size={18} className="text-green-400" />}
              {...register('startDate', { required: 'Start date is required' })}
              error={errors.startDate?.message}
              className="bg-black/20 border-white/20 text-white"
            />

            <Input
              label="Next Due Date (Optional)"
              type="date"
              icon={<Calendar size={18} className="text-red-400" />}
              {...register('dueDate')}
              error={errors.dueDate?.message}
              className="bg-black/20 border-white/20 text-white"
            />
          </div>

          {/* Activity Scope Selection */}
          <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Liability Type
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="general"
                  value="general"
                  {...register('activityScope')}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500"
                />
                <label htmlFor="general" className="text-sm text-gray-300">
                  <span className="font-medium">General Liability</span>
                  <span className="block text-xs text-gray-400">Not tied to any specific account</span>
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="account_specific"
                  value="account_specific"
                  {...register('activityScope')}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500"
                />
                <label htmlFor="account_specific" className="text-sm text-gray-300">
                  <span className="font-medium">Account-Specific Liability</span>
                  <span className="block text-xs text-gray-400">Linked to one or more specific accounts</span>
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="category_based"
                  value="category_based"
                  {...register('activityScope')}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500"
                />
                <label htmlFor="category_based" className="text-sm text-gray-300">
                  <span className="font-medium">Category-Based Liability</span>
                  <span className="block text-xs text-gray-400">For a specific spending category</span>
                </label>
              </div>
            </div>
          </div>

          {/* Account Selection - Only show if account_specific is selected */}
          {watch('activityScope') === 'account_specific' && (
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Accounts (Multiple Selection)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(accounts || []).map((account) => (
                  <div key={account.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`account-${account.id}`}
                      value={account.id}
                      {...register('accountIds')}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor={`account-${account.id}`} className="text-sm text-gray-300 flex-1">
                      <span className="font-medium">{account.name}</span>
                      <span className="block text-xs text-gray-400">
                        {formatCurrency(account.balance)} • {account.type}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Select one or more accounts to link this liability to. You can change this later.
              </p>
            </div>
          )}

          {/* Target Category - Only show if category_based is selected */}
          {watch('activityScope') === 'category_based' && (
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Category
              </label>
              <select
                {...register('targetCategory')}
                className="block w-full rounded-lg border-white/20 bg-black/20 text-white py-3 px-4"
              >
                <option value="">Select spending category</option>
                <option value="debt_payment" className="bg-black/90">Debt Payment</option>
                <option value="loan_payment" className="bg-black/90">Loan Payment</option>
                <option value="credit_card" className="bg-black/90">Credit Card</option>
                <option value="mortgage" className="bg-black/90">Mortgage</option>
                <option value="other" className="bg-black/90">Other</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                This liability will track spending for the selected category across all accounts.
              </p>
            </div>
          )}

          {/* Account Selection */}
          {providesFunds && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Disbursement Account</label>
              <select
                {...register('disbursementAccountId')}
                className="block w-full rounded-lg border-white/20 bg-black/20 text-white py-3 px-4"
              >
                <option value="">Select account to receive funds</option>
                {(accounts || []).map((account) => (
                  <option key={account.id} value={account.id} className="bg-black/90">
                    {account.name} - {formatCurrency(account.balance)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Default Payment Account</label>
            <select
              {...register('defaultPaymentAccountId')}
              className="block w-full rounded-lg border-white/20 bg-black/20 text-white py-3 px-4"
            >
              <option value="">Select default payment account</option>
              {(accounts || []).map((account) => (
                <option key={account.id} value={account.id} className="bg-black/90">
                  {account.name} - {formatCurrency(account.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Auto Generate Bills */}
          <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-white">Auto-Generate Bills</h4>
                <p className="text-sm text-green-300">
                  Automatically create bill reminders for payments
                </p>
              </div>
              <button
                type="button"
                onClick={() => setValue('autoGenerateBills', !autoGenerateBills)}
              >
                {autoGenerateBills ? (
                  <ToggleRight size={32} className="text-green-400" />
                ) : (
                  <ToggleLeft size={32} className="text-gray-500" />
                )}
              </button>
            </div>

            {autoGenerateBills && (
              <Input
                label="Bill Generation Day"
                type="number"
                min="1"
                max="31"
                {...register('billGenerationDay')}
                className="bg-black/40 border-white/20 text-white"
                helpText="Day of month to generate bill reminders"
              />
            )}
          </div>

          {/* EMI Calculation Preview */}
          {emiCalculation && (
            <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center text-blue-400 mb-2">
                <Calculator size={16} className="mr-2" />
                <span className="font-medium">Payment Calculation</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-black/30 p-3 rounded">
                  <p className="text-gray-400 mb-1">Total Interest</p>
                  <p className="text-error-400 font-medium">{formatCurrency(emiCalculation.totalInterest)}</p>
                </div>
                <div className="bg-black/30 p-3 rounded">
                  <p className="text-gray-400 mb-1">Payoff Time</p>
                  <p className="text-primary-400 font-medium">{emiCalculation.totalMonths} months</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(2)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={isSubmitting}
            >
              {initialData ? 'Update' : 'Create'} Liability
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};
