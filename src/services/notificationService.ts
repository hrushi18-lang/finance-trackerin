// Notification service to handle financial notifications
// This service can be called from anywhere in the app without context dependencies

let notificationContext: any = null;

export const setNotificationContext = (context: any) => {
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

export const generateFinancialInsights = (financialData: any) => {
  if (notificationContext?.generateFinancialInsights) {
    notificationContext.generateFinancialInsights(financialData);
  }
};
