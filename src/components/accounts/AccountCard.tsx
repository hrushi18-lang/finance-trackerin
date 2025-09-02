import React from 'react';
import { Eye, EyeOff, Edit3, Trash2, ArrowLeftRight, DollarSign, TrendingUp, TrendingDown, Calendar, BarChart3, Target, CreditCard, Wallet, Building, Smartphone, PiggyBank } from 'lucide-react';
import { format } from 'date-fns';
import { FinancialAccount, Transaction } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { Button } from '../common/Button';

interface AccountCardProps {
  account: FinancialAccount;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onTransfer: () => void;
  onAddTransaction: () => void;
  recentTransactions: Transaction[];
  showBalances: boolean;
  goalsVaultBreakdown?: { totalAllocated: number; goalBreakdown: Array<{ goalId: string; title: string; amount: number; progress: number }> };
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleVisibility,
  onTransfer,
  onAddTransaction,
  recentTransactions,
  showBalances,
  goalsVaultBreakdown
}) => {
  const { formatCurrency, currency } = useInternationalization();

  const getAccountIcon = (type: string) => {
    const icons = {
      bank_savings: PiggyBank,
      bank_current: Building,
      bank_student: Building,
      digital_wallet: Smartphone,
      cash: Wallet,
      credit_card: CreditCard,
      investment: TrendingUp,
      goals_vault: Target,
      custom: Wallet
    };
    return icons[type as keyof typeof icons] || Wallet;
  };

  const getAccountColor = (type: string) => {
    const colors = {
      bank_savings: 'bg-green-500',
      bank_current: 'bg-blue-500',
      bank_student: 'bg-purple-500',
      digital_wallet: 'bg-orange-500',
      cash: 'bg-yellow-500',
      credit_card: 'bg-red-500',
      investment: 'bg-indigo-500',
      goals_vault: 'bg-pink-500',
      custom: 'bg-gray-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
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
    if (balance > 10000) return { status: 'high', color: 'text-green-400', icon: TrendingUp };
    if (balance > 1000) return { status: 'medium', color: 'text-yellow-400', icon: TrendingUp };
    if (balance > 0) return { status: 'low', color: 'text-orange-400', icon: TrendingDown };
    return { status: 'zero', color: 'text-red-400', icon: TrendingDown };
  };

  const getLastTransactionDate = () => {
    if (recentTransactions.length === 0) return null;
    const lastTransaction = recentTransactions[0];
    return format(new Date(lastTransaction.date), 'MMM dd');
  };

  const getWeeklyChange = () => {
    // This would need to be calculated based on historical data
    // For now, return a mock value
    const change = Math.random() * 1000 - 500;
    return {
      amount: change,
      percentage: change > 0 ? '+' : '',
      color: change > 0 ? 'text-green-400' : 'text-red-400'
    };
  };

  const AccountIcon = getAccountIcon(account.type);
  const balanceStatus = getBalanceStatus(account.balance);
  const lastTransactionDate = getLastTransactionDate();
  const weeklyChange = getWeeklyChange();

  return (
    <div 
      className={`bg-gradient-to-br from-forest-900/40 to-forest-800/40 backdrop-blur-md rounded-2xl p-6 border transition-all duration-300 cursor-pointer hover:shadow-xl ${
        isSelected 
          ? 'border-primary-500/50 bg-primary-500/10 shadow-2xl transform scale-[1.02]' 
          : 'border-forest-600/30 hover:border-forest-500/50 hover:bg-forest-700/20'
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl ${getAccountColor(account.type)} flex items-center justify-center shadow-lg`}>
            <AccountIcon size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-white">{account.name}</h3>
            <p className="text-sm text-forest-300 font-body">{getAccountTypeName(account.type)}</p>
            {account.institution && (
              <p className="text-xs text-forest-400 font-body">{account.institution}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={account.isVisible ? "Hide from dashboard" : "Show on dashboard"}
          >
            {account.isVisible ? (
              <Eye size={16} className="text-forest-400" />
            ) : (
              <EyeOff size={16} className="text-gray-400" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Edit account"
          >
            <Edit3 size={16} className="text-forest-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            title="Delete account"
          >
            <Trash2 size={16} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Balance Section */}
      {showBalances && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-300 font-body">Current Balance</span>
            <div className="flex items-center space-x-1">
              <balanceStatus.icon size={14} className={balanceStatus.color} />
              <span className={`text-xs font-medium ${balanceStatus.color}`}>
                {weeklyChange.percentage}{formatCurrency(Math.abs(weeklyChange.amount))}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-numbers font-bold text-white">
              <CurrencyIcon currencyCode={currency.code} size={20} className="inline mr-2" />
              {formatCurrency(account.balance)}
            </p>
            <span className={`text-xs px-2 py-1 rounded-full ${
              balanceStatus.status === 'high' ? 'bg-green-500/20 text-green-400' :
              balanceStatus.status === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              balanceStatus.status === 'low' ? 'bg-orange-500/20 text-orange-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {balanceStatus.status === 'high' ? 'High' :
               balanceStatus.status === 'medium' ? 'Medium' :
               balanceStatus.status === 'low' ? 'Low' : 'Zero'}
            </span>
          </div>
        </div>
      )}

      {/* Goals Vault Breakdown */}
      {account.type === 'goals_vault' && goalsVaultBreakdown && (
        <div className="mb-4 p-3 bg-forest-800/30 rounded-lg border border-forest-600/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Goals Allocated</span>
            <span className="text-sm text-forest-400">
              {formatCurrency(goalsVaultBreakdown.totalAllocated)}
            </span>
          </div>
          <div className="space-y-2">
            {goalsVaultBreakdown.goalBreakdown.slice(0, 3).map((goal) => (
              <div key={goal.goalId} className="flex items-center justify-between">
                <span className="text-xs text-forest-300 truncate">{goal.title}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-forest-400">{formatCurrency(goal.amount)}</span>
                  <div className="w-12 bg-gray-700 rounded-full h-1">
                    <div 
                      className="bg-primary-500 h-1 rounded-full" 
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div className="flex items-center space-x-2">
          <Calendar size={12} className="text-forest-400" />
          <span className="text-forest-300">
            {lastTransactionDate ? `Last: ${lastTransactionDate}` : 'No transactions'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <BarChart3 size={12} className="text-forest-400" />
          <span className="text-forest-300">
            {recentTransactions.length} recent
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onTransfer();
          }}
          className="border-forest-500/30 text-forest-300 hover:bg-forest-600/10 text-xs"
        >
          <ArrowLeftRight size={12} className="mr-1" />
          Transfer
        </Button>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onAddTransaction();
          }}
          className="bg-primary-500 hover:bg-primary-600 text-xs"
        >
          <DollarSign size={12} className="mr-1" />
          Add Txn
        </Button>
      </div>
    </div>
  );
};
