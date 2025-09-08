import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, DollarSign, Percent, CreditCard, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface LiabilityModificationFormData {
  modificationType: 'amount_change' | 'term_change' | 'date_change' | 'account_change' | 'status_change';
  newAmount?: number;
  newTermMonths?: number;
  newStartDate?: string;
  newDueDate?: string;
  newNextPaymentDate?: string;
  newInterestRate?: number;
  newMonthlyPayment?: number;
  reason: string;
  effectiveDate: string;
}

interface LiabilityModificationFormProps {
  liability: any;
  onSubmit: (data: LiabilityModificationFormData) => Promise<void>;
  onCancel: () => void;
}

export const LiabilityModificationForm: React.FC<LiabilityModificationFormProps> = ({
  liability,
  onSubmit,
  onCancel
}) => {
  const { currency, formatCurrency } = useInternationalization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modificationType, setModificationType] = useState<'amount_change' | 'term_change' | 'date_change' | 'account_change' | 'status_change'>('amount_change');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LiabilityModificationFormData>({
    defaultValues: {
      modificationType: 'amount_change',
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: ''
    }
  });

  const handleFormSubmit = async (data: LiabilityModificationFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await onSubmit(data);
    } catch (error: any) {
      console.error('Error modifying liability:', error);
      setError(error.message || 'Failed to modify liability');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modificationTypes = [
    {
      value: 'amount_change',
      label: 'Change Amount',
      description: 'Modify the total or remaining amount',
      icon: <DollarSign size={20} />
    },
    {
      value: 'term_change',
      label: 'Change Term',
      description: 'Extend or shorten the loan term',
      icon: <Calendar size={20} />
    },
    {
      value: 'date_change',
      label: 'Change Dates',
      description: 'Modify start, due, or payment dates',
      icon: <Calendar size={20} />
    },
    {
      value: 'account_change',
      label: 'Change Accounts',
      description: 'Update payment accounts',
      icon: <CreditCard size={20} />
    },
    {
      value: 'status_change',
      label: 'Change Status',
      description: 'Update liability status',
      icon: <AlertCircle size={20} />
    }
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-500/30 mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Modify Liability</h2>
        <p className="text-gray-300">Update details for: <strong>{liability.name}</strong></p>
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

        {/* Modification Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            What would you like to modify?
          </label>
          <div className="grid grid-cols-1 gap-3">
            {modificationTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setModificationType(type.value as any);
                  setValue('modificationType', type.value as any);
                }}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  modificationType === type.value
                    ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                    : 'border-white/20 hover:border-white/30 text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-primary-400">{type.icon}</div>
                  <div>
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs opacity-80">{type.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Change Fields */}
        {modificationType === 'amount_change' && (
          <div className="bg-black/20 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Amount Changes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="New Total Amount"
                type="number"
                step="0.01"
                placeholder={liability.totalAmount?.toString()}
                icon={<CurrencyIcon currencyCode={currency.code} className="text-green-400" />}
                {...register('newAmount', {
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                error={errors.newAmount?.message}
                className="bg-black/20 border-white/20 text-white"
              />
              <Input
                label="New Remaining Amount"
                type="number"
                step="0.01"
                placeholder={liability.remainingAmount?.toString()}
                icon={<CurrencyIcon currencyCode={currency.code} className="text-orange-400" />}
                {...register('newAmount', {
                  min: { value: 0, message: 'Amount must be 0 or greater' }
                })}
                error={errors.newAmount?.message}
                className="bg-black/20 border-white/20 text-white"
              />
            </div>
          </div>
        )}

        {/* Term Change Fields */}
        {modificationType === 'term_change' && (
          <div className="bg-black/20 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Term Changes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="New Loan Term (Months)"
                type="number"
                placeholder={liability.loanTermMonths?.toString()}
                icon={<Calendar size={18} className="text-blue-400" />}
                {...register('newTermMonths', {
                  min: { value: 1, message: 'Term must be at least 1 month' }
                })}
                error={errors.newTermMonths?.message}
                className="bg-black/20 border-white/20 text-white"
              />
              <Input
                label="New Monthly Payment"
                type="number"
                step="0.01"
                placeholder={liability.monthlyPayment?.toString()}
                icon={<CurrencyIcon currencyCode={currency.code} className="text-purple-400" />}
                {...register('newMonthlyPayment', {
                  min: { value: 0.01, message: 'Payment must be greater than 0' }
                })}
                error={errors.newMonthlyPayment?.message}
                className="bg-black/20 border-white/20 text-white"
              />
            </div>
          </div>
        )}

        {/* Date Change Fields */}
        {modificationType === 'date_change' && (
          <div className="bg-black/20 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Date Changes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="New Start Date"
                type="date"
                icon={<Calendar size={18} className="text-green-400" />}
                {...register('newStartDate')}
                className="bg-black/20 border-white/20 text-white"
              />
              <Input
                label="New Due Date"
                type="date"
                icon={<Calendar size={18} className="text-orange-400" />}
                {...register('newDueDate')}
                className="bg-black/20 border-white/20 text-white"
              />
              <Input
                label="New Next Payment Date"
                type="date"
                icon={<Calendar size={18} className="text-blue-400" />}
                {...register('newNextPaymentDate')}
                className="bg-black/20 border-white/20 text-white"
              />
            </div>
          </div>
        )}

        {/* Interest Rate Change */}
        {(modificationType === 'amount_change' || modificationType === 'term_change') && (
          <div className="bg-black/20 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Interest Rate</h3>
            <Input
              label="New Interest Rate (%)"
              type="number"
              step="0.01"
              placeholder={liability.interestRate?.toString()}
              icon={<Percent size={18} className="text-yellow-400" />}
              {...register('newInterestRate', {
                min: { value: 0, message: 'Interest rate must be 0 or greater' },
                max: { value: 100, message: 'Interest rate must be less than 100' }
              })}
              error={errors.newInterestRate?.message}
              className="bg-black/20 border-white/20 text-white"
            />
          </div>
        )}

        {/* Reason and Effective Date */}
        <div className="bg-black/20 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Modification Details</h3>
          <div className="space-y-4">
            <Input
              label="Reason for Change"
              type="text"
              placeholder="e.g., Refinanced, Payment adjustment, etc."
              {...register('reason', { required: 'Reason is required' })}
              error={errors.reason?.message}
              className="bg-black/20 border-white/20 text-white"
            />
            <Input
              label="Effective Date"
              type="date"
              icon={<Calendar size={18} className="text-purple-400" />}
              {...register('effectiveDate', { required: 'Effective date is required' })}
              error={errors.effectiveDate?.message}
              className="bg-black/20 border-white/20 text-white"
            />
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
            Apply Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
