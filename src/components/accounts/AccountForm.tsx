import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';
import { formatCurrency, CURRENCIES } from '../../utils/currency-converter';
import { currencyService } from '../../services/currencyService';
import { FinancialAccount, CreateAccountData } from '../../lib/finance-manager';
import { useProfile } from '../../contexts/ProfileContext';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { currencyConversionService } from '../../services/currencyConversionService';
import { Decimal } from 'decimal.js';
import { CheckCircle, AlertCircle, Loader2, DollarSign, Building2, CreditCard, PiggyBank } from 'lucide-react';

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAccountData) => Promise<void>;
  account?: FinancialAccount | null;
  loading?: boolean;
}

const accountTypes = [
  { value: 'bank_savings', label: 'Savings Account', icon: PiggyBank },
  { value: 'bank_checking', label: 'Checking Account', icon: Building2 },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { value: 'investment', label: 'Investment Account', icon: Building2 },
  { value: 'cash', label: 'Cash', icon: DollarSign },
  { value: 'crypto', label: 'Cryptocurrency', icon: DollarSign },
  { value: 'other', label: 'Other', icon: Building2 }
];

const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' }
];

export const AccountForm: React.FC<AccountFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  account,
  loading = false
}) => {
  const { profile } = useProfile();
  const { primaryCurrency, executeAccountCreation } = useFinance();
  const { formatCurrency: formatCurrencyFunc } = useInternationalization();
  
  const [formData, setFormData] = useState<CreateAccountData>({
    name: '',
    type: 'bank_savings',
    balance: 0,
    institution: '',
    platform: '',
    account_number: '',
    currency: profile?.primaryCurrency || 'USD'
  });

  const [showInitialBalance, setShowInitialBalance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Currency conversion state
  const [conversionPreview, setConversionPreview] = useState<{
    accountAmount: number;
    accountCurrency: string;
    primaryAmount: number;
    primaryCurrency: string;
    exchangeRate: number;
    conversionCase: string;
  } | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance,
        institution: account.institution || '',
        platform: account.platform || '',
        account_number: account.account_number || '',
        currency: account.currencycode
      });
      setShowInitialBalance(account.balance > 0);
    } else {
      setFormData({
        name: '',
        type: 'bank_savings',
        balance: 0,
        institution: '',
        platform: '',
        account_number: '',
        currency: profile?.primaryCurrency || 'USD'
      });
      setShowInitialBalance(true);
    }
    setErrors({});
  }, [account, isOpen, profile?.primaryCurrency]);

  // Generate conversion preview when balance or currency changes
  useEffect(() => {
    if (formData.balance > 0 && formData.currency) {
      generateConversionPreview();
    } else {
      setConversionPreview(null);
      setConversionError(null);
    }
  }, [formData.balance, formData.currency]);

  const generateConversionPreview = async () => {
    if (!formData.balance || !formData.currency) return;

    try {
      setConversionError(null);
      
      // Create a preview request
      const previewRequest = {
        amount: formData.balance,
        currency: formData.currency,
        accountId: 'preview', // Dummy account for preview
        operation: 'create' as const,
        description: 'Preview',
        accountName: formData.name,
        accountType: formData.type
      };

      // Use the execution engine to get conversion preview
      const { CurrencyExecutionEngine } = await import('../../services/currencyExecutionEngine');
      const engine = new CurrencyExecutionEngine([], primaryCurrency.code);
      
      const result = await engine.executeAccountCreation(previewRequest);
      
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

  const handleInputChange = (field: keyof CreateAccountData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    // Validate form
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Account name is required';
    if (!formData.type) newErrors.type = 'Account type is required';
    if (formData.balance < 0) newErrors.balance = 'Balance cannot be negative';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      // Use currency execution engine for account creation
      const executionRequest = {
        amount: formData.balance,
        currency: formData.currency,
        accountId: 'new-account', // Will be generated
        operation: 'create' as const,
        description: `Account: ${formData.name}`,
        accountName: formData.name,
        accountType: formData.type
      };

      const result = await executeAccountCreation(executionRequest);

      if (result.success) {
        // Create account data with converted amounts
        const accountData: CreateAccountData = {
          name: formData.name,
          type: formData.type,
          balance: result.accountAmount, // Use account currency amount
          institution: formData.institution,
          platform: formData.platform,
          account_number: formData.account_number,
          currency: result.accountCurrency,
          // Multi-currency data
          native_amount: result.auditData.originalAmount,
          native_currency: result.auditData.originalCurrency,
          converted_amount: result.primaryAmount,
          converted_currency: result.primaryCurrency,
          exchange_rate: result.exchangeRate || 1,
          conversion_source: result.conversionSource || 'manual'
        };

        await onSubmit(accountData);
        onClose();
      } else {
        throw new Error(result.error || 'Account creation failed');
      }
    } catch (error: any) {
      console.error('Account creation error:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAccountType = accountTypes.find(type => type.value === formData.type);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Account" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Type Selection */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {accountTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleInputChange('type', type.value)}
                >
                  <IconComponent size={20} className="text-blue-500 mb-2" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {type.label}
                  </div>
                </button>
              );
            })}
          </div>
          {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
        </div>

        {/* Account Details */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Account Name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              placeholder="e.g., Chase Savings"
              required
            />
            
            <Input
              label="Institution"
              type="text"
              value={formData.institution}
              onChange={(e) => handleInputChange('institution', e.target.value)}
              placeholder="e.g., Chase Bank"
            />
          </div>
        </div>

        {/* Initial Balance with Currency Conversion */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Initial Balance</h3>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={showInitialBalance}
                onChange={(e) => setShowInitialBalance(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Add initial balance to this account
              </span>
            </label>
            
            {showInitialBalance && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Initial Balance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.balance}
                    onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
                    error={errors.balance}
                    icon={<DollarSign size={18} className="text-blue-500" />}
                    className="text-lg font-semibold"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Select
                    label="Currency"
                    value={formData.currency}
                    onChange={(value) => handleInputChange('currency', value)}
                    options={currencyOptions}
                    icon={<DollarSign size={18} className="text-blue-500" />}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conversion Preview */}
        {conversionPreview && showInitialBalance && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
              <h4 className="font-medium text-green-900 dark:text-green-100">Conversion Preview</h4>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Account balance:</span>
                <span className="font-medium">
                  {currencyConversionService.formatAmount(new Decimal(formData.balance), formData.currency)}
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
                    1 {formData.currency} = {conversionPreview.exchangeRate.toFixed(6)} {conversionPreview.primaryCurrency}
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
        {conversionError && showInitialBalance && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">
                Conversion failed: {conversionError}
              </span>
            </div>
          </div>
        )}

        {/* Additional Details */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Details (Optional)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Platform"
              type="text"
              value={formData.platform}
              onChange={(e) => handleInputChange('platform', e.target.value)}
              placeholder="e.g., Mobile App, Online Banking"
            />
            
            <Input
              label="Account Number"
              type="text"
              value={formData.account_number}
              onChange={(e) => handleInputChange('account_number', e.target.value)}
              placeholder="Last 4 digits (optional)"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}

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
            disabled={isSubmitting || (showInitialBalance && (!conversionPreview || !!conversionError))}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};