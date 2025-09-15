import React, { useState, useEffect } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useFinance } from '../../contexts/FinanceContext';
import { Transaction, FinancialAccount } from '../../types/index';
import { Calendar, Tag, DollarSign, FileText, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Globe } from 'lucide-react';
import { format } from 'date-fns';
import LuxuryCategoryIcon from '../common/LuxuryCategoryIcon';
import { 
  convertTransactionCurrency, 
  generateTransactionDisplayText, 
  generateStorageData,
  formatCurrencyAmount,
  type CurrencyConversionResult,
  type MultiCurrencyTransaction 
} from '../../utils/multi-currency-converter';
import { getCurrencyInfo } from '../../utils/currency-converter';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  defaultType?: 'income' | 'expense' | 'transfer';
  defaultAccountId?: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  transaction,
  defaultType = 'expense',
  defaultAccountId
}) => {
  const { accounts, addTransaction, updateTransaction, getUserCurrency } = useFinance();
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: defaultType,
    account_id: defaultAccountId || '',
    target_account_id: '',
    notes: '',
    currency: getUserCurrency()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionResult, setConversionResult] = useState<CurrencyConversionResult | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);

  // Update selected account when account_id changes
  useEffect(() => {
    if (formData.account_id) {
      const account = accounts.find(acc => acc.id === formData.account_id);
      setSelectedAccount(account || null);
    }
  }, [formData.account_id, accounts]);

  // Handle currency conversion when amount, currency, or account changes
  useEffect(() => {
    if (formData.amount && formData.currency && selectedAccount) {
      const amount = parseFloat(formData.amount);
      if (!isNaN(amount) && amount > 0) {
        const result = convertTransactionCurrency({
          amount,
          currency: formData.currency,
          accountCurrency: selectedAccount.currencycode || getUserCurrency(),
          primaryCurrency: getUserCurrency()
        });
        setConversionResult(result);
      } else {
        setConversionResult(null);
      }
    } else {
      setConversionResult(null);
    }
  }, [formData.amount, formData.currency, selectedAccount, getUserCurrency]);

  const getCategoriesForType = (type: string) => {
    switch (type) {
      case 'income':
        return ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Refund', 'Other'];
      case 'expense':
        return ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Groceries', 'Gas', 'Rent', 'Insurance', 'Other'];
      case 'transfer':
        return ['Transfer', 'Internal Transfer', 'Account Transfer', 'Other'];
      default:
        return ['Other'];
    }
  };

  const categories = getCategoriesForType(formData.type);

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount.toString(),
        description: transaction.description,
        category: transaction.category,
        date: format(new Date(transaction.date), 'yyyy-MM-dd'),
        type: transaction.type,
        account_id: transaction.account_id,
        target_account_id: transaction.transferToAccountId || '',
        notes: transaction.notes || ''
      });
    } else {
      setFormData({
        amount: '',
        description: '',
        category: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: defaultType,
        account_id: defaultAccountId || '',
        target_account_id: '',
        notes: ''
      });
    }
  }, [transaction, defaultType, defaultAccountId, isOpen]);

  // Clear category when transaction type changes
  useEffect(() => {
    if (!transaction) {
      setFormData(prev => ({ ...prev, category: '' }));
    }
  }, [formData.type, transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Generate multi-currency data if conversion is available
      let multiCurrencyData = {};
      if (conversionResult) {
        const storageData = generateStorageData(conversionResult);
        multiCurrencyData = {
          native_amount: storageData.nativeAmount,
          native_currency: storageData.nativeCurrency,
          native_symbol: storageData.nativeSymbol,
          converted_amount: storageData.convertedAmount,
          converted_currency: storageData.convertedCurrency,
          converted_symbol: storageData.convertedSymbol,
          exchange_rate: storageData.exchangeRate,
          exchange_rate_used: storageData.exchangeRateUsed
        };
      }

      const transactionData = {
        amount: conversionResult ? conversionResult.convertedAmount : amount,
        description: formData.description,
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        type: formData.type,
        accountId: formData.account_id,
        transferToAccountId: formData.target_account_id || undefined,
        notes: formData.notes,
        affectsBalance: true,
        currencycode: selectedAccount?.currencycode || getUserCurrency(),
        ...multiCurrencyData
      };

      if (transaction) {
        await updateTransaction(transaction.id, transactionData);
      } else {
        await addTransaction(transactionData);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction.');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpRight size={20} className="text-green-600" />;
      case 'expense':
        return <ArrowDownRight size={20} className="text-red-600" />;
      case 'transfer':
        return <ArrowLeftRight size={20} className="text-blue-600" />;
      default:
        return <DollarSign size={20} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600';
      case 'expense':
        return 'text-red-600';
      case 'transfer':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? 'Edit Transaction' : 'Add Transaction'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Transaction Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['expense', 'income', 'transfer'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: type as any }))}
                className={`p-3 rounded-xl border-2 transition-all ${
                  formData.type === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  {getTransactionIcon(type)}
                  <span className="text-xs font-body capitalize">{type}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Input
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="0.00"
            step="any"
            required
            disabled={loading}
            icon={<DollarSign size={16} />}
          />
          
          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                backgroundColor: 'var(--background)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border)'
              }}
              disabled={loading}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="INR">INR (₹)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="CHF">CHF (CHF)</option>
              <option value="CNY">CNY (¥)</option>
              <option value="SEK">SEK (kr)</option>
            </select>
          </div>

          {/* Currency Conversion Display */}
          {conversionResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Globe size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Currency Conversion</span>
              </div>
              <div className="text-sm text-blue-700">
                {generateTransactionDisplayText(conversionResult)}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <Input
          label="Description"
          type="text"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="What was this transaction for?"
          required
          disabled={loading}
          icon={<FileText size={16} />}
        />

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{
              backgroundColor: 'var(--background)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border)'
            }}
            required
            disabled={loading}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <Input
          label="Date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          required
          disabled={loading}
          icon={<Calendar size={16} />}
        />

        {/* Account */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {formData.type === 'transfer' ? 'From Account' : 'Account'}
          </label>
          <select
            value={formData.account_id}
            onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{
              backgroundColor: 'var(--background)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border)'
            }}
            required
            disabled={loading}
          >
            <option value="">Select an account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} - ${account.balance.toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {/* Target Account (for transfers) */}
        {formData.type === 'transfer' && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              To Account
            </label>
            <select
              value={formData.target_account_id}
              onChange={(e) => setFormData(prev => ({ ...prev, target_account_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                backgroundColor: 'var(--background)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border)'
              }}
              required
              disabled={loading}
            >
              <option value="">Select target account</option>
              {accounts
                .filter(account => account.id !== formData.account_id)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - ${account.balance.toLocaleString()}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Notes */}
        <Input
          label="Notes (Optional)"
          type="text"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes..."
          disabled={loading}
        />

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            loading={loading}
          >
            {transaction ? 'Update Transaction' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
