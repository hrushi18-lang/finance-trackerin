import React, { useState, useMemo } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { TransactionList } from '../components/transactions/TransactionList';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeftRight,
  Filter,
  Download,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';

const Transactions: React.FC = () => {
  const { transactions, accounts, isLoading, error } = useFinance();
  const navigate = useNavigate();
  
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('this_month');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startOfCurrentMonth && transactionDate <= endOfCurrentMonth;
    });

    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netIncome = totalIncome - totalExpenses;
    
    const totalTransfers = currentMonthTransactions
      .filter(t => t.type === 'transfer')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      totalTransfers,
      transactionCount: currentMonthTransactions.length
    };
  }, [transactions]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(transactions.map(t => t.category))];
    return uniqueCategories.sort();
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by account
    if (selectedAccount) {
      filtered = filtered.filter(t => 
        t.account_id === selectedAccount || t.target_account_id === selectedAccount
      );
    }

    // Filter by type
    if (selectedType) {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by date range
    if (selectedDateRange) {
      const now = new Date();
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        switch (selectedDateRange) {
          case 'today':
            return format(transactionDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return format(transactionDate, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd');
          case 'this_week':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            return transactionDate >= startOfWeek;
          case 'this_month':
            return transactionDate >= startOfMonth(now) && transactionDate <= endOfMonth(now);
          case 'last_month':
            const lastMonth = subMonths(now, 1);
            return transactionDate >= startOfMonth(lastMonth) && transactionDate <= endOfMonth(lastMonth);
          default:
            return true;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, selectedAccount, selectedType, selectedCategory, selectedDateRange, searchTerm]);

  const handleExportTransactions = () => {
    const csvContent = [
      ['Date', 'Description', 'Category', 'Type', 'Amount', 'Account', 'Notes'],
      ...filteredTransactions.map(t => [
        format(new Date(t.date), 'yyyy-MM-dd'),
        t.description,
        t.category,
        t.type,
        t.amount.toString(),
        accounts.find(a => a.id === t.account_id)?.name || 'Unknown',
        t.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSelectedAccount('');
    setSelectedType('');
    setSelectedCategory('');
    setSelectedDateRange('this_month');
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
          <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-heading mb-2" style={{ color: 'var(--text-primary)' }}>Something went wrong</h2>
          <p className="text-sm font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
            {error.message}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="pt-12 pb-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
            >
              <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
            </button>
            <h1 className="text-2xl font-heading" style={{ color: 'var(--text-primary)' }}>Transactions</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportTransactions}
              icon={<Download size={16} />}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowTransactionForm(true)}
              icon={<Plus size={16} />}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Income</span>
              <TrendingUp size={16} className="text-green-600" />
            </div>
            <p className="text-lg font-numbers font-bold text-green-600">
              ${(financialMetrics.totalIncome || 0).toLocaleString()}
            </p>
          </div>
          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Expenses</span>
              <TrendingDown size={16} className="text-red-600" />
            </div>
            <p className="text-lg font-numbers font-bold text-red-600">
              ${(financialMetrics.totalExpenses || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-10 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)'
                }}
              />
              <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter size={16} />}
            >
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm"
                style={{
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)'
                }}
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
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
                <option value="last_month">Last Month</option>
              </select>

              <Button
                variant="secondary"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-4">
        <TransactionList
          transactions={filteredTransactions}
          accounts={accounts}
          onEditTransaction={(transaction) => {
            setSelectedTransaction(transaction);
            setShowTransactionForm(true);
          }}
          onDeleteTransaction={async (transaction) => {
            if (window.confirm('Are you sure you want to delete this transaction?')) {
              try {
                await deleteTransaction(transaction.id);
              } catch (error) {
                console.error('Error deleting transaction:', error);
              }
            }
          }}
        />
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default Transactions;
