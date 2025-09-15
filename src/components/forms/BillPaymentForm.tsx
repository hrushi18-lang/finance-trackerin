import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, DollarSign, CreditCard, FileText, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { currencyConversionService } from '../../services/currencyConversionService';
import { Decimal } from 'decimal.js';

export interface BillPaymentFormData {
  amount: number;
  description: string;
  accountId: string;
  currency: string;
}

interface BillPaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BillPaymentFormData) => Promise<void>;
  bill: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    dueDate: string;
    status: string;
  };
}

export const BillPaymentForm: React.FC<BillPaymentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bill
}) => {
  const { accounts, executeBillPayment } = useFinance();
  const { primaryCurrency, formatCurrency } = useInternationalization();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(bill.currency);
  const [selectedAccount, setSelectedAccount] = useState<typeof accounts[0] | null>(null);
  const [conversionPreview, setConversionPreview] = useState<{
    accountAmount: number;
    accountCurrency: string;
    primaryAmount: number;
    primaryCurrency: string;
    exchangeRate: number;
    conversionCase: string;
  } | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BillPaymentFormData>({
    defaultValues: {
      amount: bill.amount,
      description: `Bill payment: ${bill.title}`,
      accountId: '',
      currency: bill.currency
    }
  });

  const watchedAmount = watch('amount');
  const watchedAccountId = watch('accountId');

  // Update selected account when accountId changes
  useEffect(() => {
    if (watchedAccountId) {
      const account = accounts.find(acc => acc.id === watchedAccountId);
      setSelectedAccount(account || null);
    }
  }, [watchedAccountId, accounts]);

  // Update currency when account changes
  useEffect(() => {
    if (selectedAccount) {
      setSelectedCurrency(selectedAccount.currencycode);
      setValue('currency', selectedAccount.currencycode);
    }
  }, [selectedAccount, setValue]);

  // Generate conversion preview
  useEffect(() => {
    if (watchedAmount && selectedCurrency && selectedAccount) {
      generateConversionPreview();
    } else {
      setConversionPreview(null);
      setConversionError(null);
    }
  }, [watchedAmount, selectedCurrency, selectedAccount]);

  const generateConversionPreview = async () => {
    if (!watchedAmount || !selectedCurrency || !selectedAccount) return;

    try {
      setConversionError(null);
      
      // Create a preview request
      const previewRequest = {
        amount: Number(watchedAmount),
        currency: selectedCurrency,
        accountId: selectedAccount.id,
        operation: 'deduct' as const,
        description: 'Preview'
      };

      // Use the execution engine to get conversion preview
      const accountBalances = accounts.map(acc => ({
        id: acc.id,
        balance: acc.balance,
        currency: acc.currencycode,
        name: acc.name,
        type: acc.type
      }));

      const { CurrencyExecutionEngine } = await import('../../services/currencyExecutionEngine');
      const engine = new CurrencyExecutionEngine(accountBalances, primaryCurrency.code);
      
      const result = await engine.execute(previewRequest);
      
      if (result.success) {
        setConversionPreview({
          accountAmount: result.accountAmount,
          accountCurrency: result.accountCurrency,
          primaryAmount: result.primaryAmount,
          primaryCurrency: result.primaryCurrency,
          exchangeRate: result.exchangeRate || 1,
          conversionCase: result.auditData.conversionCase
        });
      } else {
        setConversionError(result.error || 'Conversion failed');
      }
    } catch (error: any) {
      console.error('Conversion preview error:', error);
      setConversionError(error.message);
    }
  };

  const handleFormSubmit = async (data: BillPaymentFormData) => {
    try {
      setIsSubmitting(true);
      
      const amount = Number(data.amount) || 0;
      
      if (amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }
      
      if (!data.accountId) {
        throw new Error('Please select an account');
      }

      // Prepare execution request
      const executionRequest = {
        amount,
        currency: selectedCurrency,
        accountId: data.accountId,
        operation: 'deduct' as const,
        description: data.description
      };

      // Execute bill payment
      const result = await executeBillPayment(bill.id, executionRequest);

      if (result.success) {
        console.log(`✅ Bill payment executed successfully:`, {
          billId: bill.id,
          originalAmount: amount,
          accountAmount: result.accountAmount,
          primaryAmount: result.primaryAmount,
          conversionCase: result.auditData.conversionCase
        });
        
        await onSubmit(data);
        onClose();
      } else {
        throw new Error(result.error || 'Bill payment failed');
      }
    } catch (error: any) {
      console.error('Bill payment error:', error);
      alert(`Bill payment failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConversionCaseDescription = (caseType: string) => {
    switch (caseType) {
      case 'all_same':
        return 'No conversion needed - all currencies match';
      case 'amount_account_same':
        return 'Amount matches account currency, converting to primary for net worth';
      case 'amount_primary_same':
        return 'Amount matches primary currency, converting to account currency';
      case 'account_primary_same':
        return 'Account and primary currencies match, converting amount';
      case 'all_different':
        return 'All currencies different - converting to both account and primary';
      case 'amount_different_others_same':
        return 'Amount currency different, account and primary match';
      default:
        return 'Currency conversion';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Pay Bill: ${bill.title}`} size="lg">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Bill Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">{bill.title}</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Due: {new Date(bill.dueDate).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                {currencyConversionService.formatAmount(new Decimal(bill.amount), bill.currency)}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Original amount
              </p>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Amount</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Amount"
                type="number"
                step="0.01"
                min="0"
                icon={<DollarSign size={18} className="text-blue-500" />}
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                error={errors.amount?.message}
                className="text-lg font-semibold"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Select
                label="Currency"
                value={selectedCurrency}
                onChange={(value) => {
                  setSelectedCurrency(value);
                  setValue('currency', value);
                }}
                options={[
                  { value: 'USD', label: 'USD - US Dollar' },
                  { value: 'INR', label: 'INR - Indian Rupee' },
                  { value: 'EUR', label: 'EUR - Euro' },
                  { value: 'GBP', label: 'GBP - British Pound' },
                  { value: 'CAD', label: 'CAD - Canadian Dollar' },
                  { value: 'AUD', label: 'AUD - Australian Dollar' }
                ]}
                icon={<CurrencyIcon currency={selectedCurrency} size={18} />}
              />
            </div>
          </div>
        </div>

        {/* Conversion Preview */}
        {conversionPreview && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
              <h4 className="font-medium text-green-900 dark:text-green-100">Payment Preview</h4>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">You're paying:</span>
                <span className="font-medium">
                  {currencyConversionService.formatAmount(new Decimal(watchedAmount), selectedCurrency)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">From account:</span>
                <span className="font-medium">
                  {currencyConversionService.formatAmount(new Decimal(conversionPreview.accountAmount), conversionPreview.accountCurrency)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Net worth impact:</span>
                <span className="font-medium">
                  {currencyConversionService.formatAmount(new Decimal(conversionPreview.primaryAmount), conversionPreview.primaryCurrency)}
                </span>
              </div>
              
              {conversionPreview.exchangeRate !== 1 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Exchange rate:</span>
                  <span className="font-medium">
                    1 {selectedCurrency} = {conversionPreview.exchangeRate.toFixed(6)} {conversionPreview.accountCurrency}
                  </span>
                </div>
              )}
              
              <div className="pt-2 border-t border-green-200 dark:border-green-700">
                <p className="text-xs text-green-700 dark:text-green-300">
                  {getConversionCaseDescription(conversionPreview.conversionCase)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Conversion Error */}
        {conversionError && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">
                Conversion failed: {conversionError}
              </span>
            </div>
          </div>
        )}

        {/* Account Selection */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account</h3>
          
          <Select
            label="Pay From Account"
            value={watchedAccountId}
            onChange={(value) => setValue('accountId', value)}
            options={accounts.map(account => ({
              value: account.id,
              label: `${account.name} - ${currencyConversionService.formatAmount(new Decimal(account.balance), account.currencycode)} (${account.type.replace('_', ' ')})`
            }))}
            icon={<CreditCard size={18} className="text-gray-500" />}
            error={errors.accountId?.message}
          />
        </div>

        {/* Description */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h3>
          
          <Input
            label="Description (Optional)"
            type="text"
            icon={<FileText size={18} className="text-blue-400" />}
            {...register('description')}
            error={errors.description?.message}
            className="bg-black/40 border-white/20 text-white"
            placeholder="e.g., Monthly bill payment"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting || !conversionPreview || !!conversionError}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Pay Bill'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};