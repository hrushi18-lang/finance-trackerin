import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeftRight, FileText, AlertCircle } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { FinancialAccount } from '../../types';

interface TransferFormData {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
}

interface TransferFormProps {
  accounts: FinancialAccount[];
  onSubmit: (data: TransferFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  accounts,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const { currency, formatCurrency } = useInternationalization();
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<TransferFormData>();

  const fromAccountId = watch('fromAccountId');
  const toAccountId = watch('toAccountId');
  const amount = watch('amount');

  const fromAccount = accounts.find(a => a.id === fromAccountId);
  const toAccount = accounts.find(a => a.id === toAccountId);

  const handleFormSubmit = async (data: TransferFormData) => {
    try {
      setError(null);
      
      if (data.fromAccountId === data.toAccountId) {
        setError('Cannot transfer to the same account');
        return;
      }

      const fromAcc = accounts.find(a => a.id === data.fromAccountId);
      if (fromAcc && Number(data.amount) > fromAcc.balance) {
        setError('Insufficient balance in source account');
        return;
      }

      await onSubmit({
        ...data,
        amount: Number(data.amount)
      });
    } catch (error: any) {
      console.error('Error transferring funds:', error);
      setError(error.message || 'Transfer failed');
    }
  };

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

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-xl p-4 border border-primary-500/30">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <ArrowLeftRight size={20} className="mr-2 text-primary-400" />
          Transfer Between Accounts
        </h3>
        <p className="text-gray-300 text-sm">
          Move money between your accounts. This will create transactions in both accounts.
        </p>
      </div>

      {/* From Account */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">From Account</label>
        <select
          {...register('fromAccountId', { required: 'Source account is required' })}
          className="block w-full rounded-xl border-white/20 bg-black/20 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
        >
          <option value="">Select source account</option>
          {accounts?.map((account) => (
            <option key={account.id} value={account.id} className="bg-black/90">
              {account.name} - {formatCurrency(account.balance)}
            </option>
          ))}
        </select>
        {errors.fromAccountId && (
          <p className="text-sm text-error-400 mt-1">{errors.fromAccountId.message}</p>
        )}
      </div>

      {/* To Account */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">To Account</label>
        <select
          {...register('toAccountId', { required: 'Destination account is required' })}
          className="block w-full rounded-xl border-white/20 bg-black/20 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
        >
          <option value="">Select destination account</option>
          {accounts?.filter(a => a.id !== fromAccountId).map((account) => (
            <option key={account.id} value={account.id} className="bg-black/90">
              {account.name} - {formatCurrency(account.balance)}
            </option>
          ))}
        </select>
        {errors.toAccountId && (
          <p className="text-sm text-error-400 mt-1">{errors.toAccountId.message}</p>
        )}
      </div>

      {/* Amount */}
      <Input
        label="Transfer Amount"
        type="number"
        step="0.01"
        placeholder="0"
        icon={<CurrencyIcon currencycode={currency.code} className="text-primary-400" />}
        {...register('amount', {
          required: 'Amount is required',
          min: { value: 0.01, message: 'Amount must be greater than 0' },
          max: fromAccount ? { 
            value: fromAccount.balance, 
            message: `Cannot exceed available balance (${formatCurrency(fromAccount.balance)})` 
          } : undefined
        })}
        error={errors.amount?.message}
        className="bg-black/20 border-white/20 text-white"
      />

      {/* Description */}
      <Input
        label="Description"
        type="text"
        placeholder="e.g., Transfer to savings"
        icon={<FileText size={18} className="text-blue-400" />}
        {...register('description', { required: 'Description is required' })}
        error={errors.description?.message}
        className="bg-black/20 border-white/20 text-white"
      />

      {/* Transfer Preview */}
      {fromAccount && toAccount && amount && (
        <div className="bg-primary-500/20 rounded-lg p-4 border border-primary-500/30">
          <div className="flex items-center text-primary-400 mb-2">
            <ArrowLeftRight size={16} className="mr-2" />
            <span className="font-medium">Transfer Preview</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">From: {fromAccount.name}</span>
              <span className="text-error-400">-{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">New Balance:</span>
              <span className="text-white">{formatCurrency(fromAccount.balance - amount)}</span>
            </div>
            <div className="border-t border-white/20 pt-2">
              <div className="flex justify-between">
                <span className="text-gray-300">To: {toAccount.name}</span>
                <span className="text-success-400">+{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">New Balance:</span>
                <span className="text-white">{formatCurrency(toAccount.balance + amount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
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
          disabled={fromAccountId === toAccountId || !fromAccount || !toAccount}
        >
          Transfer Funds
        </Button>
      </div>
    </form>
  );
};