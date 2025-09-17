import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, BarChart3, Target, Plus, ArrowLeftRight, DollarSign, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { FinancialAccount, Transaction, Goal } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { Button } from '../common/Button';
import { TransactionDetailsModal } from '../modals/TransactionDetailsModal';
import { AccountAnalyticsChart } from '../analytics/AccountAnalyticsChart';

interface AccountDetailViewProps {
  account: FinancialAccount;
  transactions: Transaction[];
  goals: Goal[];
  onBack: () => void;
  onEdit: () => void;
  onTransfer: () => void;
  onAddTransaction: () => void;
  showBalances: boolean;
  onToggleBalances: () => void;
}

export const AccountDetailView: React.FC<AccountDetailViewProps> = ({
  account,
  transactions,
  goals,
  onBack,
  onEdit,
  onTransfer,
  onAddTransaction,
  showBalances,
  onToggleBalances
}) => {
  const { formatCurrency, currency } = useInternationalization();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'analytics'>('overview');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showAnalyticsChart, setShowAnalyticsChart] = useState(false);

  const getAccountIcon = (type: string) => {
    const icons = {
      bank_savings: '🏦',
      bank_current: '🏛️',
      bank_student: '🎓',
      digital_wallet: '📱',
      cash: '💵',
      credit_card: '💳',
      investment: '📈',
      goals_vault: '🎯',
      custom: '💼'
    };
    return icons[type as keyof typeof icons] || '💼';
  };

  const getAccountTypeName = (type: string) => {
    const names = {
      bank_savings: 'Savings Account',
      bank_current: 'Current Account',
      bank_student: 'Student Account',
      digital_wallet: 'Digital Wallet',
      cash: 'Cash',
      credit_card: 'Credit Card',
      investment: 'Investment',
      goals_vault: 'Goals Vault',
      custom: 'Custom Account'
    };
    return names[type as keyof typeof names] || 'Account';
  };

  const getBalanceStatus = (balance: number) => {
    if (balance > 10000) return { status: 'high', color: 'text-green-400', bgColor: 'bg-green-500/20' };
    if (balance > 1000) return { status: 'medium', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
    if (balance > 0) return { status: 'low', color: 'text-orange-400', bgColor: 'bg-orange-500/20' };
    return { status: 'zero', color: 'text-red-400', bgColor: 'bg-red-500/20' };
  };

  const getMonthlyStats = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyTransactions = transactions.filter(t => 
      new Date(t.date) >= startOfMonth && new Date(t.date) <= endOfMonth
    );

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses, net: income - expenses, count: monthlyTransactions.length };
  };

  const getRecentTransactions = () => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  const getLinkedGoals = () => {
    return goals.filter(goal => goal.accountId === account.id);
  };

  const balanceStatus = getBalanceStatus(account.balance);
  const monthlyStats = getMonthlyStats();
  const recentTransactions = getRecentTransactions();
  const linkedGoals = getLinkedGoals();

  return (
    <div className="min-h-screen text-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-forest-700/80 to-forest-600/80 backdrop-blur-md p-6 border-b border-forest-500/20">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleBalances}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={showBalances ? "Hide balances" : "Show balances"}
            >
              {showBalances ? (
                <EyeOff size={18} className="text-white" />
              ) : (
                <Eye size={18} className="text-white" />
              )}
            </button>
            <button
              onClick={onEdit}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Plus size={18} className="text-white" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-4xl">{getAccountIcon(account.type)}</div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">{account.name}</h1>
            <p className="text-forest-200 font-body">{getAccountTypeName(account.type)}</p>
            {account.institution && (
              <p className="text-sm text-forest-300 font-body">{account.institution}</p>
            )}
          </div>
        </div>

        {showBalances && (
          <div className="mt-6">
            <div className={`${balanceStatus.bgColor} rounded-xl p-4 border border-current`}>
              <p className="text-sm text-forest-300 mb-2 font-body">Current Balance</p>
              
              {/* Primary Currency Balance */}
              <p className="text-3xl font-numbers font-bold text-white">
                <CurrencyIcon currencyCode={currency.code} size={24} className="inline mr-2" />
                {formatCurrency(account.balance)}
              </p>
              
              {/* Dual Currency Display if different */}
              {account.native_currency && account.native_currency !== currency.code && (
                <div className="mt-2 p-2 bg-forest-800/30 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-forest-300">Native Currency:</span>
                    <span className="text-white font-medium">
                      {formatCurrency(account.native_amount || account.balance, account.native_currency)}
                    </span>
                  </div>
                  {account.exchange_rate && account.exchange_rate !== 1.0 && (
                    <div className="text-xs text-forest-400 mt-1">
                      1 {account.native_currency} = {account.exchange_rate.toFixed(4)} {currency.code}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between mt-2">
                <span className={`text-sm font-medium ${balanceStatus.color}`}>
                  {balanceStatus.status.charAt(0).toUpperCase() + balanceStatus.status.slice(1)} Balance
                </span>
                <span className="text-xs text-forest-400">
                  {transactions.length} total transactions
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="px-4 py-4">
        <div className="flex space-x-1 bg-forest-800/30 rounded-lg p-1 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'transactions', label: 'Transactions', icon: Calendar },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'transactions' | 'analytics')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-forest-600 text-white'
                  : 'text-forest-300 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Monthly Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-forest-900/30 backdrop-blur-md rounded-xl p-4 border border-forest-600/20 text-center">
                <TrendingUp size={20} className="mx-auto text-green-400 mb-2" />
                <p className="text-xs text-forest-300 mb-1">Income</p>
                <p className="text-lg font-numbers font-bold text-white">
                  {formatCurrency(monthlyStats.income)}
                </p>
              </div>
              <div className="bg-forest-900/30 backdrop-blur-md rounded-xl p-4 border border-forest-600/20 text-center">
                <TrendingDown size={20} className="mx-auto text-red-400 mb-2" />
                <p className="text-xs text-forest-300 mb-1">Expenses</p>
                <p className="text-lg font-numbers font-bold text-white">
                  {formatCurrency(monthlyStats.expenses)}
                </p>
              </div>
              <div className="bg-forest-900/30 backdrop-blur-md rounded-xl p-4 border border-forest-600/20 text-center">
                <BarChart3 size={20} className="mx-auto text-blue-400 mb-2" />
                <p className="text-xs text-forest-300 mb-1">Net</p>
                <p className={`text-lg font-numbers font-bold ${monthlyStats.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(monthlyStats.net)}
                </p>
              </div>
            </div>

            {/* Linked Goals */}
            {linkedGoals.length > 0 && (
              <div className="bg-forest-900/30 backdrop-blur-md rounded-xl p-6 border border-forest-600/20">
                <h3 className="text-lg font-heading font-semibold text-white mb-4 flex items-center">
                  <Target size={20} className="mr-2 text-primary-400" />
                  Linked Goals
                </h3>
                <div className="space-y-3">
                  {linkedGoals.map((goal) => {
                    const progress = (goal.currentAmount / goal.targetAmount) * 100;
                    return (
                      <div key={goal.id} className="bg-forest-800/20 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-white">{goal.title}</span>
                          <span className="text-xs text-forest-400">
                            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-forest-400 mt-1">
                          {progress.toFixed(1)}% complete
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={onTransfer}
                variant="outline"
                className="border-forest-500/30 text-forest-300 hover:bg-forest-600/10"
              >
                <ArrowLeftRight size={16} className="mr-2" />
                Transfer Money
              </Button>
              <Button
                onClick={onAddTransaction}
                className="bg-primary-500 hover:bg-primary-600"
              >
                <DollarSign size={16} className="mr-2" />
                Add Transaction
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No transactions yet</h3>
                <p className="text-gray-400 mb-4">Start by adding your first transaction</p>
                <Button onClick={onAddTransaction}>
                  <Plus size={16} className="mr-2" />
                  Add Transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="bg-forest-900/30 backdrop-blur-md rounded-xl p-4 border border-forest-600/20 cursor-pointer hover:bg-forest-800/40 transition-colors"
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setShowTransactionModal(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          transaction.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          {transaction.type === 'income' ? (
                            <TrendingUp size={20} className="text-green-400" />
                          ) : (
                            <TrendingDown size={20} className="text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{transaction.description}</p>
                          <p className="text-xs text-forest-400">{transaction.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-numbers font-bold ${
                          transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-forest-400">
                          {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-forest-900/30 backdrop-blur-md rounded-xl p-6 border border-forest-600/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading font-semibold text-white">Transaction Analytics</h3>
                <button
                  onClick={() => setShowAnalyticsChart(true)}
                  className="px-4 py-2 bg-forest-600 hover:bg-forest-500 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <BarChart3 size={16} />
                  <span>View Full Chart</span>
                </button>
              </div>
              
              {/* Mini Analytics Preview */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-forest-800/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp size={16} className="text-green-400" />
                      <span className="text-sm text-gray-300">Total Income</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(transactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + (t.amount || 0), 0)
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-forest-800/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingDown size={16} className="text-red-400" />
                      <span className="text-sm text-gray-300">Total Expenses</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(transactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + (t.amount || 0), 0)
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-forest-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 size={16} className="text-blue-400" />
                    <span className="text-sm text-gray-300">Transaction Timeline</span>
                  </div>
                  <div className="text-sm text-gray-400 mb-3">
                    Click "View Full Chart" to see detailed income vs expenses over time
                  </div>
                  <div className="h-16 bg-forest-700/50 rounded-lg flex items-center justify-center">
                    <div className="text-gray-500 text-sm">Interactive Chart Preview</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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

      {/* Analytics Chart Modal */}
      <AccountAnalyticsChart
        isOpen={showAnalyticsChart}
        onClose={() => setShowAnalyticsChart(false)}
        transactions={transactions}
        accountName={account.name}
      />
    </div>
  );
};
