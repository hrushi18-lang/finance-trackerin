import { Transaction, FinancialAccount, Goal, Bill, Liability, Budget, UserCategory, FinancialHealthScore } from '../types';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';

export interface CategoryAnalytics {
  category: string;
  totalAmount: number;
  percentage: number;
  transactionCount: number;
  type: 'income' | 'expense';
  currency: string;
  averageAmount: number;
  trend: 'up' | 'down' | 'stable';
  monthlyTrend: Array<{ month: string; amount: number }>;
}

export interface GoalAnalytics {
  goalId: string;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  progressPercentage: number;
  contributionsByAccount: Array<{ accountId: string; accountName: string; amount: number; currency: string }>;
  contributionsByCategory: Array<{ category: string; amount: number; percentage: number }>;
  predictedCompletionDate: Date | null;
  crossCurrencyContributions: Array<{ originalAmount: number; originalCurrency: string; convertedAmount: number; convertedCurrency: string }>;
}

export interface BillAnalytics {
  billId: string;
  billName: string;
  amount: number;
  currency: string;
  status: 'upcoming' | 'paid' | 'overdue' | 'moved' | 'failed';
  dueDate: Date;
  assignedAccount: string;
  paymentHistory: Array<{ date: Date; amount: number; status: string }>;
  monthlyTrend: Array<{ month: string; amount: number; status: string }>;
}

export interface LiabilityAnalytics {
  liabilityId: string;
  liabilityName: string;
  outstandingBalance: number;
  originalAmount: number;
  currency: string;
  nextEMI: number;
  nextEMIDate: Date;
  repaymentTrend: Array<{ month: string; principal: number; interest: number; total: number; remaining: number }>;
  interestPaid: number;
  principalPaid: number;
  completionPercentage: number;
}

export interface BudgetAnalytics {
  budgetId: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  progressPercentage: number;
  status: 'safe' | 'warning' | 'exceeded';
  monthlyTrend: Array<{ month: string; limit: number; spent: number; remaining: number }>;
  dailyAverage: number;
  projectedMonthlySpend: number;
}

export interface AccountAnalytics {
  accountId: string;
  accountName: string;
  balance: number;
  currency: string;
  transactionCount: number;
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  monthlyTrend: Array<{ month: string; income: number; expenses: number; net: number; balance: number }>;
  largestTransactions: Array<{ id: string; amount: number; description: string; date: Date; category: string }>;
  averageTransactionAmount: number;
}

export interface CalendarEvent {
  id: string;
  type: 'income' | 'expense' | 'goal_contribution' | 'bill' | 'liability_payment';
  title: string;
  amount: number;
  currency: string;
  date: Date;
  accountId?: string;
  category?: string;
  goalId?: string;
  billId?: string;
  liabilityId?: string;
  status?: string;
  color: 'green' | 'red' | 'blue' | 'orange' | 'purple';
}

export class AnalyticsEngine {
  private transactions: Transaction[];
  private accounts: FinancialAccount[];
  private goals: Goal[];
  private bills: Bill[];
  private liabilities: Liability[];
  private budgets: Budget[];
  private categories: UserCategory[];

  constructor(
    transactions: Transaction[],
    accounts: FinancialAccount[],
    goals: Goal[],
    bills: Bill[],
    liabilities: Liability[],
    budgets: Budget[],
    categories: UserCategory[]
  ) {
    this.transactions = transactions;
    this.accounts = accounts;
    this.goals = goals;
    this.bills = bills;
    this.liabilities = liabilities;
    this.budgets = budgets;
    this.categories = categories;
  }

