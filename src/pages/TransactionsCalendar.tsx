import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContextOffline';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { usePullToRefresh } from '../hooks/useMobileGestures';
import { 
  Calendar,
  List,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  CreditCard,
  PiggyBank,
  Target,
  Receipt,
  Clock,
  Activity
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';

const TransactionsCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useInternationalization();
  const { transactions, bills, goals, refreshData } = useFinance();

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');

  // Pull to refresh
  const { elementRef, isRefreshing, pullDistance, isPulling } = usePullToRefresh(
    async () => {
      await refreshData();
    },
    { threshold: 80, resistance: 0.5 }
  );

  // Get transactions for selected date
  const selectedDateTransactions = useMemo(() => {
    if (!selectedDate) return [];
    
    return transactions.filter(transaction => 
      isSameDay(new Date(transaction.date), selectedDate)
    );
  }, [transactions, selectedDate]);

  // Get transactions for current month
  const currentMonthTransactions = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });
  }, [transactions, currentDate]);

  // Filter transactions based on search and type
  const filteredTransactions = useMemo(() => {
    let filtered = currentMonthTransactions;

    if (searchQuery) {
      filtered = filtered.filter(transaction =>
        transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currentMonthTransactions, searchQuery, filterType]);

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return days;
  }, [currentDate]);

  // Get transactions by date for calendar
  const transactionsByDate = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    
    currentMonthTransactions.forEach(transaction => {
      const dateKey = format(new Date(transaction.date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });
    
    return grouped;
  }, [currentMonthTransactions]);

  // Get daily totals
  const getDailyTotals = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayTransactions = transactionsByDate[dateKey] || [];
    
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const expenses = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    return { income, expenses, net: income - expenses, count: dayTransactions.length };
  };

  // Get transaction icon
  const getTransactionIcon = (transaction: any) => {
    switch (transaction.category?.toLowerCase()) {
      case 'shopping':
        return <ShoppingBag size={20} className="text-red-500" />;
      case 'salary':
      case 'income':
        return <DollarSign size={20} className="text-green-500" />;
      case 'investment':
        return <TrendingUp size={20} className="text-blue-500" />;
      case 'savings':
        return <PiggyBank size={20} className="text-blue-500" />;
      case 'goal':
        return <Target size={20} className="text-purple-500" />;
      case 'bill':
        return <Receipt size={20} className="text-orange-500" />;
      default:
        return transaction.type === 'income' 
          ? <DollarSign size={20} className="text-green-500" />
          : <CreditCard size={20} className="text-red-500" />;
    }
  };

  const getTransactionTag = (transaction: any) => {
    if (transaction.type === 'income') {
      return { text: 'Income', color: 'bg-green-100 text-green-800' };
    } else if (transaction.type === 'transfer') {
      return { text: 'Transfer', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { text: 'Expense', color: 'bg-red-100 text-red-800' };
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(selectedDate && isSameDay(selectedDate, date) ? null : date);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--background)' }} ref={elementRef}>
      {/* Pull to refresh indicator */}
      <div className={`pull-refresh-indicator ${isPulling || isRefreshing ? 'show' : ''}`}>
        {isRefreshing ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Refreshing...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Pull to refresh</span>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="pt-12 pb-6 px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-heading" style={{ color: 'var(--text-primary)' }}>Transactions</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              {viewMode === 'calendar' ? <List size={20} style={{ color: 'var(--text-secondary)' }} /> : <Calendar size={20} style={{ color: 'var(--text-secondary)' }} />}
            </button>
            <button
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <Search size={20} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="px-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <ChevronLeft size={20} style={{ color: 'var(--text-secondary)' }} />
            </button>
            
            <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <ChevronRight size={20} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div 
            className="p-4 rounded-3xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-body py-2" style={{ color: 'var(--text-tertiary)' }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const totals = getDailyTotals(day);
                const isSelected = selectedDate && isSameDay(selectedDate, day);
                const isCurrentDay = isToday(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(day)}
                    className={`p-2 rounded-xl text-center transition-all duration-200 hover:scale-105 ${
                      isSelected ? 'scale-110' : ''
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--primary)' : isCurrentDay ? 'var(--accent-light)' : 'transparent',
                      color: isSelected ? 'white' : isCurrentDay ? 'white' : isCurrentMonth ? 'var(--text-primary)' : 'var(--text-tertiary)'
                    }}
                  >
                    <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>
                    {totals.count > 0 && (
                      <div className="text-xs">
                        <div className={`w-1 h-1 rounded-full mx-auto mb-1 ${
                          totals.net > 0 ? 'bg-green-400' : totals.net < 0 ? 'bg-red-400' : 'bg-gray-400'
                        }`} />
                        <div className="text-xs">{totals.count}</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Transactions */}
          {selectedDate && (
            <div className="mt-6">
              <h3 className="text-lg font-heading mb-4" style={{ color: 'var(--text-primary)' }}>
                {format(selectedDate, 'EEEE, MMMM do, yyyy')}
              </h3>
              
              {selectedDateTransactions.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateTransactions.map((transaction) => {
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
                                {transaction.category}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-numbers ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${tag.color}`}>
                              {tag.text}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div 
                  className="p-8 rounded-2xl text-center"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                  }}
                >
                  <Calendar size={32} style={{ color: 'var(--text-tertiary)' }} className="mx-auto mb-3" />
                  <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                    No transactions on this date
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* List View - Mobile Design */
        <div className="px-6">
          <div className="space-y-6">
            {(() => {
              // Group transactions by date
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              const thisWeekStart = new Date(today);
              thisWeekStart.setDate(thisWeekStart.getDate() - today.getDay());

              const todayTransactions = filteredTransactions.filter(t => 
                isSameDay(new Date(t.date), today)
              );
              
              const yesterdayTransactions = filteredTransactions.filter(t => 
                isSameDay(new Date(t.date), yesterday)
              );
              
              const thisWeekTransactions = filteredTransactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= thisWeekStart && 
                       transactionDate < today && 
                       !isSameDay(transactionDate, yesterday);
              });

              const renderTransactionGroup = (title: string, transactions: any[], icon: any) => {
                if (transactions.length === 0) return null;

                return (
                  <div key={title}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        {icon}
                      </div>
                      <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>
                        {title}
                      </h2>
                    </div>
                    
                    <div className="space-y-3">
                      {transactions.map((transaction) => {
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
                                <div 
                                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                                  style={{ backgroundColor: 'var(--background)' }}
                                >
                                  {getTransactionIcon(transaction)}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                    {transaction.description || 'Transaction'}
                                  </p>
                                  <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                                    {transaction.category}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-lg font-numbers ${
                                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.type === 'income' ? '+' : '-'}
                                  {formatCurrency(transaction.amount)}
                                </p>
                                <p className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
                                  {format(new Date(transaction.date), 'h:mm a')}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              };

              if (filteredTransactions.length === 0) {
                return (
                  <div 
                    className="p-8 rounded-2xl text-center"
                    style={{
                      backgroundColor: 'var(--background-secondary)',
                      boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                    }}
                  >
                    <List size={32} style={{ color: 'var(--text-tertiary)' }} className="mx-auto mb-3" />
                    <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                      {searchQuery ? 'No transactions found' : 'No transactions this month'}
                    </p>
                  </div>
                );
              }

              return (
                <>
                  {renderTransactionGroup('Today', todayTransactions, <Calendar size={16} className="text-white" />)}
                  {renderTransactionGroup('Yesterday', yesterdayTransactions, <Clock size={16} className="text-white" />)}
                  {renderTransactionGroup('This Week', thisWeekTransactions, <Activity size={16} className="text-white" />)}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-6 z-40">
        <button
          onClick={() => navigate('/add-transaction')}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
          style={{ 
            backgroundColor: 'var(--primary)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}
        >
          <Plus size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default TransactionsCalendar;
