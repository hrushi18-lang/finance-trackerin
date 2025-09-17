import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Settings, 
  User, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  EyeOff,
  ShoppingBag,
  DollarSign,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building,
  Smartphone,
  Target,
  Calendar,
  Receipt,
  PieChart,
  FileText,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationCenter from '../components/notifications/NotificationCenter';
import FinancialSnapshot from '../components/notifications/FinancialSnapshot';
import { format } from 'date-fns';
import { currencyService } from '../services/currencyService';
import { useProfile } from '../contexts/ProfileContext';
import { TransactionDetailsModal } from '../components/modals/TransactionDetailsModal';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { formatCurrency, formatCurrencyWithSecondary, formatTransactionAmount, currency } = useInternationalization();
  const { 
    accounts, 
    transactions, 
    goals, 
    bills,
    liabilities,
    budgets,
    stats,
    getGoalsVaultAccount 
  } = useFinance();
  
  const { generateFinancialInsights } = useNotifications();

  const [hideBalance, setHideBalance] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isFinancialSnapshotMinimized, setIsFinancialSnapshotMinimized] = useState(false);

  // Calculate current balance (sum of all account balances)
  const currentBalance = useMemo(() => {
    return accounts.reduce((sum, account) => {
      // Use converted amount (primary currency) for balance calculation
      const convertedBalance = account.converted_amount || account.balance || 0;
      
      return account.type === 'credit_card' ? sum - convertedBalance : sum + convertedBalance;
    }, 0);
  }, [accounts]);

  // Calculate net worth (assets - liabilities)
  const netWorth = useMemo(() => {
    const primaryCurrency = profile?.primaryCurrency || currency.code;
    
    const totalAssets = accounts.reduce((sum, account) => {
      // Use converted amount (primary currency) for net worth calculation
      const convertedBalance = account.converted_amount || account.balance || 0;
      
      return account.type === 'credit_card' ? sum - convertedBalance : sum + convertedBalance;
    }, 0);
    
    const totalLiabilities = liabilities.reduce((sum, liability) => {
      const liabilityAmount = liability.remainingAmount || 0;
      const liabilityCurrency = liability.currencycode || primaryCurrency;
      
      // Convert to primary currency if different
      const convertedAmount = liabilityCurrency !== primaryCurrency 
        ? (currencyService.convertAmount(liabilityAmount, liabilityCurrency, primaryCurrency) || liabilityAmount)
        : liabilityAmount;
      
      return sum + convertedAmount;
    }, 0);
    
    return totalAssets - totalLiabilities;
  }, [accounts, liabilities, profile?.primaryCurrency, currency.code]);

  // Calculate net worth change (mock data for now)
  const netWorthChange = useMemo(() => {
    // This would typically come from historical data
    return { amount: 6234.50, percentage: 2.45 };
  }, []);

  // Get recent transactions
  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Get main accounts (excluding Goals Vault)
  const mainAccounts = useMemo(() => {
    return accounts.filter(account => account.type !== 'goals_vault').slice(0, 2);
  }, [accounts]);

  // Get upcoming bills
  const upcomingBills = useMemo(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return bills.filter(bill => 
      new Date(bill.due_date) <= nextWeek && !bill.is_paid
    ).slice(0, 3);
  }, [bills]);

  // Get active goals
  const activeGoals = useMemo(() => {
    return goals.filter(goal => !goal.is_archived).slice(0, 3);
  }, [goals]);

  // Get active budgets
  const activeBudgets = useMemo(() => {
    return budgets.filter(budget => budget.is_active).slice(0, 3);
  }, [budgets]);

  // Get active liabilities
  const activeLiabilities = useMemo(() => {
    return liabilities.filter(liability => liability.is_active).slice(0, 3);
  }, [liabilities]);

  // Get transaction icon and color
  const getTransactionIcon = (transaction: any) => {
    switch (transaction.category?.toLowerCase()) {
      case 'shopping':
        return <ShoppingBag size={20} className="text-red-500" />;
      case 'salary':
      case 'income':
        return <DollarSign size={20} className="text-green-500" />;
      case 'investment':
        return <TrendingUp size={20} className="text-blue-500" />;
      default:
        return transaction.type === 'income' 
          ? <DollarSign size={20} className="text-green-500" />
          : <ShoppingBag size={20} className="text-red-500" />;
    }
  };

  const getTransactionTag = (transaction: any) => {
    if (transaction.type === 'income') {
      return { text: 'Income', color: 'bg-green-100 text-green-800' };
    } else if (transaction.category?.toLowerCase().includes('savings')) {
      return { text: 'Savings', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { text: 'Expense', color: 'bg-red-100 text-red-800' };
    }
  };

  const getAccountIcon = (account: any) => {
    switch (account.type) {
      case 'checking':
      case 'primary_banking':
        return <Building size={16} className="text-blue-600" />;
      case 'savings':
        return <PiggyBank size={16} className="text-green-600" />;
      case 'credit':
        return <CreditCard size={16} className="text-purple-600" />;
      case 'digital_wallet':
        return <Smartphone size={16} className="text-orange-600" />;
      default:
        return <Target size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="pt-12 pb-6 px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading" style={{ color: 'var(--text-primary)' }}>Fin.</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <div style={{ position: 'relative' }}>
              <NotificationCenter />
            </div>
            <button 
              onClick={() => navigate('/settings')}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <Settings size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="p-1 rounded-full transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User size={16} style={{ color: 'var(--text-secondary)' }} />
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-heading" style={{ color: 'var(--text-primary)' }}>
            Hello, {user?.name || 'Hrushi'} 👋
          </h2>
        </div>

        {/* Financial Snapshot */}
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>
              Financial Snapshot
            </h2>
            <button
              onClick={() => setIsFinancialSnapshotMinimized(!isFinancialSnapshotMinimized)}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                color: 'var(--text-secondary)'
              }}
            >
              {isFinancialSnapshotMinimized ? (
                <ArrowDownRight size={16} />
              ) : (
                <ArrowUpRight size={16} />
              )}
            </button>
          </div>
          {!isFinancialSnapshotMinimized && <FinancialSnapshot />}
        </div>

        {/* Main Financial Overview Card */}
        <div 
          className="p-8 rounded-3xl border-2 border-black"
          style={{
            backgroundColor: '#fef7ed', // cream background
            boxShadow: '8px 8px 16px rgba(0,0,0,0.3), -4px -4px 8px rgba(0,0,0,0.1)'
          }}
        >
          <div className="text-center text-black">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Wallet size={20} />
              <h2 className="text-lg font-heading text-black">Current Balance</h2>
            </div>
            
            {/* Current Balance - Single Focus */}
            <div className="mb-6">
              <div className="text-5xl font-numbers text-black mb-2">
                {hideBalance ? '••••••' : formatCurrency(currentBalance)}
              </div>
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-700">
                <span>Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-300">
                <div className="text-lg font-numbers text-black">
                  {hideBalance ? '••••' : formatCurrency(accounts.reduce((sum, acc) => sum + (acc.converted_amount || acc.balance || 0), 0))}
                </div>
                <div className="text-xs text-gray-600">Total Assets</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-300">
                <div className="text-lg font-numbers text-black">
                  {hideBalance ? '••••' : formatCurrency(liabilities.reduce((sum, liab) => sum + (liab.remainingAmount || 0), 0))}
                </div>
                <div className="text-xs text-gray-600">Total Liabilities</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-300">
                <div className="text-lg font-numbers text-black">
                  {goals.length}
                </div>
                <div className="text-xs text-gray-600">Active Goals</div>
              </div>
            </div>
          </div>
        </div>

        {/* Accounts Section */}
        {accounts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Accounts</h2>
              <button
                onClick={() => navigate('/accounts')}
                className="text-sm font-medium px-3 py-1 rounded-lg transition-all duration-200"
                style={{ 
                  backgroundColor: 'var(--background-secondary)',
                  color: 'var(--text-secondary)'
                }}
              >
                View All
              </button>
            </div>
            
            <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex space-x-3 pb-2" style={{ width: 'max-content' }}>
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="w-40 h-24 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 flex-shrink-0"
                    style={{
                      backgroundColor: 'var(--background-secondary)',
                      border: '1px solid #fed7aa'
                    }}
                    onClick={() => navigate(`/account/${account.id}`)}
                  >
                    <div className="p-3 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {account.type === 'bank_savings' && <PiggyBank size={14} style={{ color: 'var(--primary)' }} />}
                          {account.type === 'bank_current' && <CreditCard size={14} style={{ color: 'var(--primary)' }} />}
                          {account.type === 'digital_wallet' && <Smartphone size={14} style={{ color: 'var(--primary)' }} />}
                          {account.type === 'investment' && <TrendingUp size={14} style={{ color: 'var(--success)' }} />}
                          {account.type === 'cash' && <Wallet size={14} style={{ color: 'var(--warning)' }} />}
                        </div>
                        <div className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
                          {account.type.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-medium truncate mb-1" style={{ color: 'var(--text-primary)' }}>
                          {account.name}
                        </h3>
                        <div className="text-sm font-numbers" style={{ color: 'var(--text-primary)' }}>
                          {hideBalance ? '••••••' : formatCurrency(account.balance || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Financial Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Bills Card */}
          <div 
            className="p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
            onClick={() => navigate('/bills')}
          >
            <div className="flex items-center justify-between mb-3">
              <Receipt size={24} style={{ color: 'var(--primary)' }} />
              <span className="text-xs font-body px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--error)', color: 'white' }}>
                {upcomingBills.length}
              </span>
            </div>
            <h3 className="text-lg font-heading mb-1" style={{ color: 'var(--text-primary)' }}>Bills</h3>
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              {upcomingBills.length > 0 ? `${upcomingBills.length} due soon` : 'No upcoming bills'}
            </p>
          </div>

          {/* Budgets Card */}
          <div 
            className="p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
            onClick={() => navigate('/budgets')}
          >
            <div className="flex items-center justify-between mb-3">
              <PieChart size={24} style={{ color: 'var(--primary)' }} />
              <span className="text-xs font-body px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
                {activeBudgets.length}
              </span>
            </div>
            <h3 className="text-lg font-heading mb-1" style={{ color: 'var(--text-primary)' }}>Budgets</h3>
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              {activeBudgets.length > 0 ? `${activeBudgets.length} active` : 'No budgets set'}
            </p>
          </div>

          {/* Liabilities Card */}
          <div 
            className="p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
            onClick={() => navigate('/liabilities')}
          >
            <div className="flex items-center justify-between mb-3">
              <CreditCard size={24} style={{ color: 'var(--primary)' }} />
              <span className="text-xs font-body px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--warning)', color: 'white' }}>
                {activeLiabilities.length}
              </span>
            </div>
            <h3 className="text-lg font-heading mb-1" style={{ color: 'var(--text-primary)' }}>Liabilities</h3>
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              {activeLiabilities.length > 0 ? `${activeLiabilities.length} active` : 'No liabilities'}
            </p>
          </div>

          {/* Goals Card */}
          <div 
            className="p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
            onClick={() => navigate('/goals')}
          >
            <div className="flex items-center justify-between mb-3">
              <Target size={24} style={{ color: 'var(--primary)' }} />
              <span className="text-xs font-body px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                {activeGoals.length}
              </span>
            </div>
            <h3 className="text-lg font-heading mb-1" style={{ color: 'var(--text-primary)' }}>Goals</h3>
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              {activeGoals.length > 0 ? `${activeGoals.length} active` : 'No goals set'}
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="flex items-center space-x-2 text-sm font-body hover:scale-105 transition-all duration-200"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {hideBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              <span>{hideBalance ? 'Show' : 'Hide'}</span>
            </button>
          </div>
          
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => {
                const tag = getTransactionTag(transaction);
                return (
                  <div 
                    key={transaction.id} 
                    className="p-4 rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform"
                    style={{
                      backgroundColor: 'var(--background-secondary)',
                      boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                    }}
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setShowTransactionModal(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction)}
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                            {transaction.description || 'Transaction'}
                          </p>
                          <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-numbers ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {hideBalance ? '••••' : formatTransactionAmount(
                            transaction.amount, 
                            transaction.original_currency, 
                            transaction.original_currency && transaction.original_currency !== currency.code 
                              ? transaction.amount * (transaction.exchange_rate_used || 1) 
                              : transaction.amount
                          )}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${tag.color}`}>
                          {tag.text}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div 
                className="p-8 rounded-2xl text-center"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                }}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
                    <DollarSign size={24} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading mb-2" style={{ color: 'var(--text-primary)' }}>No Transactions Yet</h3>
                    <p className="text-sm font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                      Start tracking your income and expenses
                    </p>
                    <button
                      onClick={() => navigate('/add-transaction')}
                      className="px-6 py-3 rounded-full text-white font-medium transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      Add Transaction
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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

export default Home;
