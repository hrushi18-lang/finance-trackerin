import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContextOffline';
import { financeManager } from '../lib/finance-manager';
import { AccountCard } from '../components/accounts/AccountCard';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { AccountForm } from '../components/accounts/AccountForm';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  CreditCard, 
  FileText,
  Calendar,
  Settings,
  Bell,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank
} from 'lucide-react';
import { format } from 'date-fns';
import LuxuryCategoryIcon from '../components/common/LuxuryCategoryIcon';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    accounts, 
    transactions, 
    goals, 
    budgets, 
    liabilities, 
    bills,
    isLoading,
    error 
  } = useFinance();
  
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Calculate financial metrics
  const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const netWorth = totalBalance - liabilities.reduce((sum, l) => sum + (l.remaining_amount || 0), 0);
  
  const activeGoals = goals.filter(g => !g.is_archived);
  const totalGoalProgress = activeGoals.reduce((sum, g) => sum + ((g.current_amount || 0) / g.target_amount), 0);
  const averageGoalProgress = activeGoals.length > 0 ? totalGoalProgress / activeGoals.length : 0;

  const upcomingBills = bills.filter(b => 
    new Date(b.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const handleAddAccount = () => {
    setSelectedAccount(null);
    setShowAccountForm(true);
  };

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    setShowAccountForm(true);
  };

  const handleQuickAction = (action: string) => {
    setShowQuickActions(false);
    // Navigate to appropriate page or open modal
    switch (action) {
      case 'add-transaction':
        // Navigate to add transaction page
        break;
      case 'add-goal':
        // Navigate to add goal page
        break;
      case 'add-budget':
        // Navigate to add budget page
        break;
      case 'add-bill':
        // Navigate to add bill page
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
          <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>Loading your dashboard...</p>
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
            <div>
            <h1 className="text-2xl font-heading" style={{ color: 'var(--text-primary)' }}>
              Welcome back, {user?.user_metadata?.name || 'User'}!
              </h1>
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              {format(new Date(), 'EEEE, MMMM do, yyyy')}
              </p>
            </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Bell size={20} style={{ color: 'var(--text-secondary)' }} />
              </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Settings size={20} style={{ color: 'var(--text-secondary)' }} />
              </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <User size={20} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Net Worth</span>
              <TrendingUp size={16} style={{ color: 'var(--success)' }} />
            </div>
            <p className="text-lg font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
              ${netWorth.toLocaleString()}
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
              <span className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>This Month</span>
              <TrendingDown size={16} style={{ color: 'var(--error)' }} />
            </div>
            <p className="text-lg font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
              ${(totalIncome - totalExpenses).toLocaleString()}
            </p>
          </div>
        </div>
            </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowQuickActions(true)}
            icon={<Plus size={16} />}
          >
            Add
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-3">
              <button 
            onClick={() => handleQuickAction('add-transaction')}
            className="p-4 rounded-xl text-center hover:scale-105 transition-transform"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="text-2xl mb-2">💸</div>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Transaction</p>
              </button>
            <button
            onClick={() => handleQuickAction('add-goal')}
            className="p-4 rounded-xl text-center hover:scale-105 transition-transform"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Goal</p>
            </button>
            <button
            onClick={() => handleQuickAction('add-budget')}
            className="p-4 rounded-xl text-center hover:scale-105 transition-transform"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="text-2xl mb-2">📊</div>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Budget</p>
            </button>
            <button
            onClick={() => handleQuickAction('add-bill')}
            className="p-4 rounded-xl text-center hover:scale-105 transition-transform"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="text-2xl mb-2">📄</div>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Bill</p>
            </button>
          </div>
        </div>

      {/* Accounts Section */}
      <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Your Accounts</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddAccount}
            icon={<Plus size={16} />}
          >
            Add Account
          </Button>
        </div>
        {accounts.length === 0 ? (
          <div
            className="p-8 rounded-2xl text-center"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="text-4xl mb-4">🏦</div>
            <h3 className="text-lg font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
              No accounts yet
            </h3>
            <p className="text-sm font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
              Add your first account to start tracking your finances
            </p>
            <Button variant="primary" onClick={handleAddAccount}>
              Add Your First Account
            </Button>
              </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onClick={handleEditAccount}
              />
            ))}
                      </div>
                      )}
                    </div>
                    
      {/* Goals Section */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Your Goals</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickAction('add-goal')}
            icon={<Plus size={16} />}
          >
            Add Goal
          </Button>
        </div>
        {activeGoals.length === 0 ? (
          <div
            className="p-6 rounded-2xl text-center"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-base font-heading mb-1" style={{ color: 'var(--text-primary)' }}>
              No goals set
            </h3>
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              Set your first financial goal to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeGoals.slice(0, 3).map((goal) => (
              <div
                key={goal.id}
                className="p-4 rounded-2xl"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                    {goal.description || 'Untitled Goal'}
                  </h3>
                  <span className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                    {Math.round(((goal.current_amount || 0) / goal.target_amount) * 100)}%
                </span>
              </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: 'var(--primary)',
                      width: `${Math.min(((goal.current_amount || 0) / goal.target_amount) * 100, 100)}%`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  <span>${(goal.current_amount || 0).toLocaleString()}</span>
                  <span>${(goal.target_amount || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Recent Transactions</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickAction('add-transaction')}
            icon={<Plus size={16} />}
          >
            Add Transaction
          </Button>
        </div>
        {recentTransactions.length === 0 ? (
          <div
            className="p-6 rounded-2xl text-center"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="text-3xl mb-3">💸</div>
            <h3 className="text-base font-heading mb-1" style={{ color: 'var(--text-primary)' }}>
              No transactions yet
            </h3>
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              Add your first transaction to start tracking
            </p>
            </div>
        ) : (
            <div className="space-y-3">
            {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                className="p-4 rounded-2xl flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
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
                    <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-numbers text-sm font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}${(transaction.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                    {transaction.category}
                  </p>
            </div>
          </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AccountForm
        isOpen={showAccountForm}
        onClose={() => setShowAccountForm(false)}
        account={selectedAccount}
        loading={false}
      />

      <Modal
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        title="Quick Actions"
      >
        <div className="space-y-3">
          <button
            onClick={() => handleQuickAction('add-transaction')}
            className="w-full p-4 rounded-xl text-left hover:bg-gray-50 transition-colors"
            style={{ backgroundColor: 'var(--background-secondary)' }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <Plus size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                  Add Transaction
                </h3>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  Record income or expense
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleQuickAction('add-goal')}
            className="w-full p-4 rounded-xl text-left hover:bg-gray-50 transition-colors"
            style={{ backgroundColor: 'var(--background-secondary)' }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <Target size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                  Add Goal
                </h3>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  Set a financial target
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleQuickAction('add-budget')}
            className="w-full p-4 rounded-xl text-left hover:bg-gray-50 transition-colors"
            style={{ backgroundColor: 'var(--background-secondary)' }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <CreditCard size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                  Add Budget
                </h3>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  Set spending limits
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleQuickAction('add-bill')}
            className="w-full p-4 rounded-xl text-left hover:bg-gray-50 transition-colors"
            style={{ backgroundColor: 'var(--background-secondary)' }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <FileText size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                  Add Bill
                </h3>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  Track recurring payments
                </p>
              </div>
            </div>
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
