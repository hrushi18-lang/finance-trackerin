// Notification service to handle financial notifications
// This service can be called from anywhere in the app without context dependencies

interface NotificationContextType {
  sendGoalProgressUpdate: (goalTitle: string, currentAmount: number, targetAmount: number) => void;
  sendSpendingAlert: (message: string, amount: number, category: string) => void;
  sendBudgetWarning: (budgetCategory: string, spent: number, limit: number) => void;
  sendBillReminder: (billTitle: string, dueDate: Date, amount: number) => void;
  generateFinancialInsights: (financialData: Record<string, unknown>) => void;
}

let notificationContext: NotificationContextType | null = null;

export const setNotificationContext = (context: NotificationContextType) => {
  notificationContext = context;
};

export const sendGoalProgressUpdate = (goalTitle: string, currentAmount: number, targetAmount: number) => {
  if (notificationContext?.sendGoalProgressUpdate) {
    notificationContext.sendGoalProgressUpdate(goalTitle, currentAmount, targetAmount);
  }
};

export const sendSpendingAlert = (message: string, amount: number, category: string) => {
  if (notificationContext?.sendSpendingAlert) {
    notificationContext.sendSpendingAlert(message, amount, category);
  }
};

export const sendBudgetWarning = (budgetCategory: string, spent: number, limit: number) => {
  if (notificationContext?.sendBudgetWarning) {
    notificationContext.sendBudgetWarning(budgetCategory, spent, limit);
  }
};

export const sendBillReminder = (billTitle: string, dueDate: Date, amount: number) => {
  if (notificationContext?.sendBillReminder) {
    notificationContext.sendBillReminder(billTitle, dueDate, amount);
  }
};

export const generateFinancialInsights = (financialData: Record<string, unknown>) => {
  if (notificationContext?.generateFinancialInsights) {
    notificationContext.generateFinancialInsights(financialData);
  }
};
