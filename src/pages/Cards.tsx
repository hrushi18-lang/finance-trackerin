import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft,
  CreditCard,
  Wallet,
  Target,
  TrendingUp,
  Plus,
  Eye,
  EyeOff,
  Settings,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { usePayment } from '../contexts/PaymentContext';
import { format } from 'date-fns';

const Cards: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useInternationalization();
  const { accounts, transactions } = useFinance();
  const { openPaymentModal } = usePayment();
  
  const [showBalances, setShowBalances] = useState(true);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // Calculate card statistics
  const cardStats = useMemo(() => {
    const creditCards = accounts.filter(acc => acc.type === 'credit_card');
    const totalCreditLimit = creditCards.reduce((sum, acc) => sum + (acc.creditLimit || 0), 0);
    const totalCreditUsed = creditCards.reduce((sum, acc) => sum + Math.abs(acc.balance || 0), 0);
    const creditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;
    
    const monthlySpending = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalCards: creditCards.length,
      totalCreditLimit,
      totalCreditUsed,
      creditUtilization,
      monthlySpending,
      availableCredit: totalCreditLimit - totalCreditUsed
    };
  }, [accounts, transactions]);

  // Get recent transactions for cards
  const recentCardTransactions = useMemo(() => {
    return transactions
      .filter(t => accounts.find(acc => acc.id === t.accountId && acc.type === 'credit_card'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions, accounts]);

  const CardItem = ({ account, isSelected, onClick }: { account: any, isSelected: boolean, onClick: () => void }) => {
    const utilization = account.creditLimit > 0 ? (Math.abs(account.balance) / account.creditLimit) * 100 : 0;
    const isOverLimit = account.balance < 0 && Math.abs(account.balance) > account.creditLimit;
    
    return (
      <div 
        className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
          isSelected 
            ? 'border-blue-400 bg-blue-500/10' 
            : 'border-white/20 hover:border-white/30 bg-white/5'
        }`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <CreditCard size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-heading text-white">{account.name}</h3>
              <p className="text-sm text-gray-400">**** {account.accountNumber?.slice(-4) || '1234'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Balance</p>
            <p className={`font-numbers text-lg ${account.balance < 0 ? 'text-red-400' : 'text-white'}`}>
              {showBalances ? formatCurrency(account.balance) : '••••••'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Credit Limit</span>
            <span className="text-white">{formatCurrency(account.creditLimit || 0)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Available</span>
            <span className="text-green-400">
              {formatCurrency((account.creditLimit || 0) - Math.abs(account.balance || 0))}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Utilization</span>
              <span className={`${utilization > 80 ? 'text-red-400' : utilization > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                {utilization.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  utilization > 80 ? 'bg-red-400' : utilization > 50 ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
          </div>

          {isOverLimit && (
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <Shield size={14} />
              <span>Over Credit Limit</span>
            </div>
          )}

          {/* Payment Actions */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openPaymentModal({
                  sourceEntity: {
                    id: account.id,
                    type: 'account',
                    name: account.name,
                    currentAmount: Math.abs(account.balance),
                    targetAmount: account.creditLimit
                  },
                  defaultAmount: Math.min(100, Math.abs(account.balance) || 0),
                  defaultDescription: `Payment to ${account.name}`,
                  defaultCategory: 'Debt Payment',
                  title: 'Make Payment',
                  paymentType: 'payment',
                  showDeductToggle: true
                });
              }}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ 
                backgroundColor: 'var(--primary)',
                color: 'white'
              }}
            >
              Pay
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openPaymentModal({
                  sourceEntity: {
                    id: account.id,
                    type: 'account',
                    name: account.name,
                    currentAmount: Math.abs(account.balance),
                    targetAmount: account.creditLimit
                  },
                  defaultAmount: 0,
                  defaultDescription: `Transfer to ${account.name}`,
                  defaultCategory: 'Transfer',
                  title: 'Add Money',
                  paymentType: 'transfer',
                  showDeductToggle: false
                });
              }}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors"
              style={{ 
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--background)'
              }}
            >
              Add Money
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="pt-12 pb-6 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/overview')}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
            >
              <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
            </button>
            <div>
              <h1 className="text-2xl font-heading text-white">Cards</h1>
              <p className="text-sm text-gray-400">Manage your credit cards and spending</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBalances(!showBalances)}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
              title={showBalances ? 'Hide Balances' : 'Show Balances'}
            >
              {showBalances ? <EyeOff size={16} style={{ color: 'var(--text-primary)' }} /> : <Eye size={16} style={{ color: 'var(--text-primary)' }} />}
            </button>
            <button
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
              title="Settings"
            >
              <Settings size={16} style={{ color: 'var(--text-primary)' }} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <CreditCard size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Total Cards</h3>
                <p className="text-2xl font-bold text-white">{cardStats.totalCards}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp size={20} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Available Credit</h3>
                <p className="text-2xl font-bold text-white">{formatCurrency(cardStats.availableCredit)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Target size={20} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Utilization</h3>
                <p className="text-2xl font-bold text-white">{cardStats.creditUtilization.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Wallet size={20} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Monthly Spending</h3>
                <p className="text-2xl font-bold text-white">{formatCurrency(cardStats.monthlySpending)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Cards List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading text-white">Your Cards</h2>
            <button
              onClick={() => navigate('/accounts')}
              className="px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'white'
              }}
            >
              <Plus size={16} />
              <span className="text-sm font-medium">Add Card</span>
            </button>
          </div>

          {accounts.filter(acc => acc.type === 'credit_card').length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-gray-500/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CreditCard size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-heading text-white mb-2">No Credit Cards</h3>
              <p className="text-gray-400 mb-6">Add your first credit card to start tracking spending</p>
              <button
                onClick={() => navigate('/accounts')}
                className="px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white'
                }}
              >
                <Plus size={20} />
                <span className="font-medium">Add Credit Card</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts
                .filter(acc => acc.type === 'credit_card')
                .map((account) => (
                  <CardItem
                    key={account.id}
                    account={account}
                    isSelected={selectedCard === account.id}
                    onClick={() => setSelectedCard(selectedCard === account.id ? null : account.id)}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        {recentCardTransactions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-heading text-white">Recent Card Transactions</h2>
            <div className="space-y-2">
              {recentCardTransactions.map((transaction) => {
                const account = accounts.find(acc => acc.id === transaction.accountId);
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <CreditCard size={16} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-400">{account?.name} • {format(new Date(transaction.date), 'MMM d')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-numbers ${transaction.type === 'expense' ? 'text-red-400' : 'text-green-400'}`}>
                        {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cards;