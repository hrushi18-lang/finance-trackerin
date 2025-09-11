import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Modal } from '../common/Modal';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { sanitizeFinancialData, toNumber } from '../../utils/validation';
import { Calendar, Clock, AlertCircle, CreditCard, DollarSign } from 'lucide-react';

interface LiabilityMockTransactionFormData {
  type: 'payment' | 'interest' | 'fee' | 'refund';
  amount: number;
  description: string;
  date: string;
  isRecurring: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recurringEndDate?: string;
  notes?: string;
}

interface LiabilityMockTransactionFormProps {
  liability: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LiabilityMockTransactionFormData) => Promise<void>;
}

export const LiabilityMockTransactionForm: React.FC<LiabilityMockTransactionFormProps> = ({
  liability,
  isOpen,
  onClose,
  onSubmit
}) => {
  const { accounts } = useFinance();
  const { currency, formatCurrency } = useInternationalization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LiabilityMockTransactionFormData>({
    defaultValues: {
      type: 'payment',
      amount: liability?.monthlyPayment || 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringFrequency: 'monthly',
      recurringEndDate: '',
      notes: ''
    },
  });

  const transactionType = watch('type');
  const isRecurring = watch('isRecurring');

  const handleFormSubmit = async (data: LiabilityMockTransactionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Sanitize numeric fields
      const sanitizedData = sanitizeFinancialData(data, ['amount']);
      
      await onSubmit({
        ...sanitizedData,
        amount: toNumber(sanitizedData.amount),
      });
      
    } catch (error: any) {
      console.error('Error submitting mock transaction:', error);
      setError(error.message || 'Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign size={18} className="text-green-400" />;
      case 'interest': return <CreditCard size={18} className="text-yellow-400" />;
      case 'fee': return <AlertCircle size={18} className="text-red-400" />;
      case 'refund': return <DollarSign size={18} className="text-blue-400" />;
      default: return <DollarSign size={18} className="text-gray-400" />;
    }
  };

  const getTransactionTypeDescription = (type: string) => {
    switch (type) {
      case 'payment': return 'Regular payment towards the liability';
      case 'interest': return 'Interest charge added to the liability';
      case 'fee': return 'Late fee or penalty charge';
      case 'refund': return 'Refund or credit applied to the liability';
      default: return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Mock Transaction">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} className="text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Liability Info */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CreditCard size={20} className="text-blue-400" />
            <div>
              <h3 className="font-medium text-blue-300">{liability?.name}</h3>
              <p className="text-sm text-blue-400">
                Remaining: {formatCurrency(liability?.remainingAmount || 0, currency.code)}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Transaction Type</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'payment', label: 'Payment', description: 'Regular payment' },
              { value: 'interest', label: 'Interest', description: 'Interest charge' },
              { value: 'fee', label: 'Fee', description: 'Late fee/penalty' },
              { value: 'refund', label: 'Refund', description: 'Credit/refund' }
            ].map((type) => (
              <label key={type.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={type.value}
                  {...register('type')}
                  className="sr-only"
                />
                <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  transactionType === type.value 
                    ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                    : 'border-white/20 hover:border-white/30 text-gray-300'
                }`}>
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    {getTransactionTypeIcon(type.value)}
                    <p className="font-medium text-sm">{type.label}</p>
                  </div>
                  <p className="text-xs opacity-80">{type.description}</p>
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {getTransactionTypeDescription(transactionType)}
          </p>
        </div>

        {/* Amount */}
        <Input
          label="Amount"
          type="number"
          step="0.01"
          icon={<DollarSign size={18} className="text-green-400" />}
          {...register('amount', {
            required: 'Amount is required',
            min: { value: 0.01, message: 'Amount must be greater than 0' },
          })}
          error={errors.amount?.message}
          className="bg-black/20 border-white/20 text-white"
          placeholder={`e.g., ${liability?.monthlyPayment || 0}`}
          helpText={`Suggested: ${formatCurrency(liability?.monthlyPayment || 0, currency.code)}`}
        />

        {/* Description */}
        <Input
          label="Description"
          type="text"
          {...register('description', { required: 'Description is required' })}
          error={errors.description?.message}
          className="bg-black/20 border-white/20 text-white"
          placeholder={`e.g., ${transactionType === 'payment' ? 'Monthly payment' : transactionType === 'interest' ? 'Interest charge' : 'Late fee'}`}
        />

        {/* Date */}
        <Input
          label="Date"
          type="date"
          icon={<Calendar size={18} className="text-blue-400" />}
          {...register('date', { required: 'Date is required' })}
          error={errors.date?.message}
          className="bg-black/20 border-white/20 text-white"
        />

        {/* Recurring Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isRecurring"
              {...register('isRecurring')}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isRecurring" className="text-sm text-gray-300">
              <span className="font-medium">Make this recurring</span>
              <span className="block text-xs text-gray-400">Automatically create similar transactions</span>
            </label>
          </div>

          {isRecurring && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
                <Select
                  value={watch('recurringFrequency') || ''}
                  onChange={(value) => setValue('recurringFrequency', value)}
                  options={[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'yearly', label: 'Yearly' }
                  ]}
                  placeholder="Select frequency"
                  className="bg-black/20 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Date (Optional)</label>
                <Input
                  type="date"
                  {...register('recurringEndDate')}
                  className="bg-black/20 border-white/20 text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <Input
          label="Notes (Optional)"
          type="text"
          {...register('notes')}
          className="bg-black/20 border-white/20 text-white"
          placeholder="Additional notes about this transaction"
        />

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
