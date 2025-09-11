import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, DollarSign, CreditCard, Wallet, Target, AlertCircle } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';

export interface UniversalPaymentData {
  amount: number;
  description: string;
  accountId: string;
  deductFromBalance: boolean;
  paymentType: 'contribution' | 'payment' | 'transfer' | 'withdrawal';
  category: string;
  notes?: string;
}

export interface UniversalPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UniversalPaymentData) => Promise<void>;
  sourceEntity?: {
    id: string;
    type: 'goal' | 'liability' | 'bill' | 'account';
    name: string;
    currentAmount?: number;
    targetAmount?: number;
  };
  defaultAmount?: number;
  defaultDescription?: string;
  defaultCategory?: string;
  title?: string;
  showDeductToggle?: boolean;
  paymentType?: 'contribution' | 'payment' | 'transfer' | 'withdrawal';
}

export const UniversalPaymentModal: React.FC<UniversalPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sourceEntity,
  defaultAmount = 0,
  defaultDescription = '',
  defaultCategory = 'General',
  title = 'Add Payment',
  showDeductToggle = true,
  paymentType = 'payment'
}) => {
  const { accounts, addTransaction } = useFinance();
  const { formatCurrency } = useInternationalization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentImpact, setPaymentImpact] = useState<{
    newBalance: number;
    accountName: string;
    willDeduct: boolean;
  } | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UniversalPaymentData>({
    defaultValues: {
      amount: defaultAmount,
      description: defaultDescription,
      accountId: accounts[0]?.id || '',
      deductFromBalance: true,
      paymentType,
      category: defaultCategory,
      notes: ''
    }
  });

  const watchedAmount = watch('amount');
  const watchedAccountId = watch('accountId');
  const watchedDeductFromBalance = watch('deductFromBalance');

  // Calculate payment impact
  useEffect(() => {
    if (watchedAmount && watchedAccountId) {
      const amount = Number(watchedAmount) || 0;
      const selectedAccount = accounts.find(a => a.id === watchedAccountId);
      
      if (amount > 0 && selectedAccount) {
        const currentBalance = Number(selectedAccount.balance) || 0;
        const newBalance = watchedDeductFromBalance ? currentBalance - amount : currentBalance;
        
        setPaymentImpact({
          newBalance,
          accountName: selectedAccount.name,
          willDeduct: watchedDeductFromBalance
        });
      } else {
        setPaymentImpact(null);
      }
    } else {
      setPaymentImpact(null);
    }
  }, [watchedAmount, watchedAccountId, watchedDeductFromBalance, accounts]);

  const handleFormSubmit = async (data: UniversalPaymentData) => {
    try {
      setIsSubmitting(true);
      
      const amount = Number(data.amount) || 0;
      const selectedAccount = accounts.find(a => a.id === data.accountId);
      
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      
      if (!selectedAccount) {
        throw new Error('Please select an account');
      }
      
      // Check if account has sufficient balance when deducting
      if (data.deductFromBalance) {
        const currentBalance = Number(selectedAccount.balance) || 0;
        if (amount > currentBalance) {
          const confirmed = window.confirm(
            `Payment of ${formatCurrency(amount)} exceeds account balance of ${formatCurrency(currentBalance)}. Continue anyway?`
          );
          if (!confirmed) {
            setIsSubmitting(false);
            return;
          }
        }
      }
      
      await onSubmit(data);
      onClose();
    } catch (error: any) {
      console.error('Error processing payment:', error);
      alert(error.message || 'Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setValue('amount', amount);
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'contribution': return <Target size={16} />;
      case 'payment': return <DollarSign size={16} />;
      case 'transfer': return <Wallet size={16} />;
      case 'withdrawal': return <CreditCard size={16} />;
      default: return <DollarSign size={16} />;
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'contribution': return 'Contribution';
      case 'payment': return 'Payment';
      case 'transfer': return 'Transfer';
      case 'withdrawal': return 'Withdrawal';
      default: return 'Payment';
    }
  };

  const categoryOptions = [
    { value: 'General', label: 'General' },
    { value: 'Bills', label: 'Bills' },
    { value: 'Savings', label: 'Savings' },
    { value: 'Debt Payment', label: 'Debt Payment' },
    { value: 'Investment', label: 'Investment' },
    { value: 'Emergency Fund', label: 'Emergency Fund' },
    { value: 'Goal Contribution', label: 'Goal Contribution' },
    { value: 'Transfer', label: 'Transfer' },
    { value: 'Other', label: 'Other' }
  ];

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {getPaymentTypeIcon(paymentType)}
            <h2 className="text-xl font-heading" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Source Entity Info */}
        {sourceEntity && (
          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--accent-light)' }}>
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }}></div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {sourceEntity.name}
              </span>
            </div>
            {sourceEntity.currentAmount !== undefined && sourceEntity.targetAmount !== undefined && (
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Current: {formatCurrency(sourceEntity.currentAmount)} / Target: {formatCurrency(sourceEntity.targetAmount)}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Amount Input */}
          <div>
            <Input
              {...register('amount', { 
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' }
              })}
              type="number"
              step="0.01"
              min="0.01"
              label="Amount"
              placeholder="Enter amount"
              error={errors.amount?.message}
            />
            
            {/* Quick Amount Buttons */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[10, 25, 50, 100, 250, 500].map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleQuickAmount(amount)}
                  className="px-3 py-1 text-sm rounded-lg border transition-colors"
                  style={{ 
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--background)'
                  }}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <Input
            {...register('description', { required: 'Description is required' })}
            label="Description"
            placeholder="Enter payment description"
            error={errors.description?.message}
          />

          {/* Account Selection */}
          <div>
            <Select
              {...register('accountId', { required: 'Account is required' })}
              label="From Account"
              options={accounts.map(account => ({
                value: account.id,
                label: `${account.name} (${formatCurrency(account.balance)})`
              }))}
              error={errors.accountId?.message}
            />
          </div>

          {/* Category */}
          <div>
            <Select
              {...register('category')}
              label="Category"
              options={categoryOptions}
            />
          </div>

          {/* Deduct from Balance Toggle */}
          {showDeductToggle && (
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--accent-light)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    Deduct from Balance
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    This transaction will be recorded as an expense (money leaves your account)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('deductFromBalance')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {watchedDeductFromBalance && (
                <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--warning-light)' }}>
                  <div className="flex items-start space-x-2">
                    <AlertCircle size={16} className="mt-0.5" style={{ color: 'var(--warning)' }} />
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <p className="font-medium">Money will be deducted</p>
                      <p>The amount will be recorded as a '{watch('category')}' expense in your transactions</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Impact Preview */}
          {paymentImpact && (
            <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
              <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Payment Impact
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Account:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{paymentImpact.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>New Balance:</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(paymentImpact.newBalance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Will Deduct:</span>
                  <span style={{ color: paymentImpact.willDeduct ? 'var(--error)' : 'var(--success)' }}>
                    {paymentImpact.willDeduct ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <Input
            {...register('notes')}
            label="Notes (Optional)"
            placeholder="Add any additional notes"
            multiline
            rows={3}
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
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : `${getPaymentTypeLabel(paymentType)} ${formatCurrency(watchedAmount || 0)}`}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
