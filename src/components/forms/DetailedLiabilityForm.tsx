import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Percent, DollarSign, CreditCard, Building, Car, Home, GraduationCap, ShoppingCart, Users, Scale, Zap, FileText, Globe, Wallet, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { getLiabilityBehavior, LiabilityType } from '../../lib/liability-behaviors';

interface DetailedLiabilityFormData {
  name: string;
  description?: string;
  liabilityType: LiabilityType;
  liabilityStatus: 'new' | 'existing';
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  minimumPayment: number;
  paymentDay: number;
  loanTermMonths?: number;
  remainingTermMonths?: number;
  startDate: string;
  dueDate?: string;
  nextPaymentDate?: string;
  currencyCode: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  autoGenerateBills: boolean;
  sendReminders: boolean;
  reminderDays: number;
  paymentStrategy: 'equal' | 'proportional' | 'priority' | 'manual';
  accountIds: string[];
  typeSpecificData: Record<string, any>;
}

interface DetailedLiabilityFormProps {
  initialData?: Partial<DetailedLiabilityFormData>;
  onSubmit: (data: DetailedLiabilityFormData) => Promise<void>;
  onCancel: () => void;
}

export const DetailedLiabilityForm: React.FC<DetailedLiabilityFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const { accounts } = useFinance();
  const { currency, formatCurrency } = useInternationalization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<DetailedLiabilityFormData>({
    defaultValues: {
      liabilityType: initialData?.liabilityType || 'personal_loan',
      liabilityStatus: initialData?.liabilityStatus || 'new',
      currencyCode: initialData?.currencyCode || currency.code,
      priority: initialData?.priority || 'medium',
      autoGenerateBills: initialData?.autoGenerateBills ?? true,
      sendReminders: initialData?.sendReminders ?? true,
      reminderDays: initialData?.reminderDays || 7,
      paymentStrategy: initialData?.paymentStrategy || 'equal',
      accountIds: initialData?.accountIds || [],
      typeSpecificData: initialData?.typeSpecificData || {},
      ...initialData
    }
  });

  const liabilityType = watch('liabilityType');
  const liabilityStatus = watch('liabilityStatus');
  const autoGenerateBills = watch('autoGenerateBills');
  const sendReminders = watch('sendReminders');

  const behavior = getLiabilityBehavior(liabilityType);

  // Set default values based on liability type
  useEffect(() => {
    if (liabilityType) {
      const defaults = behavior.defaultSettings;
      setValue('autoGenerateBills', defaults.autoGenerateBills);
      setValue('sendReminders', defaults.sendReminders);
      setValue('reminderDays', defaults.reminderDays);
      setValue('priority', defaults.priority);
      setValue('interestRate', behavior.interestRate.default);
    }
  }, [liabilityType, behavior, setValue]);

  const handleFormSubmit = async (data: DetailedLiabilityFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Add selected accounts to form data
      data.accountIds = selectedAccounts;
      
      await onSubmit(data);
    } catch (error: any) {
      console.error('Error submitting liability:', error);
      setError(error.message || 'Failed to save liability');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-500/30 mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <span className="text-3xl">{behavior.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-white">{behavior.displayName}</h2>
            <p className="text-gray-300">{behavior.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 mt-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            liabilityStatus === 'new' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-blue-500/20 text-blue-400'
          }`}>
            {liabilityStatus === 'new' ? 'New Liability' : 'Existing Liability'}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
            {behavior.paymentStructure.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle size={18} className="text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-black/20 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Liability Name"
              type="text"
              placeholder="e.g., Student Loan, Credit Card"
              icon={<Building size={18} className="text-blue-400" />}
              {...register('name', { required: 'Liability name is required' })}
              error={errors.name?.message}
              className="bg-black/20 border-white/20 text-white"
            />

            <Input
              label="Description (Optional)"
              type="text"
              placeholder="Additional details"
              {...register('description')}
              className="bg-black/20 border-white/20 text-white"
            />
          </div>
        </div>

        {/* Financial Details */}
        <div className="bg-black/20 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Financial Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liabilityStatus === 'new' ? (
              <Input
                label="Starting Amount"
                type="number"
                step="0.01"
                placeholder="e.g., 50000"
                icon={<CurrencyIcon currencyCode={watch('currencyCode') || currency.code} className="text-green-400" />}
                {...register('totalAmount', {
                  required: 'Starting amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                error={errors.totalAmount?.message}
                className="bg-black/20 border-white/20 text-white"
              />
            ) : (
              <>
                <Input
                  label="Total Amount"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 100000"
                  icon={<CurrencyIcon currencyCode={watch('currencyCode') || currency.code} className="text-green-400" />}
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
                  step="0.01"
                  placeholder="e.g., 75000"
                  icon={<CurrencyIcon currencyCode={watch('currencyCode') || currency.code} className="text-orange-400" />}
                  {...register('remainingAmount', {
                    required: 'Remaining amount is required',
                    min: { value: 0, message: 'Amount must be 0 or greater' }
                  })}
                  error={errors.remainingAmount?.message}
                  className="bg-black/20 border-white/20 text-white"
                />
              </>
            )}

            <Input
              label="Interest Rate (%)"
              type="number"
              step="0.01"
              placeholder={`e.g., ${behavior.interestRate.default}`}
              icon={<Percent size={18} className="text-yellow-400" />}
              {...register('interestRate', {
                required: 'Interest rate is required',
                min: { value: 0, message: 'Interest rate must be 0 or greater' },
                max: { value: 100, message: 'Interest rate must be less than 100' }
              })}
              error={errors.interestRate?.message}
              className="bg-black/20 border-white/20 text-white"
            />

            <Input
              label="Monthly Payment"
              type="number"
              step="0.01"
              placeholder="e.g., 5000"
              icon={<CurrencyIcon currencyCode={watch('currencyCode') || currency.code} className="text-blue-400" />}
              {...register('monthlyPayment', {
                required: 'Monthly payment is required',
                min: { value: 0.01, message: 'Payment must be greater than 0' }
              })}
              error={errors.monthlyPayment?.message}
              className="bg-black/20 border-white/20 text-white"
            />

            <Input
              label="Minimum Payment"
              type="number"
              step="0.01"
              placeholder="e.g., 2000"
              icon={<CurrencyIcon currencyCode={watch('currencyCode') || currency.code} className="text-red-400" />}
              {...register('minimumPayment', {
                min: { value: 0, message: 'Minimum payment must be 0 or greater' }
              })}
              error={errors.minimumPayment?.message}
              className="bg-black/20 border-white/20 text-white"
            />

            <Input
              label="Payment Day"
              type="number"
              min="1"
              max="31"
              placeholder="e.g., 15"
              icon={<Calendar size={18} className="text-purple-400" />}
              {...register('paymentDay', {
                required: 'Payment day is required',
                min: { value: 1, message: 'Payment day must be 1-31' },
                max: { value: 31, message: 'Payment day must be 1-31' }
              })}
              error={errors.paymentDay?.message}
              className="bg-black/20 border-white/20 text-white"
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-black/20 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              icon={<Calendar size={18} className="text-green-400" />}
              {...register('startDate', { required: 'Start date is required' })}
              error={errors.startDate?.message}
              className="bg-black/20 border-white/20 text-white"
            />

            <Input
              label="Due Date (Optional)"
              type="date"
              icon={<Calendar size={18} className="text-orange-400" />}
              {...register('dueDate')}
              className="bg-black/20 border-white/20 text-white"
            />

            <Input
              label="Loan Term (Months)"
              type="number"
              placeholder="e.g., 36"
              icon={<Calendar size={18} className="text-blue-400" />}
              {...register('loanTermMonths', {
                min: { value: 1, message: 'Term must be at least 1 month' }
              })}
              error={errors.loanTermMonths?.message}
              className="bg-black/20 border-white/20 text-white"
            />

            <Input
              label="Next Payment Date"
              type="date"
              icon={<Calendar size={18} className="text-purple-400" />}
              {...register('nextPaymentDate')}
              className="bg-black/20 border-white/20 text-white"
            />
          </div>
        </div>

        {/* Payment Accounts */}
        <div className="bg-black/20 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Accounts</h3>
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-3">
              Select which accounts can be used to pay this liability
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(accounts || []).map((account) => (
                <label key={account.id} className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:border-white/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAccounts.includes(account.id)}
                    onChange={() => handleAccountToggle(account.id)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-white">{account.name}</div>
                    <div className="text-sm text-gray-400">
                      {formatCurrency(account.balance)} • {account.type}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-black/20 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Auto-Generate Bills</h4>
                <p className="text-sm text-gray-400">Automatically create bills for payments</p>
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

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Send Reminders</h4>
                <p className="text-sm text-gray-400">Get notified before payments are due</p>
              </div>
              <button
                type="button"
                onClick={() => setValue('sendReminders', !sendReminders)}
              >
                {sendReminders ? (
                  <ToggleRight size={32} className="text-blue-400" />
                ) : (
                  <ToggleLeft size={32} className="text-gray-500" />
                )}
              </button>
            </div>

            {sendReminders && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Reminder Days Before"
                  type="number"
                  min="1"
                  max="30"
                  {...register('reminderDays', {
                    min: { value: 1, message: 'Must be at least 1 day' },
                    max: { value: 30, message: 'Must be 30 days or less' }
                  })}
                  error={errors.reminderDays?.message}
                  className="bg-black/40 border-white/20 text-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={isSubmitting}
          >
            {initialData ? 'Update' : 'Create'} Liability
          </Button>
        </div>
      </form>
    </div>
  );
};
