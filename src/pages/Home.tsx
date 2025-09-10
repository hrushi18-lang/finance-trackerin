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
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { format } from 'date-fns';
import { RingChart } from '../components/analytics/RingChart';
import { ChartPopup } from '../components/analytics/ChartPopup';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatCurrency, currency } = useInternationalization();
  const { 
    accounts, 
    transactions, 
    goals, 
    stats,
    getGoalsVaultAccount 
  } = useFinance();

  const [hideBalance, setHideBalance] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense' | 'savings'>('all');
  const [showChartPopup, setShowChartPopup] = useState(false);
  const [popupData, setPopupData] = useState<any>(null);

  // Calculate net worth
  const netWorth = useMemo(() => {
    const totalAssets = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    const totalLiabilities = 0; // You can add liabilities calculation here
    return totalAssets - totalLiabilities;
  }, [accounts]);

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

  // Filter transactions based on active filter
  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'all') return recentTransactions;
    
    return recentTransactions.filter(transaction => {
      switch (activeFilter) {
        case 'income':
          return transaction.type === 'income';
        case 'expense':
          return transaction.type === 'expense';
        case 'savings':
          return transaction.category?.toLowerCase().includes('savings') || 
                 transaction.description?.toLowerCase().includes('savings');
        default:
          return true;
      }
    });
  }, [recentTransactions, activeFilter]);

  // Get display transactions
  const displayTransactions = useMemo(() => {
    return filteredTransactions;
  }, [filteredTransactions]);

  // Get main accounts (excluding Goals Vault)
  const mainAccounts = useMemo(() => {
    return accounts.filter(account => account.type !== 'goals_vault').slice(0, 2);
  }, [accounts]);

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
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Immersive Header */}
      <div className="pt-12 pb-8 px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading">Fin.</h1>
          </div>
          
          {/* Immersive Top-Right Controls */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate('/calendar')}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <Calendar size={16} className="text-gray-600" />
            </button>
            <button 
              onClick={() => navigate('/notifications')}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <Bell size={16} className="text-gray-600" />
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <Settings size={16} className="text-gray-600" />
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="p-1 rounded-full transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center">
                <User size={14} className="text-gray-600" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Greeting Section */}
        <div className="text-left slide-in-up">
          <h2 className="text-2xl font-heading">
            Hello, {user?.user_metadata?.full_name || 'Hrushi'} 👋
          </h2>
        </div>

        {/* Net Worth Card */}
        <div className="card-neumorphic p-8 slide-in-up">
          <div className="text-center">
            <p className="text-sm font-body mb-3">Net Worth</p>
            <div className="mb-3">
              <span className="text-4xl font-serif font-bold" style={{ color: 'var(--primary)' }}>
                {hideBalance ? '••••••' : formatCurrency(netWorth)}
              </span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp size={16} style={{ color: 'var(--success)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>
                +{hideBalance ? '••' : formatCurrency(netWorthChange.amount)} ({netWorthChange.percentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex space-x-4 slide-in-up">
          <button
            onClick={() => setActiveFilter('income')}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeFilter === 'income'
                ? 'text-white transform scale-105'
                : 'text-gray-700 hover:scale-105'
            }`}
            style={{
              backgroundColor: activeFilter === 'income' ? 'var(--success)' : 'var(--surface)',
              border: activeFilter === 'income' ? 'none' : '1px solid var(--border)'
            }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeFilter === 'income' ? 'white' : 'var(--success)' }}></div>
            <span>Income</span>
          </button>
          <button
            onClick={() => setActiveFilter('expense')}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeFilter === 'expense'
                ? 'text-white transform scale-105'
                : 'text-gray-700 hover:scale-105'
            }`}
            style={{
              backgroundColor: activeFilter === 'expense' ? 'var(--error)' : 'var(--surface)',
              border: activeFilter === 'expense' ? 'none' : '1px solid var(--border)'
            }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeFilter === 'expense' ? 'white' : 'var(--error)' }}></div>
            <span>Expense</span>
          </button>
          <button
            onClick={() => setActiveFilter('savings')}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeFilter === 'savings'
                ? 'text-white transform scale-105'
                : 'text-gray-700 hover:scale-105'
            }`}
            style={{
              backgroundColor: activeFilter === 'savings' ? 'var(--primary)' : 'var(--surface)',
              border: activeFilter === 'savings' ? 'none' : '1px solid var(--border)'
            }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeFilter === 'savings' ? 'white' : 'var(--primary)' }}></div>
            <span>Savings</span>
          </button>
        </div>

        {/* Accounts Contribution Section */}
        <div className="slide-in-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-heading">Accounts Contribution</h3>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="flex items-center space-x-2 text-sm font-body hover:scale-105 transition-all duration-200"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {hideBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              <span>{hideBalance ? 'Show' : 'Hide'} Balance</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {mainAccounts.length > 0 ? (
              mainAccounts.map((account) => (
                <div key={account.id} className="card p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    {getAccountIcon(account)}
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {account.name}
                    </span>
                  </div>
                  <p className="text-xl font-numbers">
                    {hideBalance ? '••••••' : formatCurrency(account.balance || 0)}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-2 card p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                    <CreditCard size={24} className="text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading mb-2">No Accounts Yet</h3>
                    <p className="text-sm font-body mb-4">
                      Add your first account to start tracking your finances
                    </p>
                    <button
                      onClick={() => navigate('/accounts')}
                      className="btn-primary"
                    >
                      Add Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Spending Breakdown */}
        <div className="slide-in-up">
          <h3 className="text-lg font-heading mb-4">Spending Breakdown</h3>
          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            {(() => {
              // Calculate real spending data from transactions
              const currentMonth = new Date();
              const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
              const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
              
              const monthlyExpenses = transactions.filter(t => 
                t.type === 'expense' && 
                new Date(t.date) >= monthStart && 
                new Date(t.date) <= monthEnd
              );
              
              const categoryTotals = monthlyExpenses.reduce((acc, transaction) => {
                const category = transaction.category || 'Other';
                acc[category] = (acc[category] || 0) + transaction.amount;
                return acc;
              }, {} as Record<string, number>);
              
              const spendingData = Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 4)
                .map(([category, amount], index) => ({
                  label: category,
                  value: amount,
                  color: `hsl(${120 + index * 30}, 60%, 50%)`
                }));
              
              if (spendingData.length === 0) {
                return (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
                      No spending data for this month
                    </p>
                  </div>
                );
              }
              
              return (
                <RingChart
                  data={spendingData}
                  size={160}
                  strokeWidth={12}
                  interactive={true}
                  onSegmentClick={(segment) => {
                    setPopupData(segment);
                    setShowChartPopup(true);
                  }}
                />
              );
            })()}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="slide-in-up">
          <h3 className="text-lg font-heading mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {displayTransactions.length > 0 ? (
              displayTransactions.map((transaction) => {
                const tag = getTransactionTag(transaction);
                return (
                  <div key={transaction.id} className="card p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getTransactionIcon(transaction)}
                        <div>
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {transaction.description || 'Transaction'}
                          </p>
                          <p className="text-sm font-body">
                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-numbers ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {hideBalance ? '••••' : formatCurrency(transaction.amount)}
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${tag.color}`}>
                          {tag.text}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="card p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                    <DollarSign size={24} className="text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading mb-2">No Transactions Yet</h3>
                    <p className="text-sm font-body mb-4">
                      Start tracking your income and expenses
                    </p>
                    <button
                      onClick={() => navigate('/add-transaction')}
                      className="btn-primary"
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

      {/* Interactive Chart Popup */}
      <ChartPopup
        isOpen={showChartPopup}
        onClose={() => setShowChartPopup(false)}
        title="Spending Category Details"
        data={popupData}
        type="ring"
        onRangeSelect={(startDate, endDate) => {
          // Handle date range selection
          console.log('Date range selected:', startDate, endDate);
          setShowChartPopup(false);
        }}
      />
    </div>
  );
};
