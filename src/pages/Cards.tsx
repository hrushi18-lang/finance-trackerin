import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { useSwipeGestures } from '../hooks/useMobileGestures';
import { 
  Target, 
  PieChart, 
  CreditCard, 
  Receipt, 
  Plus,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

const Cards: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useInternationalization();
  const { 
    goals, 
    budgets, 
    liabilities, 
    bills 
  } = useFinance();

  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Swipe gestures for card navigation
  const { elementRef } = useSwipeGestures({
    onSwipeLeft: () => {
      if (currentCardIndex < 3) { // 4 cards total (0-3)
        setCurrentCardIndex(currentCardIndex + 1);
      }
    },
    onSwipeRight: () => {
      if (currentCardIndex > 0) {
        setCurrentCardIndex(currentCardIndex - 1);
      }
    },
    threshold: 50,
    velocityThreshold: 0.3
  });

  // Get active items
  const activeGoals = useMemo(() => 
    goals.filter(goal => !goal.is_archived), [goals]
  );
  
  const activeBudgets = useMemo(() => 
    budgets.filter(budget => budget.is_active), [budgets]
  );
  
  const activeLiabilities = useMemo(() => 
    liabilities.filter(liability => liability.is_active), [liabilities]
  );
  
  const upcomingBills = useMemo(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return bills.filter(bill => 
      new Date(bill.due_date) <= nextWeek && !bill.is_paid
    );
  }, [bills]);

  // Create card data
  const cardData = useMemo(() => [
    {
      type: 'goals',
      title: 'Goals',
      icon: Target,
      color: 'var(--primary)',
      items: activeGoals,
      emptyMessage: 'No goals set',
      emptyAction: () => navigate('/goals/create'),
      emptyActionText: 'Create Goal'
    },
    {
      type: 'budgets',
      title: 'Budgets',
      icon: PieChart,
      color: 'var(--success)',
      items: activeBudgets,
      emptyMessage: 'No budgets set',
      emptyAction: () => navigate('/budgets'),
      emptyActionText: 'Create Budget'
    },
    {
      type: 'liabilities',
      title: 'Liabilities',
      icon: CreditCard,
      color: 'var(--warning)',
      items: activeLiabilities,
      emptyMessage: 'No liabilities',
      emptyAction: () => navigate('/liabilities'),
      emptyActionText: 'Add Liability'
    },
    {
      type: 'bills',
      title: 'Bills',
      icon: Receipt,
      color: 'var(--error)',
      items: upcomingBills,
      emptyMessage: 'No upcoming bills',
      emptyAction: () => navigate('/bills'),
      emptyActionText: 'Add Bill'
    }
  ], [activeGoals, activeBudgets, activeLiabilities, upcomingBills, navigate]);

  const currentCard = cardData[currentCardIndex];

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % cardData.length);
  };

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + cardData.length) % cardData.length);
  };

  const getGoalProgress = (goal: any) => {
    return Math.min(((goal.current_amount || 0) / goal.target_amount) * 100, 100);
  };

  const getBudgetProgress = (budget: any) => {
    return Math.min(((budget.spent_amount || 0) / budget.limit_amount) * 100, 100);
  };

  const getLiabilityProgress = (liability: any) => {
    const total = liability.total_amount || 0;
    const remaining = liability.remaining_amount || 0;
    const paid = total - remaining;
    return Math.min((paid / total) * 100, 100);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderGoalCard = (goal: any) => (
    <div 
      key={goal.id}
      className="p-4 rounded-2xl mb-3 cursor-pointer transition-all duration-200 hover:scale-105"
      style={{
        backgroundColor: 'var(--background-secondary)',
        boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
      }}
      onClick={() => navigate(`/goals/${goal.id}`)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-lg" style={{ color: 'var(--text-primary)' }}>
          {goal.description || 'Untitled Goal'}
        </h3>
        <span className="text-sm font-body px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
          {Math.round(getGoalProgress(goal))}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
        <div
          className="h-3 rounded-full transition-all duration-300"
          style={{
            backgroundColor: 'var(--primary)',
            width: `${getGoalProgress(goal)}%`
          }}
        />
      </div>
      
      <div className="flex items-center justify-between text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
        <span>{formatCurrency(goal.current_amount || 0)}</span>
        <span>{formatCurrency(goal.target_amount || 0)}</span>
      </div>
    </div>
  );

  const renderBudgetCard = (budget: any) => (
    <div 
      key={budget.id}
      className="p-4 rounded-2xl mb-3 cursor-pointer transition-all duration-200 hover:scale-105"
      style={{
        backgroundColor: 'var(--background-secondary)',
        boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
      }}
      onClick={() => navigate(`/budgets/${budget.id}`)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-lg" style={{ color: 'var(--text-primary)' }}>
          {budget.name || 'Untitled Budget'}
        </h3>
        <span className="text-sm font-body px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
          {Math.round(getBudgetProgress(budget))}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
        <div
          className="h-3 rounded-full transition-all duration-300"
          style={{
            backgroundColor: getBudgetProgress(budget) > 100 ? 'var(--error)' : 'var(--success)',
            width: `${Math.min(getBudgetProgress(budget), 100)}%`
          }}
        />
      </div>
      
      <div className="flex items-center justify-between text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
        <span>{formatCurrency(budget.spent_amount || 0)}</span>
        <span>{formatCurrency(budget.limit_amount || 0)}</span>
      </div>
    </div>
  );

  const renderLiabilityCard = (liability: any) => (
    <div 
      key={liability.id}
      className="p-4 rounded-2xl mb-3 cursor-pointer transition-all duration-200 hover:scale-105"
      style={{
        backgroundColor: 'var(--background-secondary)',
        boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
      }}
      onClick={() => navigate(`/liabilities/${liability.id}`)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-lg" style={{ color: 'var(--text-primary)' }}>
          {liability.name || 'Untitled Liability'}
        </h3>
        <span className="text-sm font-body px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--warning)', color: 'white' }}>
          {Math.round(getLiabilityProgress(liability))}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
        <div
          className="h-3 rounded-full transition-all duration-300"
          style={{
            backgroundColor: 'var(--warning)',
            width: `${getLiabilityProgress(liability)}%`
          }}
        />
      </div>
      
      <div className="flex items-center justify-between text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
        <span>Paid: {formatCurrency((liability.total_amount || 0) - (liability.remaining_amount || 0))}</span>
        <span>Total: {formatCurrency(liability.total_amount || 0)}</span>
      </div>
    </div>
  );

  const renderBillCard = (bill: any) => {
    const daysUntilDue = getDaysUntilDue(bill.due_date);
    const isOverdue = daysUntilDue < 0;
    const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;
    
    return (
      <div 
        key={bill.id}
        className="p-4 rounded-2xl mb-3 cursor-pointer transition-all duration-200 hover:scale-105"
        style={{
          backgroundColor: 'var(--background-secondary)',
          boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
        }}
        onClick={() => navigate(`/bills/${bill.id}`)}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-lg" style={{ color: 'var(--text-primary)' }}>
            {bill.name || 'Untitled Bill'}
          </h3>
          <div className="flex items-center space-x-2">
            {isOverdue && <AlertCircle size={16} style={{ color: 'var(--error)' }} />}
            {isDueSoon && !isOverdue && <AlertCircle size={16} style={{ color: 'var(--warning)' }} />}
            <span 
              className="text-sm font-body px-2 py-1 rounded-full"
              style={{ 
                backgroundColor: isOverdue ? 'var(--error)' : isDueSoon ? 'var(--warning)' : 'var(--success)', 
                color: 'white' 
              }}
            >
              {isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : `${daysUntilDue}d`}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
          <span>{formatCurrency(bill.amount || 0)}</span>
          <span>{format(new Date(bill.due_date), 'MMM dd, yyyy')}</span>
        </div>
      </div>
    );
  };

  const renderCardContent = () => {
    if (currentCard.items.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--background)' }}>
            <currentCard.icon size={32} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h3 className="text-lg font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
            {currentCard.emptyMessage}
          </h3>
          <button
            onClick={currentCard.emptyAction}
            className="px-6 py-3 rounded-full text-white font-medium transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: currentCard.color }}
          >
            {currentCard.emptyActionText}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {currentCard.items.map((item: any) => {
          switch (currentCard.type) {
            case 'goals':
              return renderGoalCard(item);
            case 'budgets':
              return renderBudgetCard(item);
            case 'liabilities':
              return renderLiabilityCard(item);
            case 'bills':
              return renderBillCard(item);
            default:
              return null;
          }
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--background)' }} ref={elementRef}>
      {/* Header */}
      <div className="pt-12 pb-6 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading" style={{ color: 'var(--text-primary)' }}>Financial Cards</h1>
          <button
            onClick={() => navigate('/add-transaction')}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Card Navigation */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={prevCard}
            className="p-2 rounded-full transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: 'var(--background-secondary)' }}
          >
            <ChevronLeft size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
          
          <div className="flex items-center space-x-2">
            {cardData.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentCardIndex ? 'scale-125' : ''
                }`}
                style={{ 
                  backgroundColor: index === currentCardIndex ? currentCard.color : 'var(--text-tertiary)' 
                }}
              />
            ))}
          </div>
          
          <button
            onClick={nextCard}
            className="p-2 rounded-full transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: 'var(--background-secondary)' }}
          >
            <ChevronRight size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      {/* Current Card */}
      <div className="px-6">
        <div 
          className="p-6 rounded-3xl mb-6"
          style={{
            backgroundColor: 'var(--background-secondary)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: currentCard.color }}
            >
              <currentCard.icon size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-heading" style={{ color: 'var(--text-primary)' }}>
                {currentCard.title}
              </h2>
              <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                {currentCard.items.length} {currentCard.items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          
          {renderCardContent()}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6">
        <h3 className="text-lg font-heading mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/goals')}
            className="p-4 rounded-2xl text-center transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <Target size={24} style={{ color: 'var(--primary)' }} className="mx-auto mb-2" />
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>All Goals</p>
          </button>
          
          <button
            onClick={() => navigate('/budgets')}
            className="p-4 rounded-2xl text-center transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <PieChart size={24} style={{ color: 'var(--success)' }} className="mx-auto mb-2" />
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>All Budgets</p>
          </button>
          
          <button
            onClick={() => navigate('/liabilities')}
            className="p-4 rounded-2xl text-center transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <CreditCard size={24} style={{ color: 'var(--warning)' }} className="mx-auto mb-2" />
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>All Liabilities</p>
          </button>
          
          <button
            onClick={() => navigate('/bills')}
            className="p-4 rounded-2xl text-center transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <Receipt size={24} style={{ color: 'var(--error)' }} className="mx-auto mb-2" />
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>All Bills</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cards;
