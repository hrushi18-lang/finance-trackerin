import React, { useState, useEffect } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useFinance } from '../../contexts/FinanceContextOffline';
import { Transaction, FinancialAccount } from '../../types/index';
import { Calendar, Tag, DollarSign, FileText, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import LuxuryCategoryIcon from '../common/LuxuryCategoryIcon';

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
  const { accounts, addTransaction, updateTransaction } = useFinance();
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: defaultType,
    account_id: defaultAccountId || '',
    target_account_id: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        target_account_id: transaction.target_account_id || '',
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
      const transactionData = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        type: formData.type,
        account_id: formData.account_id,
        target_account_id: formData.target_account_id || null,
        notes: formData.notes
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
