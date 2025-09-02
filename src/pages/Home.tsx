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
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { format } from 'date-fns';

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

  // Calculate net worth
  const netWorth = useMemo(() => {
    if (accounts.length > 0) {
      const totalAssets = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
      const totalLiabilities = 0; // You can add liabilities calculation here
      return totalAssets - totalLiabilities;
    }
    
    // Sample net worth for demo
    return 256789.54;
  }, [accounts]);

  // Calculate net worth change (mock data for now)
  const netWorthChange = useMemo(() => {
    // This would typically come from historical data
    return { amount: 6234.50, percentage: 2.45 };
  }, []);

  // Add some sample transactions if none exist
  const displayTransactions = useMemo(() => {
    if (transactions.length > 0) {
      return filteredTransactions;
    }
    
    // Sample transactions for demo
    return [
      {
        id: 'sample-1',
        description: 'Zara',
        category: 'Shopping',
        type: 'expense',
        amount: 124.50,
        date: new Date(),
      },
      {
        id: 'sample-2',
        description: 'Salary',
        category: 'From Work',
        type: 'income',
        amount: 4500.00,
        date: new Date(Date.now() - 86400000),
      },
      {
        id: 'sample-3',
        description: 'Stock Dividend',
        category: 'Investment',
        type: 'income',
        amount: 85.40,
        date: new Date(Date.now() - 172800000),
      }
    ];
  }, [filteredTransactions, transactions.length]);

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

  // Get main accounts (excluding Goals Vault)
  const mainAccounts = useMemo(() => {
    if (accounts.length > 0) {
      return accounts.filter(account => account.type !== 'goals_vault').slice(0, 2);
    }
    
    // Sample accounts for demo
    return [
      {
        id: 'sample-checking',
        name: 'Checking Account',
        type: 'checking',
        balance: 12450.21,
      },
      {
        id: 'sample-savings',
        name: 'Savings Account',
        type: 'savings',
        balance: 88920.00,
      }
    ];
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-bold text-gray-900">Fin.</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Bell size={18} className="text-gray-600" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Settings size={18} className="text-gray-600" />
              </button>
              <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User size={16} className="text-gray-600" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-6 space-y-8">
        {/* Greeting Section */}
        <div className="text-left">
          <h2 className="text-2xl font-semibold text-gray-900">
            Hello, {user?.user_metadata?.full_name || 'Hrushi'} 👋
          </h2>
        </div>

        {/* Net Worth Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-3">Net Worth</p>
            <div className="mb-3">
              <span className="text-4xl font-bold text-gray-900">
                {hideBalance ? '••••••' : formatCurrency(netWorth)}
              </span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp size={16} className="text-green-500" />
              <span className="text-sm font-medium text-green-600">
                +{hideBalance ? '••' : formatCurrency(netWorthChange.amount)} ({netWorthChange.percentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveFilter('income')}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
              activeFilter === 'income'
                ? 'bg-green-100 text-green-800'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Income</span>
          </button>
          <button
            onClick={() => setActiveFilter('expense')}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
              activeFilter === 'expense'
                ? 'bg-red-100 text-red-800'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Expense</span>
          </button>
          <button
            onClick={() => setActiveFilter('savings')}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
              activeFilter === 'savings'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>Savings</span>
          </button>
        </div>

        {/* Accounts Contribution Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Accounts Contribution</h3>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {hideBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              <span>{hideBalance ? 'Show' : 'Hide'} Balance</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {mainAccounts.map((account) => (
              <div key={account.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 mb-3">
                  {getAccountIcon(account)}
                  <span className="text-sm font-medium text-gray-700">
                    {account.name}
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {hideBalance ? '••••••' : formatCurrency(account.balance || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {displayTransactions.map((transaction) => {
              const tag = getTransactionTag(transaction);
              return (
                <div key={transaction.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getTransactionIcon(transaction)}
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.description || 'Transaction'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
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
            })}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center space-y-1 p-2">
            <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            </div>
            <span className="text-xs font-medium text-gray-900">Home</span>
          </button>
          
          <button 
            onClick={() => navigate('/budgets')}
            className="flex flex-col items-center space-y-1 p-2"
          >
            <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
            <span className="text-xs text-gray-500">Budget</span>
          </button>
          
          <button 
            onClick={() => navigate('/add-transaction')}
            className="flex flex-col items-center space-y-1 p-2"
          >
            <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center shadow-lg">
              <Plus size={28} className="text-white" />
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/accounts')}
            className="flex flex-col items-center space-y-1 p-2"
          >
            <CreditCard size={24} className="text-gray-400" />
            <span className="text-xs text-gray-500">Accounts</span>
          </button>
          
          <button 
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center space-y-1 p-2"
          >
            <User size={24} className="text-gray-400" />
            <span className="text-xs text-gray-500">Profile</span>
          </button>
        </div>
      </div>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-20"></div>
    </div>
  );
};
