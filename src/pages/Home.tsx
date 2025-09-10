import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { useEnhancedCurrency } from '../contexts/EnhancedCurrencyContext';
import { useSwipeGestures } from '../hooks/useMobileGestures';
import { format } from 'date-fns';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatCurrency, currency } = useInternationalization();
  const { convertAmount, primaryCurrency } = useEnhancedCurrency();
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

  const [hideBalance, setHideBalance] = useState(false);
  const [currentAccountPage, setCurrentAccountPage] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  // Swipe gestures for accounts
  const { elementRef: accountsRef } = useSwipeGestures({
    onSwipeLeft: () => {
      const maxPages = Math.ceil(accounts.length / 4) - 1;
      if (currentAccountPage < maxPages) {
        setCurrentAccountPage(currentAccountPage + 1);
      }
    },
    onSwipeRight: () => {
      if (currentAccountPage > 0) {
        setCurrentAccountPage(currentAccountPage - 1);
      }
    },
    threshold: 50,
    velocityThreshold: 0.3
  });

  // Calculate net worth with proper currency conversion
  useEffect(() => {
    const calculateNetWorth = async () => {
      if (!convertAmount || accounts.length === 0) {
        console.log('⚠️ Missing convertAmount function or no accounts');
        return;
      }
      
      console.log('🔍 Calculating net worth with currency conversion');
      console.log('Primary currency:', primaryCurrency);
      console.log('Accounts:', accounts.map(a => ({ name: a.name, balance: a.balance, currency: a.currency })));
      
      setIsCalculating(true);
      try {
        let totalAssets = 0;
        
        // Convert each account balance to primary currency
        for (const account of accounts) {
          console.log(`Processing account ${account.name}: ${account.balance} ${account.currency}`);
          
          if (account.currency === primaryCurrency) {
            totalAssets += account.balance || 0;
            console.log(`Same currency, adding directly: ${account.balance}`);
          } else {
            // Convert to minor units for conversion
            const balanceInMinorUnits = Math.round((account.balance || 0) * 100);
            const converted = await convertAmount(balanceInMinorUnits, account.currency, primaryCurrency);
            console.log(`Converted ${account.balance} ${account.currency} to ${converted} ${primaryCurrency}`);
            if (converted !== null) {
              // Convert back to major units
              totalAssets += converted / 100;
            } else {
              console.warn(`⚠️ Conversion failed for ${account.name}, using original amount`);
              // Fallback: use original amount if conversion fails
              totalAssets += account.balance || 0;
            }
          }
        }
        
        // Convert liabilities to primary currency
        let totalLiabilities = 0;
        for (const liability of liabilities) {
          if (liability.currency === primaryCurrency) {
            totalLiabilities += liability.remaining_amount || 0;
          } else {
            // Convert to minor units for conversion
            const liabilityInMinorUnits = Math.round((liability.remaining_amount || 0) * 100);
            const converted = await convertAmount(liabilityInMinorUnits, liability.currency, primaryCurrency);
            if (converted !== null) {
              // Convert back to major units
              totalLiabilities += converted / 100;
            } else {
              // Fallback: use original amount if conversion fails
              totalLiabilities += liability.remaining_amount || 0;
            }
          }
        }
        
        console.log(`Total assets: ${totalAssets}, Total liabilities: ${totalLiabilities}, Net worth: ${totalAssets - totalLiabilities}`);
        setNetWorth(totalAssets - totalLiabilities);
      } catch (error) {
        console.error('Error calculating net worth:', error);
        // Fallback to simple calculation
        const totalAssets = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
        const totalLiabilities = liabilities.reduce((sum, liability) => sum + (liability.remaining_amount || 0), 0);
        setNetWorth(totalAssets - totalLiabilities);
      } finally {
        setIsCalculating(false);
      }
    };
    
    calculateNetWorth();
  }, [accounts, liabilities, convertAmount, primaryCurrency]);

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
            <button 
              onClick={() => navigate('/notifications')}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>
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

        {/* Net Worth Card */}
        <div 
          className="p-8 rounded-3xl"
          style={{
            backgroundColor: 'var(--background-secondary)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <div className="text-center">
            <p className="text-sm font-body mb-3" style={{ color: 'var(--text-secondary)' }}>Net Worth</p>
            <div className="mb-3">
              <span className="text-4xl font-numbers" style={{ color: 'var(--text-primary)' }}>
                {hideBalance ? '••••••' : isCalculating ? 'Calculating...' : formatCurrency(netWorth, primaryCurrency)}
              </span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp size={16} style={{ color: 'var(--success)' }} />
              <span className="text-sm font-body" style={{ color: 'var(--success)' }}>
                +{hideBalance ? '••' : formatCurrency(netWorthChange.amount)} ({netWorthChange.percentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Accounts Section */}
        {accounts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Accounts</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentAccountPage(Math.max(0, currentAccountPage - 1))}
                  disabled={currentAccountPage === 0}
                  className="p-2 rounded-full transition-all duration-200 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--background-secondary)' }}
                >
                  <ChevronLeft size={16} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <span className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
                  {currentAccountPage + 1} of {Math.ceil(accounts.length / 4)}
                </span>
                <button
                  onClick={() => setCurrentAccountPage(Math.min(Math.ceil(accounts.length / 4) - 1, currentAccountPage + 1))}
                  disabled={currentAccountPage >= Math.ceil(accounts.length / 4) - 1}
                  className="p-2 rounded-full transition-all duration-200 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--background-secondary)' }}
                >
                  <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
            </div>
            
            <div ref={accountsRef} className="overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${currentAccountPage * 100}%)` }}
              >
                {Array.from({ length: Math.ceil(accounts.length / 4) }).map((_, pageIndex) => (
                  <div key={pageIndex} className="w-full flex-shrink-0">
                    <div className="grid grid-cols-2 gap-3">
                      {accounts.slice(pageIndex * 4, (pageIndex + 1) * 4).map((account) => (
                        <div
                          key={account.id}
                          className="p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-105"
                          style={{
                            backgroundColor: 'var(--background-secondary)',
                            boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)'
                          }}
                          onClick={() => navigate(`/account/${account.id}`)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {account.type === 'bank_savings' && <PiggyBank size={16} style={{ color: 'var(--primary)' }} />}
                              {account.type === 'bank_current' && <CreditCard size={16} style={{ color: 'var(--primary)' }} />}
                              {account.type === 'digital_wallet' && <Smartphone size={16} style={{ color: 'var(--primary)' }} />}
                              {account.type === 'investment' && <TrendingUp size={16} style={{ color: 'var(--success)' }} />}
                              {account.type === 'cash' && <Wallet size={16} style={{ color: 'var(--warning)' }} />}
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
                                {account.type.replace('_', ' ').toUpperCase()}
                              </div>
                            </div>
                          </div>
                          <div className="mb-2">
                            <h3 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                              {account.name}
                            </h3>
                            {account.institution && (
                              <p className="text-xs font-body truncate" style={{ color: 'var(--text-secondary)' }}>
                                {account.institution}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-numbers" style={{ color: 'var(--text-primary)' }}>
                              {hideBalance ? '••••••' : formatCurrency(account.balance || 0, account.currency)}
                            </div>
                            <div className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
                              {account.currency}
                              {account.currency !== primaryCurrency && (
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                  ≈ {formatCurrency(account.balance || 0, primaryCurrency)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
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
                    className="p-4 rounded-2xl"
                    style={{
                      backgroundColor: 'var(--background-secondary)',
                      boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
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
                          {hideBalance ? '••••' : formatCurrency(transaction.amount)}
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
    </div>
  );
};

export default Home;
