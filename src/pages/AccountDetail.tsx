import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MoreVertical, 
  TrendingUp, 
  TrendingDown,
  ArrowRightLeft,
  FileText,
  QrCode,
  Plus,
  Calendar,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import LuxuryCategoryIcon from '../components/common/LuxuryCategoryIcon';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';

const AccountDetail: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { 
    accounts, 
    transactions, 
    goals,
    bills,
    liabilities,
    addTransaction,
    getAccountTransactions,
    isLoading 
  } = useFinance();
  const { formatCurrency } = useInternationalization();
  
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showHistoricalTransaction, setShowHistoricalTransaction] = useState(false);
  const [showSchedulePayment, setShowSchedulePayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('Oct 2023');

  // Find the current account
  const account = useMemo(() => {
    return accounts.find(acc => acc.id === accountId);
  }, [accounts, accountId]);

  // Get transactions for this account
  const accountTransactions = useMemo(() => {
    if (!account) return [];
    return getAccountTransactions(account.id);
  }, [account, getAccountTransactions]);

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return accountTransactions;
    return accountTransactions.filter(t =>
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accountTransactions, searchTerm]);

  // Calculate spending analytics for the month
  const monthlyAnalytics = useMemo(() => {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthlyTransactions = accountTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return { income, expenses, net: income - expenses };
  }, [accountTransactions]);

  // Get account icon
  const getAccountIcon = () => {
    if (!account) return null;
    const category = account.type === 'bank_current' ? 'Primary Banking' : 
                    account.type === 'bank_savings' ? 'Savings' :
                    account.type === 'credit_card' ? 'Credit' :
                    account.type === 'digital_wallet' ? 'Digital Wallet' : 'Other Account';
    return <LuxuryCategoryIcon category={category} size={24} variant="luxury" />;
  };

  // Format date for display
  const formatDate = (date: string) => {
    const transactionDate = new Date(date);
    if (isToday(transactionDate)) return 'Today';
    if (isYesterday(transactionDate)) return 'Yesterday';
    if (isThisWeek(transactionDate)) return format(transactionDate, 'EEEE');
    return format(transactionDate, 'MMM dd, yyyy');
  };

  // Get transaction icon
  const getTransactionIcon = (transaction: any) => {
    return <LuxuryCategoryIcon category={transaction.category} size={16} variant="minimal" />;
  };

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <h2 className="text-xl font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
            Account not found
          </h2>
          <Button onClick={() => navigate('/accounts')}>
            Back to Accounts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="relative">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/accounts')}
                className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: 'var(--background-secondary)' }}
              >
                <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
              </button>
              <div>
                <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
                  {account.name}
                </h1>
                <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  **** {account.account_number?.slice(-4) || '1234'}
                </p>
              </div>
            </div>
            <button
              className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <MoreVertical size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          {/* Current Balance Card */}
          <div 
            className="relative overflow-hidden rounded-3xl p-8 mb-6"
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #2d5016 100%)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.06)'
            }}
          >
            <div className="text-center text-white">
              <p className="text-lg font-body mb-2 opacity-90">Current Balance</p>
              <p className="text-4xl font-serif font-bold mb-2">
                {formatCurrency(account.balance || 0)}
              </p>
              <div className="flex items-center justify-center space-x-2">
                {getAccountIcon()}
                <span className="text-sm font-body opacity-90">
                  {account.type?.replace('_', ' ').toUpperCase() || 'ACCOUNT'}
                </span>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: 'white' }}></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full opacity-10" style={{ backgroundColor: 'white' }}></div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Spending Analytics */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold" style={{ color: 'var(--text-primary)' }}>
              Spending
            </h3>
            <div className="flex items-center space-x-2 rounded-lg px-3 py-1" style={{ backgroundColor: 'var(--background-secondary)' }}>
              <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>{selectedPeriod}</span>
            </div>
          </div>
          
          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            {/* Mini spending chart */}
            <div className="h-24 flex items-end justify-between space-x-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const height = Math.random() * 60 + 20; // Mock data
                return (
                  <div key={day} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full rounded-t"
                      style={{ 
                        height: `${height}px`,
                        backgroundColor: 'var(--primary)',
                        opacity: 0.7
                      }}
                    ></div>
                    <span className="text-xs font-body mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Income</p>
                <p className="text-sm font-numbers font-bold text-green-600">
                  {formatCurrency(monthlyAnalytics.income)}
                </p>
              </div>
              <div>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Expenses</p>
                <p className="text-sm font-numbers font-bold text-red-600">
                  {formatCurrency(monthlyAnalytics.expenses)}
                </p>
              </div>
              <div>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Net</p>
                <p className={`text-sm font-numbers font-bold ${monthlyAnalytics.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(monthlyAnalytics.net)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Activities */}
        <div>
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Linked Activities
          </h3>
          <div 
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="space-y-4">
              {/* Goals */}
              <div>
                <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Goals ({goals.filter(g => g.accountId === account?.id).length})
                </h4>
                <div className="space-y-2">
                  {goals.filter(g => g.accountId === account?.id).slice(0, 3).map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--background)' }}>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-600 text-sm">🎯</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{goal.title}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                        </p>
                        <div className="w-16 h-1 bg-gray-200 rounded-full mt-1">
                          <div 
                            className="h-1 bg-purple-500 rounded-full"
                            style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {goals.filter(g => g.accountId === account?.id).length > 3 && (
                    <button 
                      onClick={() => navigate('/goals')}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      View all {goals.filter(g => g.accountId === account?.id).length} goals
                    </button>
                  )}
                </div>
              </div>

              {/* Bills */}
              <div>
                <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Bills ({bills.filter(b => b.defaultAccountId === account?.id).length})
                </h4>
                <div className="space-y-2">
                  {bills.filter(b => b.defaultAccountId === account?.id).slice(0, 3).map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--background)' }}>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-orange-600 text-sm">📄</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{bill.title}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {formatCurrency(bill.amount)} • {bill.frequency}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Due {format(new Date(bill.nextDueDate), 'MMM dd')}
                        </p>
                        <p className={`text-xs font-medium ${new Date(bill.nextDueDate) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                          {new Date(bill.nextDueDate) < new Date() ? 'Overdue' : 'Upcoming'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {bills.filter(b => b.defaultAccountId === account?.id).length > 3 && (
                    <button 
                      onClick={() => navigate('/bills')}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      View all {bills.filter(b => b.defaultAccountId === account?.id).length} bills
                    </button>
                  )}
                </div>
              </div>

              {/* Liabilities */}
              <div>
                <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Liabilities ({liabilities.filter(l => l.accountId === account?.id).length})
                </h4>
                <div className="space-y-2">
                  {liabilities.filter(l => l.accountId === account?.id).slice(0, 3).map((liability) => (
                    <div key={liability.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--background)' }}>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-red-600 text-sm">💳</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{liability.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {formatCurrency(liability.remainingAmount)} remaining
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {liability.interestRate}% APR
                        </p>
                        <p className="text-xs font-medium text-red-600">
                          {liability.status}
                        </p>
                      </div>
                    </div>
                  ))}
                  {liabilities.filter(l => l.accountId === account?.id).length > 3 && (
                    <button 
                      onClick={() => navigate('/liabilities')}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      View all {liabilities.filter(l => l.accountId === account?.id).length} liabilities
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setShowAddTransaction(true)}
              className="flex flex-col items-center space-y-2 p-4 rounded-2xl transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <ArrowRightLeft size={20} className="text-white" />
              </div>
              <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>Transfer</span>
            </button>

            <button
              onClick={() => setShowSchedulePayment(true)}
              className="flex flex-col items-center space-y-2 p-4 rounded-2xl transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <FileText size={20} className="text-white" />
              </div>
              <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>Pay Bill</span>
            </button>

            <button
              className="flex flex-col items-center space-y-2 p-4 rounded-2xl transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <QrCode size={20} className="text-white" />
              </div>
              <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>Scan</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent Transactions
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowHistoricalTransaction(true)}
                className="p-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'var(--background-secondary)',
                  color: 'var(--text-secondary)'
                }}
              >
                <Clock size={16} />
              </button>
              <button
                className="p-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'var(--background-secondary)',
                  color: 'var(--text-secondary)'
                }}
              >
                <Filter size={16} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <Input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Transactions List */}
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div 
                className="p-8 text-center rounded-2xl"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                }}
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--background)' }}>
                  <LuxuryCategoryIcon category="Other Expense" size={24} variant="luxury" />
                </div>
                <h3 className="text-lg font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
                  {searchTerm ? 'No transactions found' : 'No transactions yet'}
                </h3>
                <p className="text-sm font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Add your first transaction to get started'
                  }
                </p>
                {!searchTerm && (
                  <Button
                    variant="primary"
                    onClick={() => setShowAddTransaction(true)}
                    className="flex items-center space-x-2 mx-auto"
                  >
                    <Plus size={16} />
                    <span>Add Transaction</span>
                  </Button>
                )}
              </div>
            ) : (
              filteredTransactions.slice(0, 10).map((transaction) => (
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
                        <h4 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                          {transaction.description}
                        </h4>
                        <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                          {formatDate(transaction.date)} • {transaction.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-numbers text-sm font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        title="Add Transaction"
      >
        <div className="space-y-4">
          <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
            Add a new transaction to this account
          </p>
          <Button
            variant="primary"
            onClick={() => {
              setShowAddTransaction(false);
              navigate('/add-transaction', { state: { accountId: account.id } });
            }}
            className="w-full"
          >
            Go to Transaction Form
          </Button>
        </div>
      </Modal>

      {/* Historical Transaction Modal */}
      <Modal
        isOpen={showHistoricalTransaction}
        onClose={() => setShowHistoricalTransaction(false)}
        title="Add Historical Transaction"
      >
        <div className="space-y-4">
          <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
            Add a transaction from the past. This won't affect your current balance but will help maintain continuity in your analytics.
          </p>
          <Button
            variant="primary"
            onClick={() => {
              setShowHistoricalTransaction(false);
              navigate('/add-transaction', { state: { accountId: account.id, isHistorical: true } });
            }}
            className="w-full"
          >
            Add Historical Transaction
          </Button>
        </div>
      </Modal>

      {/* Schedule Payment Modal */}
      <Modal
        isOpen={showSchedulePayment}
        onClose={() => setShowSchedulePayment(false)}
        title="Schedule Payment"
      >
        <div className="space-y-4">
          <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
            Schedule a future payment from this account
          </p>
          <Button
            variant="primary"
            onClick={() => {
              setShowSchedulePayment(false);
              navigate('/add-transaction', { state: { accountId: account.id, isScheduled: true } });
            }}
            className="w-full"
          >
            Schedule Payment
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AccountDetail;
