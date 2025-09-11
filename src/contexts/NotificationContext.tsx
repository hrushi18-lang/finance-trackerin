import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setNotificationContext } from '../services/notificationService';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'tip' | 'achievement' | 'alert';
  title: string;
  message: string;
  actionText?: string;
  actionCallback?: () => void;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'spending' | 'saving' | 'budget' | 'goal' | 'bill' | 'liability' | 'education' | 'system';
  timestamp: Date;
  read: boolean;
  persistent: boolean;
  autoHide?: number; // milliseconds
  icon?: string;
  color?: string;
}

export interface FinancialInsight {
  id: string;
  type: 'spending_analysis' | 'saving_trend' | 'budget_health' | 'goal_progress' | 'risk_alert' | 'opportunity';
  title: string;
  description: string;
  data: any;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'spending' | 'saving' | 'budget' | 'goal' | 'bill' | 'liability' | 'education';
}

interface NotificationContextType {
  notifications: Notification[];
  insights: FinancialInsight[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  addInsight: (insight: Omit<FinancialInsight, 'id'>) => void;
  removeInsight: (id: string) => void;
  generateFinancialInsights: (financialData: any) => void;
  showFinancialSnapshot: () => void;
  sendSpendingAlert: (message: string, amount: number, category: string) => void;
  sendGoalProgressUpdate: (goalTitle: string, currentAmount: number, targetAmount: number) => void;
  sendBudgetWarning: (budgetCategory: string, spent: number, limit: number) => void;
  sendBillReminder: (billTitle: string, dueDate: Date, amount: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const financialTips = [
  "💡 Tip: Setting aside 20% of your income for savings is a great rule of thumb",
  "📊 Insight: You're spending 15% more on dining out this month compared to last month",
  "🎯 Achievement: You've reached 50% of your emergency fund goal!",
  "⚠️ Alert: Your grocery spending is approaching your monthly budget limit",
  "💰 Opportunity: You could save $200/month by refinancing your loan",
  "📈 Trend: Your net worth has increased by 12% this quarter",
  "🔔 Reminder: You have 3 bills due in the next 7 days",
  "💸 Warning: You're on track to exceed your entertainment budget by $150",
  "🏆 Milestone: You've successfully stayed within budget for 3 consecutive months",
  "📚 Learn: Compound interest can double your money in 7 years at 10% return"
];

const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-hide if specified
    if (notification.autoHide) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, notification.autoHide);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addInsight = useCallback((insight: Omit<FinancialInsight, 'id'>) => {
    const newInsight: FinancialInsight = {
      ...insight,
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    setInsights(prev => [newInsight, ...prev.slice(0, 9)]); // Keep only 10 recent insights
  }, []);

  const removeInsight = useCallback((id: string) => {
    setInsights(prev => prev.filter(insight => insight.id !== id));
  }, []);

  const generateFinancialInsights = useCallback((financialData: any) => {
    if (!financialData) return;

    // Analyze spending patterns
    if (financialData.transactions) {
      const monthlySpending = financialData.transactions
        .filter((t: any) => t.type === 'expense' && t.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

      const spendingByCategory = financialData.transactions
        .filter((t: any) => t.type === 'expense' && t.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((acc: any, t: any) => {
          acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
          return acc;
        }, {});

      // Top spending category
      const topCategory = Object.entries(spendingByCategory)
        .reduce((max: any, [category, amount]) => 
          amount > max.amount ? { category, amount } : max, { category: '', amount: 0 });

      if (topCategory.amount > 0) {
        addInsight({
          type: 'spending_analysis',
          title: 'Top Spending Category',
          description: `You've spent ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(topCategory.amount)} on ${topCategory.category} this month`,
          data: { category: topCategory.category, amount: topCategory.amount, monthlyTotal: monthlySpending },
          actionable: true,
          priority: 'medium',
          category: 'spending'
        });
      }
    }

    // Analyze goal progress
    if (financialData.goals) {
      financialData.goals.forEach((goal: any) => {
        const progress = (goal.currentAmount || 0) / (goal.targetAmount || 1) * 100;
        
        if (progress >= 25 && progress < 50) {
          addInsight({
            type: 'goal_progress',
            title: 'Goal Progress Update',
            description: `You're ${progress.toFixed(0)}% towards your "${goal.title}" goal`,
            data: { goal, progress },
            actionable: true,
            priority: 'low',
            category: 'goal'
          });
        } else if (progress >= 50 && progress < 75) {
          addInsight({
            type: 'goal_progress',
            title: 'Goal Milestone',
            description: `🎉 You're halfway to your "${goal.title}" goal (${progress.toFixed(0)}%)`,
            data: { goal, progress },
            actionable: true,
            priority: 'medium',
            category: 'goal'
          });
        }
      });
    }

    // Analyze budget health
    if (financialData.budgets) {
      financialData.budgets.forEach((budget: any) => {
        const spentPercentage = (budget.spent || 0) / (budget.amount || 1) * 100;
        
        if (spentPercentage >= 80 && spentPercentage < 100) {
          addInsight({
            type: 'budget_health',
            title: 'Budget Warning',
            description: `You've used ${spentPercentage.toFixed(0)}% of your ${budget.category} budget`,
            data: { budget, spentPercentage },
            actionable: true,
            priority: 'high',
            category: 'budget'
          });
        }
      });
    }

    // Show random financial tip
    const randomTip = financialTips[Math.floor(Math.random() * financialTips.length)];
    addNotification({
      type: 'tip',
      title: 'Financial Tip',
      message: randomTip,
      priority: 'low',
      category: 'education',
      persistent: false,
      autoHide: 8000,
      icon: '🎓'
    });
  }, [addInsight, addNotification]);

  const showFinancialSnapshot = useCallback(() => {
    // This will be called with actual financial data
    addNotification({
      type: 'info',
      title: 'Financial Snapshot',
      message: `Loading your financial overview...`,
      priority: 'medium',
      category: 'system',
      persistent: true,
      icon: '📊'
    });
  }, [addNotification]);

  const sendSpendingAlert = useCallback((message: string, amount: number, category: string) => {
    addNotification({
      type: 'alert',
      title: 'Spending Alert',
      message: `${message} - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)} in ${category}`,
      priority: 'high',
      category: 'spending',
      persistent: true,
      icon: '⚠️',
      color: '#ff6b6b'
    });
  }, [addNotification]);

  const sendGoalProgressUpdate = useCallback((goalTitle: string, currentAmount: number, targetAmount: number) => {
    const progress = (currentAmount / targetAmount) * 100;
    addNotification({
      type: 'achievement',
      title: 'Goal Progress',
      message: `"${goalTitle}": ${progress.toFixed(0)}% complete (${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentAmount)} / ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(targetAmount)})`,
      priority: 'medium',
      category: 'goal',
      persistent: false,
      autoHide: 10000,
      icon: '🎯'
    });
  }, [addNotification]);

  const sendBudgetWarning = useCallback((budgetCategory: string, spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    addNotification({
      type: 'warning',
      title: 'Budget Alert',
      message: `You've used ${percentage.toFixed(0)}% of your ${budgetCategory} budget (${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(spent)} / ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(limit)})`,
      priority: percentage >= 90 ? 'urgent' : 'high',
      category: 'budget',
      persistent: true,
      icon: '💸',
      color: percentage >= 90 ? '#ff4757' : '#ffa502'
    });
  }, [addNotification]);

  const sendBillReminder = useCallback((billTitle: string, dueDate: Date, amount: number) => {
    const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    addNotification({
      type: 'alert',
      title: 'Bill Reminder',
      message: `"${billTitle}" due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}`,
      priority: daysUntilDue <= 1 ? 'urgent' : daysUntilDue <= 3 ? 'high' : 'medium',
      category: 'bill',
      persistent: daysUntilDue <= 1,
      icon: '📅',
      color: daysUntilDue <= 1 ? '#ff4757' : '#ffa502'
    });
  }, [addNotification]);

  const value: NotificationContextType = {
    notifications,
    insights,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    addInsight,
    removeInsight,
    generateFinancialInsights,
    showFinancialSnapshot,
    sendSpendingAlert,
    sendGoalProgressUpdate,
    sendBudgetWarning,
    sendBillReminder,
  };

  // Register the context with the notification service
  useEffect(() => {
    setNotificationContext(value);
  }, [value]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
