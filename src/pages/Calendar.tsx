import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Eye,
  EyeOff,
  Filter,
  Search
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths, 
  getDay,
  addDays,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay
} from 'date-fns';
import { PageNavigation } from '../components/layout/PageNavigation';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { getCategoryIcon, getCategoryColor } from '../utils/categories';

interface CalendarEvent {
  id: string;
  type: 'transaction' | 'goal' | 'bill' | 'liability';
  title: string;
  amount?: number;
  date: Date;
  status?: 'pending' | 'completed' | 'overdue';
  category?: string;
  description?: string;
  accountName?: string;
  isPaid?: boolean;
  paidDate?: Date;
}

export const Calendar: React.FC = () => {
  const { 
    transactions, 
    goals, 
    bills, 
    liabilities, 
    recurringTransactions,
    accounts,
    markBillAsPaid,
    markRecurringTransactionAsPaid
  } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    showTransactions: true,
    showGoals: true,
    showBills: true,
    showLiabilities: true,
    showCompleted: true,
    showPending: true,
    showOverdue: true
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create comprehensive calendar events
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    // Add transactions
    if (filters.showTransactions) {
      transactions.forEach(transaction => {
        events.push({
          id: `transaction-${transaction.id}`,
          type: 'transaction',
          title: transaction.description,
          amount: transaction.amount,
          date: new Date(transaction.date),
          status: 'completed',
          category: transaction.category,
          description: transaction.description,
          accountName: accounts.find(a => a.id === transaction.accountId)?.name
        });
      });
    }

    // Add goals with target dates
    if (filters.showGoals) {
      goals.forEach(goal => {
        if (goal.targetDate) {
          const targetDate = new Date(goal.targetDate);
          const isOverdue = isAfter(new Date(), targetDate) && goal.currentAmount < goal.targetAmount;
          
          events.push({
            id: `goal-${goal.id}`,
            type: 'goal',
            title: goal.name,
            amount: goal.targetAmount,
            date: targetDate,
            status: isOverdue ? 'overdue' : 'pending',
            category: goal.category,
            description: `Target: ${formatCurrency(goal.targetAmount)} | Current: ${formatCurrency(goal.currentAmount)}`
          });
        }
      });
    }

    // Add bills (recurring transactions)
    if (filters.showBills) {
      recurringTransactions.forEach(bill => {
        if (bill.type === 'expense' && bill.frequency) {
          // Generate bill dates for the current month
          const billDate = new Date(bill.nextDueDate || bill.date);
          const isOverdue = isAfter(new Date(), billDate);
          const isPaid = bill.isPaid;
          
          events.push({
            id: `bill-${bill.id}`,
            type: 'bill',
            title: bill.description,
            amount: bill.amount,
            date: billDate,
            status: isPaid ? 'completed' : (isOverdue ? 'overdue' : 'pending'),
            category: bill.category,
            description: bill.description,
            isPaid: isPaid,
            paidDate: isPaid ? new Date() : undefined
          });
        }
      });
    }

    // Add liability payments
    if (filters.showLiabilities) {
      liabilities.forEach(liability => {
        if (liability.nextPaymentDate) {
          const paymentDate = new Date(liability.nextPaymentDate);
          const isOverdue = isAfter(new Date(), paymentDate);
          const isPaid = liability.isPaid;
          
          events.push({
            id: `liability-${liability.id}`,
            type: 'liability',
            title: liability.name,
            amount: liability.monthlyPayment,
            date: paymentDate,
            status: isPaid ? 'completed' : (isOverdue ? 'overdue' : 'pending'),
            category: liability.type,
            description: `Monthly payment: ${formatCurrency(liability.monthlyPayment)}`,
            isPaid: isPaid,
            paidDate: isPaid ? new Date() : undefined
          });
        }
      });
    }

    return events.filter(event => {
      // Apply status filters
      if (!filters.showCompleted && event.status === 'completed') return false;
      if (!filters.showPending && event.status === 'pending') return false;
      if (!filters.showOverdue && event.status === 'overdue') return false;
      
      return true;
    });
  }, [transactions, goals, bills, liabilities, recurringTransactions, accounts, filters]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    calendarEvents.forEach(event => {
      const dateKey = format(event.date, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [calendarEvents]);

  // Get events for a specific date
  const getDateEvents = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return eventsByDate[dateKey] || [];
  };

  // Calculate daily totals
  const getDayData = (date: Date) => {
    const dayEvents = getDateEvents(date);
    const dayTransactions = dayEvents.filter(e => e.type === 'transaction');
    
    const income = dayTransactions
      .filter(t => t.amount && t.amount > 0)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const expenses = dayTransactions
      .filter(t => t.amount && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    
    const pendingBills = dayEvents.filter(e => e.type === 'bill' && e.status === 'pending').length;
    const overdueBills = dayEvents.filter(e => e.type === 'bill' && e.status === 'overdue').length;
    const completedBills = dayEvents.filter(e => e.type === 'bill' && e.status === 'completed').length;
    
    return {
      events: dayEvents,
      income,
      expenses,
      net: income - expenses,
      pendingBills,
      overdueBills,
      completedBills,
      hasEvents: dayEvents.length > 0
    };
  };

  const selectedDateEvents = selectedDate ? getDateEvents(selectedDate) : [];
  const selectedDateData = selectedDate ? getDayData(selectedDate) : null;

  // Calculate month totals
  const monthTotals = useMemo(() => {
    const monthEvents = calendarEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= monthStart && eventDate <= monthEnd;
    });

    const transactions = monthEvents.filter(e => e.type === 'transaction');
    const income = transactions
      .filter(t => t.amount && t.amount > 0)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const expenses = transactions
      .filter(t => t.amount && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

    const pendingBills = monthEvents.filter(e => e.type === 'bill' && e.status === 'pending').length;
    const overdueBills = monthEvents.filter(e => e.type === 'bill' && e.status === 'overdue').length;
    const completedBills = monthEvents.filter(e => e.type === 'bill' && e.status === 'completed').length;

    return { 
      income, 
      expenses, 
      net: income - expenses,
      pendingBills,
      overdueBills,
      completedBills,
      totalEvents: monthEvents.length
    };
  }, [calendarEvents, monthStart, monthEnd]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    setSelectedDate(null);
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = getDay(monthStart);
    const daysFromPrevMonth = firstDayOfWeek;
    
    const prevMonthEnd = subMonths(monthStart, 1);
    const prevMonthDays = eachDayOfInterval({
      start: subMonths(prevMonthEnd, 0),
      end: prevMonthEnd
    }).slice(-daysFromPrevMonth);
    
    const nextMonthStart = addMonths(monthStart, 1);
    const totalCells = 42;
    const remainingCells = totalCells - prevMonthDays.length - daysInMonth.length;
    const nextMonthDays = eachDayOfInterval({
      start: nextMonthStart,
      end: addMonths(nextMonthStart, 0)
    }).slice(0, remainingCells);
    
    return [
      ...prevMonthDays.map(date => ({ date, isCurrentMonth: false })),
      ...daysInMonth.map(date => ({ date, isCurrentMonth: true })),
      ...nextMonthDays.map(date => ({ date, isCurrentMonth: false }))
    ];
  }, [monthStart, daysInMonth]);

  const getEventIcon = (event: CalendarEvent) => {
    switch (event.type) {
      case 'transaction':
        return event.amount && event.amount > 0 ? TrendingUp : TrendingDown;
      case 'goal':
        return Target;
      case 'bill':
        return CreditCard;
      case 'liability':
        return AlertCircle;
      default:
        return CalendarIcon;
    }
  };

  const getEventColor = (event: CalendarEvent) => {
    switch (event.status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20';
      case 'overdue':
        return 'text-red-400 bg-red-500/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const handleMarkAsPaid = async (event: CalendarEvent) => {
    try {
      if (event.type === 'bill') {
        await markBillAsPaid(event.id.replace('bill-', ''), selectedDate || undefined);
      } else if (event.type === 'liability') {
        await markRecurringTransactionAsPaid(event.id.replace('liability-', ''), selectedDate || undefined);
      }
      // Refresh the calendar data
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  return (
    <div className="min-h-screen text-white pb-20">
      {/* Header with Navigation */}
      <header className="bg-black/20 backdrop-blur-md px-4 py-4 sm:py-6 sticky top-0 z-30 border-b border-white/10">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Financial Calendar</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-xl bg-black/20 backdrop-blur-md hover:bg-black/30 transition-colors border border-white/10"
            >
              <Filter size={20} className="text-gray-300" />
            </button>
          </div>
        </div>
        <PageNavigation />
      </header>
      
      <div className="px-4 py-6">
        {/* Filters */}
        {showFilters && (
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showTransactions}
                  onChange={(e) => setFilters(prev => ({ ...prev, showTransactions: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Transactions</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showGoals}
                  onChange={(e) => setFilters(prev => ({ ...prev, showGoals: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Goals</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showBills}
                  onChange={(e) => setFilters(prev => ({ ...prev, showBills: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Bills</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showLiabilities}
                  onChange={(e) => setFilters(prev => ({ ...prev, showLiabilities: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Liabilities</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showCompleted}
                  onChange={(e) => setFilters(prev => ({ ...prev, showCompleted: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Completed</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showPending}
                  onChange={(e) => setFilters(prev => ({ ...prev, showPending: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Pending</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showOverdue}
                  onChange={(e) => setFilters(prev => ({ ...prev, showOverdue: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Overdue</span>
              </label>
            </div>
          </div>
        )}

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-3 rounded-xl bg-black/20 backdrop-blur-md hover:bg-black/30 transition-colors border border-white/10"
          >
            <ArrowLeft size={20} className="text-gray-300" />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center justify-center space-x-4 mt-2 text-sm">
              <span className="text-green-400">
                +{formatCurrency(monthTotals.income)}
              </span>
              <span className="text-red-400">
                -{formatCurrency(monthTotals.expenses)}
              </span>
              <span className={`font-semibold ${monthTotals.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                Net: {monthTotals.net >= 0 ? '+' : ''}{formatCurrency(monthTotals.net)}
              </span>
            </div>
            <div className="flex items-center justify-center space-x-4 mt-1 text-xs text-gray-400">
              <span>Pending: {monthTotals.pendingBills}</span>
              <span>Overdue: {monthTotals.overdueBills}</span>
              <span>Completed: {monthTotals.completedBills}</span>
            </div>
          </div>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-3 rounded-xl bg-black/20 backdrop-blur-md hover:bg-black/30 transition-colors border border-white/10"
          >
            <ArrowRight size={20} className="text-gray-300" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, isCurrentMonth }, index) => {
              const dayData = getDayData(date);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isTodayDate = isToday(date);
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  disabled={!isCurrentMonth}
                  className={`
                    relative p-2 rounded-xl transition-all duration-200 min-h-[80px] flex flex-col items-center justify-start backdrop-blur-sm
                    ${!isCurrentMonth 
                      ? 'text-gray-600 cursor-not-allowed' 
                      : 'text-white hover:bg-white/10'
                    }
                    ${isSelected ? 'bg-blue-500/50 hover:bg-blue-600/50 border border-blue-400' : ''}
                    ${isTodayDate && !isSelected ? 'bg-white/10 ring-2 ring-blue-500' : ''}
                  `}
                >
                  <span className={`text-sm font-medium ${
                    isTodayDate ? 'text-blue-400' : ''
                  }`}>
                    {format(date, 'd')}
                  </span>
                  
                  {isCurrentMonth && dayData.hasEvents && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dayData.income > 0 && (
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      )}
                      {dayData.expenses > 0 && (
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      )}
                      {dayData.pendingBills > 0 && (
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                      )}
                      {dayData.overdueBills > 0 && (
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      )}
                      {dayData.completedBills > 0 && (
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  )}
                  
                  {isCurrentMonth && dayData.net !== 0 && (
                    <span className={`text-xs font-medium mt-1 ${
                      dayData.net > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {dayData.net > 0 ? '+' : ''}{formatCurrency(dayData.net)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && selectedDateEvents.length > 0 && (
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              {selectedDateData && (
                <div className="flex items-center space-x-4 text-sm">
                  {selectedDateData.income > 0 && (
                    <div className="flex items-center space-x-1 text-green-400">
                      <TrendingUp size={16} />
                      <span className="font-medium">+{formatCurrency(selectedDateData.income)}</span>
                    </div>
                  )}
                  {selectedDateData.expenses > 0 && (
                    <div className="flex items-center space-x-1 text-red-400">
                      <TrendingDown size={16} />
                      <span className="font-medium">-{formatCurrency(selectedDateData.expenses)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {selectedDateEvents.map((event) => {
                const EventIcon = getEventIcon(event);
                const eventColor = getEventColor(event);
                
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-md rounded-xl hover:bg-black/30 transition-colors border border-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${eventColor}`}>
                        <EventIcon size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {event.title}
                        </p>
                        <p className="text-sm text-gray-400">
                          {event.category} {event.accountName && `• ${event.accountName}`}
                        </p>
                        {event.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {event.amount && (
                        <p className={`font-semibold ${
                          event.type === 'transaction' && event.amount > 0
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {event.type === 'transaction' && event.amount > 0 ? '+' : ''}
                          {formatCurrency(Math.abs(event.amount))}
                        </p>
                      )}
                      <div className="flex items-center space-x-1 mt-1">
                        {event.status === 'completed' && (
                          <CheckCircle size={14} className="text-green-400" />
                        )}
                        {event.status === 'overdue' && (
                          <AlertCircle size={14} className="text-red-400" />
                        )}
                        {event.status === 'pending' && (
                          <Clock size={14} className="text-yellow-400" />
                        )}
                        <span className={`text-xs ${
                          event.status === 'completed' ? 'text-green-400' :
                          event.status === 'overdue' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      {event.isPaid && event.paidDate && (
                        <p className="text-xs text-green-400 mt-1">
                          Paid: {format(event.paidDate, 'MMM d')}
                        </p>
                      )}
                      {(event.type === 'bill' || event.type === 'liability') && event.status !== 'completed' && (
                        <button
                          onClick={() => handleMarkAsPaid(event)}
                          className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No events message */}
        {selectedDate && selectedDateEvents.length === 0 && (
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center">
            <CalendarIcon size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No events on this date</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;