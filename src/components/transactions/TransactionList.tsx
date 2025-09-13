import React, { useState, useMemo } from 'react';
import { useFinance } from '../../contexts/FinanceContext';
import { Transaction, FinancialAccount } from '../../types/index';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TransactionForm } from './TransactionForm';
import { 
  Search, 
  Filter, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowLeftRight,
  Edit,
  Trash2,
  Calendar,
  Tag,
  DollarSign
} from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import LuxuryCategoryIcon from '../common/LuxuryCategoryIcon';
import { TransactionDetailsModal } from '../modals/TransactionDetailsModal';

interface TransactionListProps {
  accountId?: string;
  limit?: number;
  showFilters?: boolean;
  showAddButton?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  accountId,
  limit,
  showFilters = true,
  showAddButton = true
}) => {
  const { 
    transactions, 
    accounts, 
    deleteTransaction, 
    isLoading, 
    error 
  } = useFinance();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by account
    if (accountId) {
      filtered = filtered.filter(t => 
        t.account_id === accountId || t.target_account_id === accountId
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by type
    if (selectedType) {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    // Filter by date range
    if (selectedDateRange) {
      const now = new Date();
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        switch (selectedDateRange) {
          case 'today':
            return isToday(transactionDate);
          case 'yesterday':
            return isYesterday(transactionDate);
          case 'this_week':
            return isThisWeek(transactionDate);
          case 'this_month':
            return isThisMonth(transactionDate);
          default:
            return true;
        }
      });
    }

    // Sort by date (newest first)
    filtered = filtered.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Apply limit
    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }, [transactions, accountId, searchTerm, selectedCategory, selectedType, selectedDateRange, limit]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(transactions.map(t => t.category))];
    return uniqueCategories.sort();
  }, [transactions]);

  // Get account name
  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  // Get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpRight size={16} className="text-green-600" />;
      case 'expense':
        return <ArrowDownRight size={16} className="text-red-600" />;
      case 'transfer':
        return <ArrowLeftRight size={16} className="text-blue-600" />;
      default:
        return <DollarSign size={16} />;
    }
  };

  // Get transaction color
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

  // Format date
  const formatDate = (date: string) => {
    const transactionDate = new Date(date);
    if (isToday(transactionDate)) {
      return 'Today';
    } else if (isYesterday(transactionDate)) {
      return 'Yesterday';
    } else if (isThisWeek(transactionDate)) {
      return format(transactionDate, 'EEEE');
    } else if (isThisMonth(transactionDate)) {
      return format(transactionDate, 'MMM dd');
    } else {
      return format(transactionDate, 'MMM dd, yyyy');
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(transaction.id);
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setShowTransactionForm(true);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
        <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <p className="text-sm font-body text-red-600">Error loading transactions: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      {showFilters && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              icon={<Filter size={16} />}
            >
              Filters
            </Button>
          </div>

          {showFiltersPanel && (
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm"
                style={{
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)'
                }}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm"
                style={{
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)'
                }}
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>

              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm"
                style={{
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)'
                }}
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
              </select>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedType('');
                  setSelectedDateRange('');
                }}
                className="text-xs"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add Transaction Button */}
      {showAddButton && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddTransaction}
            icon={<Plus size={16} />}
          >
            Add Transaction
          </Button>
        </div>
      )}

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div
          className="p-8 rounded-2xl text-center"
          style={{
            backgroundColor: 'var(--background-secondary)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <div className="text-4xl mb-4">💸</div>
          <h3 className="text-lg font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
            No transactions found
          </h3>
          <p className="text-sm font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
            {searchTerm || selectedCategory || selectedType || selectedDateRange
              ? 'Try adjusting your filters'
              : 'Add your first transaction to get started'
            }
          </p>
          {showAddButton && (
            <Button variant="primary" onClick={handleAddTransaction}>
              Add Transaction
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="p-4 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
              }}
              onClick={() => {
                setSelectedTransaction(transaction);
                setShowTransactionModal(true);
              }}
            >
              <div className="flex items-center space-x-3">
                <LuxuryCategoryIcon 
                  category={transaction.category} 
                  size={16} 
                  variant="luxury"
                />
                <div>
                  <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                    {transaction.description}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                    <span>{formatDate(transaction.date)}</span>
                    <span>•</span>
                    <span>{transaction.category}</span>
                    {transaction.type === 'transfer' && (
                      <>
                        <span>•</span>
                        <span>{getAccountName(transaction.target_account_id || '')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className={`font-numbers text-sm font-bold ${getTransactionColor(transaction.type)}`}>
                    {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                    ${(transaction.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                    {getAccountName(transaction.account_id)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEditTransaction(transaction)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Edit size={14} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <button
                    onClick={() => handleDeleteTransaction(transaction)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Trash2 size={14} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        transaction={selectedTransaction}
        defaultAccountId={accountId}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />
    </div>
  );
};