  // Category-Based Analytics
  getCategoryAnalytics(
    startDate: Date,
    endDate: Date,
    accountId?: string,
    currency?: string
  ): CategoryAnalytics[] {
    const filteredTransactions = this.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const inDateRange = transactionDate >= startDate && transactionDate <= endDate;
      const matchesAccount = !accountId || t.accountId === accountId;
      const matchesCurrency = !currency || t.currencyCode === currency;
      return inDateRange && matchesAccount && matchesCurrency;
    });

    const categoryMap = new Map<string, {
      totalAmount: number;
      transactionCount: number;
      type: 'income' | 'expense';
      currency: string;
      monthlyData: Map<string, number>;
    }>();

    filteredTransactions.forEach(t => {
      const category = t.category || 'Other';
      const month = new Date(t.date).toISOString().substring(0, 7);
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          totalAmount: 0,
          transactionCount: 0,
          type: t.type as 'income' | 'expense',
          currency: t.currencyCode,
          monthlyData: new Map()
        });
      }

      const categoryData = categoryMap.get(category)!;
      categoryData.totalAmount += t.amount;
      categoryData.transactionCount += 1;
      
      const currentMonthAmount = categoryData.monthlyData.get(month) || 0;
      categoryData.monthlyData.set(month, currentMonthAmount + t.amount);
    });

    const totalAmount = Array.from(categoryMap.values()).reduce((sum, data) => sum + data.totalAmount, 0);

    return Array.from(categoryMap.entries()).map(([category, data]) => {
      const percentage = totalAmount > 0 ? (data.totalAmount / totalAmount) * 100 : 0;
      const averageAmount = data.transactionCount > 0 ? data.totalAmount / data.transactionCount : 0;
      
      // Calculate trend (simplified - compare last 2 months)
      const monthlyTrend = Array.from(data.monthlyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount }));
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (monthlyTrend.length >= 2) {
        const lastMonth = monthlyTrend[monthlyTrend.length - 1].amount;
        const prevMonth = monthlyTrend[monthlyTrend.length - 2].amount;
        if (lastMonth > prevMonth * 1.1) trend = 'up';
        else if (lastMonth < prevMonth * 0.9) trend = 'down';
      }

      return {
        category,
        totalAmount: data.totalAmount,
        percentage,
        transactionCount: data.transactionCount,
        type: data.type,
        currency: data.currency,
        averageAmount,
        trend,
        monthlyTrend
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);
  }

  // Goal Analytics
  getGoalAnalytics(goalId?: string): GoalAnalytics[] {
    const targetGoals = goalId ? this.goals.filter(g => g.id === goalId) : this.goals;
    
    return targetGoals.map(goal => {
      const goalTransactions = this.transactions.filter(t => 
        t.linkedGoalId === goal.id || 
        (t.type === 'expense' && t.description?.toLowerCase().includes(goal.name.toLowerCase()))
      );

      const contributionsByAccount = new Map<string, { accountName: string; amount: number; currency: string }>();
      const contributionsByCategory = new Map<string, number>();
      const crossCurrencyContributions: Array<{ originalAmount: number; originalCurrency: string; convertedAmount: number; convertedCurrency: string }> = [];

      goalTransactions.forEach(t => {
        const account = this.accounts.find(a => a.id === t.accountId);
        if (account) {
          const existing = contributionsByAccount.get(t.accountId) || { accountName: account.name, amount: 0, currency: account.currency };
          existing.amount += t.amount;
          contributionsByAccount.set(t.accountId, existing);

          // Track cross-currency contributions
          if (t.currencyCode !== goal.currencyCode) {
            crossCurrencyContributions.push({
              originalAmount: t.originalAmount || t.amount,
              originalCurrency: t.originalCurrency || t.currencyCode,
              convertedAmount: t.amount,
              convertedCurrency: t.currencyCode
            });
          }
        }

        const category = t.category || 'Other';
        contributionsByCategory.set(category, (contributionsByCategory.get(category) || 0) + t.amount);
      });

      const totalContributions = Array.from(contributionsByCategory.values()).reduce((sum, amount) => sum + amount, 0);
      const progressPercentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

      // Predict completion date (simplified calculation)
      let predictedCompletionDate: Date | null = null;
      if (progressPercentage < 100 && goal.targetDate) {
        const remainingAmount = goal.targetAmount - goal.currentAmount;
        const monthlyContribution = totalContributions / Math.max(1, goalTransactions.length);
        if (monthlyContribution > 0) {
          const monthsRemaining = remainingAmount / monthlyContribution;
          predictedCompletionDate = new Date();
          predictedCompletionDate.setMonth(predictedCompletionDate.getMonth() + monthsRemaining);
        }
      }

      return {
        goalId: goal.id,
        goalName: goal.name,
        currentAmount: goal.currentAmount,
        targetAmount: goal.targetAmount,
        progressPercentage,
        contributionsByAccount: Array.from(contributionsByAccount.entries()).map(([accountId, data]) => ({
          accountId,
          accountName: data.accountName,
          amount: data.amount,
          currency: data.currency
        })),
        contributionsByCategory: Array.from(contributionsByCategory.entries()).map(([category, amount]) => ({
          category,
          amount,
          percentage: totalContributions > 0 ? (amount / totalContributions) * 100 : 0
        })),
        predictedCompletionDate,
        crossCurrencyContributions
      };
    });
  }

  // Bill Analytics
  getBillAnalytics(startDate: Date, endDate: Date): BillAnalytics[] {
    return this.bills.map(bill => {
      const billTransactions = this.transactions.filter(t => 
        t.linkedBillId === bill.id &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= endDate
      );

      const paymentHistory = billTransactions.map(t => ({
        date: new Date(t.date),
        amount: t.amount,
        status: t.status || 'completed'
      }));

      // Calculate monthly trend
      const monthlyData = new Map<string, { amount: number; status: string }>();
      billTransactions.forEach(t => {
        const month = new Date(t.date).toISOString().substring(0, 7);
        const existing = monthlyData.get(month) || { amount: 0, status: 'paid' };
        existing.amount += t.amount;
        monthlyData.set(month, existing);
      });

      const monthlyTrend = Array.from(monthlyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({ month, ...data }));

      // Determine status
      const now = new Date();
      const dueDate = new Date(bill.dueDate);
      let status: 'upcoming' | 'paid' | 'overdue' | 'moved' | 'failed' = 'upcoming';
      
      if (billTransactions.length > 0) {
        const lastPayment = billTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        status = lastPayment.status === 'completed' ? 'paid' : 
                lastPayment.status === 'failed' ? 'failed' : 'moved';
      } else if (dueDate < now) {
        status = 'overdue';
      }

      return {
        billId: bill.id,
        billName: bill.name,
        amount: bill.amount,
        currency: bill.currencyCode,
        status,
        dueDate,
        assignedAccount: bill.assignedAccount || '',
        paymentHistory,
        monthlyTrend
      };
    });
  }

  // Liability Analytics
  getLiabilityAnalytics(startDate: Date, endDate: Date): LiabilityAnalytics[] {
    return this.liabilities.map(liability => {
      const liabilityTransactions = this.transactions.filter(t => 
        t.linkedLiabilityId === liability.id &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= endDate
      );

      // Calculate repayment trend
      const monthlyData = new Map<string, { principal: number; interest: number; total: number; remaining: number }>();
      let runningBalance = liability.originalAmount;
      let totalInterestPaid = 0;
      let totalPrincipalPaid = 0;

      liabilityTransactions.forEach(t => {
        const month = new Date(t.date).toISOString().substring(0, 7);
        const existing = monthlyData.get(month) || { principal: 0, interest: 0, total: 0, remaining: runningBalance };
        
        // Simplified calculation - assume 70% principal, 30% interest
        const principal = t.amount * 0.7;
        const interest = t.amount * 0.3;
        
        existing.principal += principal;
        existing.interest += interest;
        existing.total += t.amount;
        existing.remaining = runningBalance - existing.principal;
        
        monthlyData.set(month, existing);
        runningBalance -= principal;
        totalPrincipalPaid += principal;
        totalInterestPaid += interest;
      });

      const repaymentTrend = Array.from(monthlyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({ month, ...data }));

      const completionPercentage = liability.originalAmount > 0 ? 
        (totalPrincipalPaid / liability.originalAmount) * 100 : 0;

      // Calculate next EMI (simplified)
      const nextEMI = liability.monthlyPayment || (liability.originalAmount * 0.05); // 5% of original amount
      const nextEMIDate = new Date();
      nextEMIDate.setMonth(nextEMIDate.getMonth() + 1);

      return {
        liabilityId: liability.id,
        liabilityName: liability.name,
        outstandingBalance: liability.originalAmount - totalPrincipalPaid,
        originalAmount: liability.originalAmount,
        currency: liability.currencyCode,
        nextEMI,
        nextEMIDate,
        repaymentTrend,
        interestPaid: totalInterestPaid,
        principalPaid: totalPrincipalPaid,
        completionPercentage
      };
    });
  }

  // Budget Analytics
  getBudgetAnalytics(startDate: Date, endDate: Date): BudgetAnalytics[] {
    return this.budgets.map(budget => {
      const budgetTransactions = this.transactions.filter(t => 
        t.category === budget.category &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= endDate
      );

      const spent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.monthlyLimit - spent;
      const progressPercentage = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;

      let status: 'safe' | 'warning' | 'exceeded' = 'safe';
      if (progressPercentage >= 100) status = 'exceeded';
      else if (progressPercentage >= 80) status = 'warning';

      // Calculate monthly trend
      const monthlyData = new Map<string, { limit: number; spent: number; remaining: number }>();
      budgetTransactions.forEach(t => {
        const month = new Date(t.date).toISOString().substring(0, 7);
        const existing = monthlyData.get(month) || { limit: budget.monthlyLimit, spent: 0, remaining: budget.monthlyLimit };
        existing.spent += t.amount;
        existing.remaining = existing.limit - existing.spent;
        monthlyData.set(month, existing);
      });

      const monthlyTrend = Array.from(monthlyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({ month, ...data }));

      const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const dailyAverage = daysInPeriod > 0 ? spent / daysInPeriod : 0;
      const projectedMonthlySpend = dailyAverage * 30;

      return {
        budgetId: budget.id,
        category: budget.category,
        monthlyLimit: budget.monthlyLimit,
        spent,
        remaining,
        progressPercentage,
        status,
        monthlyTrend,
        dailyAverage,
        projectedMonthlySpend
      };
    });
  }

  // Account Analytics
  getAccountAnalytics(accountId: string, startDate: Date, endDate: Date): AccountAnalytics | null {
    const account = this.accounts.find(a => a.id === accountId);
    if (!account) return null;

    const accountTransactions = this.transactions.filter(t => 
      t.accountId === accountId &&
      new Date(t.date) >= startDate &&
      new Date(t.date) <= endDate
    );

    const totalIncome = accountTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = accountTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netFlow = totalIncome - totalExpenses;

    // Category breakdown
    const categoryMap = new Map<string, number>();
    accountTransactions.forEach(t => {
      const category = t.category || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + t.amount);
    });

    const totalCategoryAmount = Array.from(categoryMap.values()).reduce((sum, amount) => sum + amount, 0);
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalCategoryAmount > 0 ? (amount / totalCategoryAmount) * 100 : 0
    }));

    // Monthly trend
    const monthlyData = new Map<string, { income: number; expenses: number; net: number; balance: number }>();
    let runningBalance = account.balance;

    accountTransactions.forEach(t => {
      const month = new Date(t.date).toISOString().substring(0, 7);
      const existing = monthlyData.get(month) || { income: 0, expenses: 0, net: 0, balance: runningBalance };
      
      if (t.type === 'income') {
        existing.income += t.amount;
        runningBalance += t.amount;
      } else {
        existing.expenses += t.amount;
        runningBalance -= t.amount;
      }
      
      existing.net = existing.income - existing.expenses;
      existing.balance = runningBalance;
      monthlyData.set(month, existing);
    });

    const monthlyTrend = Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    // Largest transactions
    const largestTransactions = accountTransactions
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        amount: t.amount,
        description: t.description,
        date: new Date(t.date),
        category: t.category || 'Other'
      }));

    const averageTransactionAmount = accountTransactions.length > 0 ? 
      (totalIncome + totalExpenses) / accountTransactions.length : 0;

    return {
      accountId: account.id,
      accountName: account.name,
      balance: account.balance,
      currency: account.currency,
      transactionCount: accountTransactions.length,
      totalIncome,
      totalExpenses,
      netFlow,
      categoryBreakdown,
      monthlyTrend,
      largestTransactions,
      averageTransactionAmount
    };
  }

  // Calendar Events
  getCalendarEvents(startDate: Date, endDate: Date): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    // Transaction events
    this.transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      })
      .forEach(t => {
        const account = this.accounts.find(a => a.id === t.accountId);
        events.push({
          id: `transaction-${t.id}`,
          type: t.type as 'income' | 'expense',
          title: t.description,
          amount: t.amount,
          currency: t.currencyCode,
          date: new Date(t.date),
          accountId: t.accountId,
          category: t.category,
          goalId: t.linkedGoalId,
          color: t.type === 'income' ? 'green' : 'red'
        });
      });

    // Bill events
    this.bills
      .filter(b => {
        const dueDate = new Date(b.dueDate);
        return dueDate >= startDate && dueDate <= endDate;
      })
      .forEach(bill => {
        events.push({
          id: `bill-${bill.id}`,
          type: 'bill',
          title: bill.name,
          amount: bill.amount,
          currency: bill.currencyCode,
          date: new Date(bill.dueDate),
          billId: bill.id,
          status: 'upcoming',
          color: 'orange'
        });
      });

    // Goal contribution events (from transactions)
    this.transactions
      .filter(t => t.linkedGoalId && new Date(t.date) >= startDate && new Date(t.date) <= endDate)
      .forEach(t => {
        const goal = this.goals.find(g => g.id === t.linkedGoalId);
        if (goal) {
          events.push({
            id: `goal-${t.id}`,
            type: 'goal_contribution',
            title: `Goal: ${goal.name}`,
            amount: t.amount,
            currency: t.currencyCode,
            date: new Date(t.date),
            accountId: t.accountId,
            goalId: t.linkedGoalId,
            color: 'blue'
          });
        }
      });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Dashboard Summary
  getDashboardSummary(startDate: Date, endDate: Date, primaryCurrency: string = 'USD') {
    const periodTransactions = this.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const totalIncome = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    // Upcoming bills
    const upcomingBills = this.bills.filter(bill => {
      const dueDate = new Date(bill.dueDate);
      const now = new Date();
      return dueDate >= now && dueDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next 7 days
    });

    // Recent transactions
    const recentTransactions = periodTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Category breakdown for pie chart
    const categoryBreakdown = this.getCategoryAnalytics(startDate, endDate);

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      savingsRate,
      transactionCount: periodTransactions.length,
      upcomingBills,
      recentTransactions,
      categoryBreakdown: categoryBreakdown.slice(0, 6), // Top 6 categories
      totalAccounts: this.accounts.length,
      activeGoals: this.goals.filter(g => g.currentAmount < g.targetAmount).length,
      totalBudgets: this.budgets.length
    };
  }

  // 9. Financial Health Score Calculation
  getFinancialHealthScore(primaryCurrency: string = 'USD'): FinancialHealthScore {
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));
    const last3Months = startOfMonth(subMonths(now, 3));

    // 1. LIQUIDITY RATIO (25% weight)
    const liquidAssets = this.accounts
      .filter(acc => ['checking', 'savings', 'money_market'].includes(acc.type))
      .reduce((sum, acc) => sum + this.convertToTargetCurrency(acc.balance, acc.currency, primaryCurrency), 0);

    const monthlyExpenses = this.transactions
      .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: lastMonth, end: endOfMonth(lastMonth) }))
      .reduce((sum, t) => sum + this.convertToTargetCurrency(t.amount, t.currencyCode || primaryCurrency, primaryCurrency), 0);

    const liquidityRatio = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0;
    const liquidityScore = Math.min(100, Math.max(0, (liquidityRatio / 6) * 100)); // 6 months = 100%

    // 2. DEBT-TO-INCOME RATIO (20% weight)
    const monthlyIncome = this.transactions
      .filter(t => t.type === 'income' && isWithinInterval(new Date(t.date), { start: lastMonth, end: endOfMonth(lastMonth) }))
      .reduce((sum, t) => sum + this.convertToTargetCurrency(t.amount, t.currencyCode || primaryCurrency, primaryCurrency), 0);

    const totalDebt = this.liabilities
      .reduce((sum, l) => sum + this.convertToTargetCurrency(l.remainingAmount, l.currencyCode || primaryCurrency, primaryCurrency), 0);

    const debtToIncomeRatio = monthlyIncome > 0 ? totalDebt / (monthlyIncome * 12) : 0;
    const debtScore = Math.max(0, 100 - (debtToIncomeRatio * 100)); // Lower ratio = higher score

    // 3. SAVINGS RATE (20% weight)
    const netIncome = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (netIncome / monthlyIncome) * 100 : 0;
    const savingsScore = Math.min(100, Math.max(0, savingsRate * 2)); // 50% savings rate = 100 points

    // 4. EMERGENCY FUND COVERAGE (15% weight)
    const emergencyFundGoal = monthlyExpenses * 6; // 6 months of expenses
    const emergencyFundActual = this.goals
      .filter(g => g.category.toLowerCase().includes('emergency'))
      .reduce((sum, g) => sum + this.convertToTargetCurrency(g.currentAmount, g.currencyCode || primaryCurrency, primaryCurrency), 0);

    const emergencyFundRatio = emergencyFundGoal > 0 ? emergencyFundActual / emergencyFundGoal : 0;
    const emergencyScore = Math.min(100, emergencyFundRatio * 100);

    // 5. BILL PAYMENT HISTORY (10% weight)
    const totalBills = this.bills.length;
    const paidBills = this.bills.filter(b => b.isPaid).length;
    const overdueBills = this.bills.filter(b => {
      const dueDate = new Date(b.nextDueDate);
      return dueDate < now && !b.isPaid;
    }).length;

    const billPaymentRate = totalBills > 0 ? paidBills / totalBills : 1;
    const overduePenalty = overdueBills > 0 ? Math.min(50, overdueBills * 10) : 0;
    const billScore = Math.max(0, (billPaymentRate * 100) - overduePenalty);

    // 6. GOAL PROGRESS (10% weight)
    const totalGoals = this.goals.length;
    const completedGoals = this.goals.filter(g => g.currentAmount >= g.targetAmount).length;
    const goalProgress = totalGoals > 0 ? completedGoals / totalGoals : 1;
    const goalScore = goalProgress * 100;

    // Calculate weighted overall score
    const overallScore = Math.round(
      (liquidityScore * 0.25) +
      (debtScore * 0.20) +
      (savingsScore * 0.20) +
      (emergencyScore * 0.15) +
      (billScore * 0.10) +
      (goalScore * 0.10)
    );

    // Determine health status
    let healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    if (overallScore >= 90) healthStatus = 'excellent';
    else if (overallScore >= 75) healthStatus = 'good';
    else if (overallScore >= 60) healthStatus = 'fair';
    else if (overallScore >= 40) healthStatus = 'poor';
    else healthStatus = 'critical';

    // Generate recommendations
    const recommendations = this.generateFinancialRecommendations({
      liquidityScore,
      debtScore,
      savingsScore,
      emergencyScore,
      billScore,
      goalScore,
      liquidityRatio,
      debtToIncomeRatio,
      savingsRate,
      emergencyFundRatio,
      billPaymentRate
    });

    return {
      overallScore,
      healthStatus,
      components: {
        liquidity: { score: liquidityScore, ratio: liquidityRatio },
        debtToIncome: { score: debtScore, ratio: debtToIncomeRatio },
        savingsRate: { score: savingsScore, rate: savingsRate },
        emergencyFund: { score: emergencyScore, coverage: emergencyFundRatio },
        billPayment: { score: billScore, rate: billPaymentRate },
        goalProgress: { score: goalScore, progress: goalProgress }
      },
      recommendations,
      lastUpdated: now
    };
  }

  private generateFinancialRecommendations(metrics: {
    liquidityScore: number;
    debtScore: number;
    savingsScore: number;
    emergencyScore: number;
    billScore: number;
    goalScore: number;
    liquidityRatio: number;
    debtToIncomeRatio: number;
    savingsRate: number;
    emergencyFundRatio: number;
    billPaymentRate: number;
  }): string[] {
    const recommendations: string[] = [];

    // Liquidity recommendations
    if (metrics.liquidityScore < 60) {
      if (metrics.liquidityRatio < 3) {
        recommendations.push("Build emergency fund to cover at least 3-6 months of expenses");
      } else {
        recommendations.push("Consider increasing liquid savings for better financial security");
      }
    }

    // Debt recommendations
    if (metrics.debtScore < 60) {
      if (metrics.debtToIncomeRatio > 0.36) {
        recommendations.push("Focus on reducing debt - your debt-to-income ratio is too high");
      } else {
        recommendations.push("Consider debt consolidation or accelerated payment strategies");
      }
    }

    // Savings recommendations
    if (metrics.savingsScore < 50) {
      recommendations.push("Increase savings rate - aim for at least 20% of income");
    } else if (metrics.savingsScore < 80) {
      recommendations.push("Good savings rate! Consider increasing to 25-30% for better financial health");
    }

    // Emergency fund recommendations
    if (metrics.emergencyScore < 50) {
      recommendations.push("Build emergency fund to cover 6 months of expenses");
    } else if (metrics.emergencyScore < 80) {
      recommendations.push("Emergency fund is good, consider increasing to 8-12 months coverage");
    }

    // Bill payment recommendations
    if (metrics.billScore < 80) {
      recommendations.push("Improve bill payment consistency - set up automatic payments");
    }

    // Goal recommendations
    if (metrics.goalScore < 60) {
      recommendations.push("Focus on completing existing goals before starting new ones");
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push("Excellent financial health! Consider investing for long-term growth");
    }

    return recommendations;
  }
}
