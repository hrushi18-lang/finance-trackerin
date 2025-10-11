import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Calculator, Info, AlertTriangle, Globe, ArrowRight } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Liability, FinancialAccount } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { unifiedCurrencyService } from '../../services/unifiedCurrencyService';
import { useProfile } from '../../contexts/ProfileContext';
import { useFinance } from '../../contexts/FinanceContext';

interface PaymentFormData {
  amount: number;
  description: string;
  createTransaction: boolean;
  accountId: string;
  currency: string;
}

interface PaymentFormProps {
  liability?: Liability;
  accounts?: FinancialAccount[];
  onSubmit: (data: PaymentFormData) => void;
  onCancel: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ liability, accounts = [], onSubmit, onCancel }) => {
  const { currency, formatCurrency } = useInternationalization();
  const { profile } = useProfile();
  const { user } = useFinance();
  const [paymentImpact, setPaymentImpact] = useState<{
    newBalance: number;
    percentagePaid: number;
    accountName: string;
  } | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversionPreview, setConversionPreview] = useState<any | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);
  
  const primaryCurrency = profile?.primaryCurrency || currency.code;
  const liabilityCurrency = (liability as any)?.currencycode || (liability as any)?.currencyCode || primaryCurrency;
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PaymentFormData>({
    defaultValues: {
      description: liability ? `Payment for ${liability.name}` : '',
      amount: liability?.monthlyPayment || 0,
      createTransaction: true,
      accountId: liability?.defaultPaymentAccountId || accounts?.[0]?.id || '',
      currency: currency.code,
    },
  });

  const watchedAmount = watch('amount');
  const createTransaction = watch('createTransaction');
  const watchedAccountId = watch('accountId');

  // Update selected account when accountId changes
  useEffect(() => {
    if (watchedAccountId) {
      const account = accounts.find(acc => acc.id === watchedAccountId);
      setSelectedAccount(account || null);
    }
  }, [watchedAccountId, accounts]);

  // ✅ Generate conversion preview using unified service
  useEffect(() => {
    const generatePreview = async () => {
      if (watchedAmount && selectedAccount && liability && watchedAmount > 0) {
        try {
      const amount = parseFloat(watchedAmount.toString());
          if (isNaN(amount) || amount <= 0) {
            setConversionPreview(null);
            setPaymentImpact(null);
          return;
        }

          const accountCurrency = selectedAccount.currencycode || primaryCurrency;
          
          // Use processPayment for liability payment preview
          const preview = await unifiedCurrencyService.processPayment({
            paymentType: 'liability_payment',
            amount: amount,
            paymentCurrency: accountCurrency, // Payment in account currency
            accountId: selectedAccount.id,
            accountCurrency: accountCurrency,
            primaryCurrency: primaryCurrency,
            userId: user?.id || '',
            targetEntityId: liability.id || '',
            targetEntityType: 'liability',
            targetEntityCurrency: liabilityCurrency,
            targetEntityAmount: liability.remainingAmount || liability.totalAmount,
            description: `Payment for ${liability.name}`
          });
          
          if (preview.success) {
            setConversionPreview(preview);
            
            // Calculate payment impact
            const remainingAmount = liability.remainingAmount || liability.totalAmount;
            const newBalance = Math.max(0, remainingAmount - preview.entityAddition);
            const totalAmount = liability.totalAmount;
            const percentagePaid = totalAmount > 0 ? ((totalAmount - newBalance) / totalAmount) * 100 : 0;
            
            setPaymentImpact({
              newBalance: newBalance,
              percentagePaid: percentagePaid,
              accountName: selectedAccount.name
            });
            
            console.log('💡 Liability payment preview:', {
              deductFromAccount: `${preview.accountCurrency}${preview.accountDeduction}`,
              reduceLiability: `${preview.entityCurrency}${preview.entityAddition}`,
              newBalance: newBalance
        });
      } else {
            setConversionPreview(null);
            setPaymentImpact(null);
          }
        } catch (error: any) {
          console.error('Conversion preview error:', error);
          setConversionPreview(null);
        setPaymentImpact(null);
      }
    } else {
        setConversionPreview(null);
      setPaymentImpact(null);
    }
    };
    
    generatePreview();
  }, [watchedAmount, selectedAccount, liability, primaryCurrency, liabilityCurrency, user]);

  const handleFormSubmit = (data: PaymentFormData) => {
    try {
      setIsSubmitting(true);
      
      const amount = Number(data.amount) || 0;
      const remainingAmount = Number(liability?.remainingAmount) || 0;
      
      if (amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }
      
      // Handle overpayment with user confirmation
      if (amount > remainingAmount && remainingAmount > 0) {
        const confirmed = window.confirm(`Payment of ${formatCurrency(amount)} exceeds remaining balance of ${formatCurrency(remainingAmount)}. Adjust to full payoff amount?`);
        if (!confirmed) {
          setIsSubmitting(false);
          return;
        }
        data.amount = remainingAmount;
      }
      
      // ✅ Pass conversion data with submission
      const submissionData = {
        ...data,
        conversionData: conversionPreview ? {
          accountDeduction: conversionPreview.accountDeduction,
          entityAddition: conversionPreview.entityAddition,
          transactionData: conversionPreview.transactionData
        } : null
      };
      
      onSubmit(submissionData as any);
    } catch (error) {
      console.error('Payment form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!liability) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Make Payment</h3>
          <p className="text-sm text-gray-500 mt-1">{liability.name}</p>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          ✕
        </button>
      </div>

      {/* Liability Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(liability.totalAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Remaining</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(liability.remainingAmount || liability.totalAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monthly Payment</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(liability.monthlyPayment)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Minimum Payment</p>
            <p className="text-lg font-bold text-orange-600">{formatCurrency(liability.minimumPayment)}</p>
          </div>
        </div>
      </div>

      {/* ✅ Conversion Preview */}
      {conversionPreview && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-900 mb-3">💰 Payment Conversion Preview</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-green-700">Deduct from account:</span>
              <span className="font-semibold text-green-900">
                {conversionPreview.accountCurrency} {conversionPreview.accountDeduction.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-center text-green-600">
              <ArrowRight size={16} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-700">Reduce liability by:</span>
              <span className="font-semibold text-green-900">
                {conversionPreview.entityCurrency} {conversionPreview.entityAddition.toFixed(2)}
              </span>
            </div>
            {conversionPreview.accountCurrency !== conversionPreview.entityCurrency && (
              <div className="text-xs text-green-600 mt-2 pt-2 border-t border-green-200">
                Exchange rate: 1 {conversionPreview.accountCurrency} = {conversionPreview.exchangeRates.paymentToEntity.toFixed(4)} {conversionPreview.entityCurrency}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Impact */}
      {paymentImpact && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-purple-900 mb-3">📊 Payment Impact</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-purple-700">New remaining balance:</span>
              <span className="font-semibold text-purple-900">{formatCurrency(paymentImpact.newBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">Total paid:</span>
              <span className="font-semibold text-purple-900">{paymentImpact.percentagePaid.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(paymentImpact.percentagePaid, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Amount
          </label>
          <Input
            type="number"
            step="0.01"
            {...register('amount', {
              required: 'Payment amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' }
            })}
            placeholder="Enter payment amount"
            error={errors.amount?.message}
          />
        </div>

        {/* Account Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
              Pay From Account
            </label>
            <select
            {...register('accountId', { required: 'Please select an account' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
            <option value="">Select account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                {account.name} - {formatCurrency(account.balance)}
                </option>
              ))}
            </select>
            {errors.accountId && (
            <p className="text-red-500 text-sm mt-1">{errors.accountId.message}</p>
            )}
          </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <Input
            {...register('description')}
            placeholder="Payment description (optional)"
          />
        </div>

        {/* Create Transaction Toggle */}
        <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register('createTransaction')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
          <label className="ml-2 text-sm text-gray-700">
            Create transaction record
            </label>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
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
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isSubmitting || !conversionPreview}
          >
            {isSubmitting ? 'Processing...' : 'Make Payment'}
          </Button>
        </div>
      </form>
    </div>
  );
};
