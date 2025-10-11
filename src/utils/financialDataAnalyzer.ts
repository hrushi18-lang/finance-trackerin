import { FinancialAccount, Transaction, Goal, Budget, Bill, EnhancedLiability } from '../types';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, differenceInDays, addMonths } from 'date-fns';

/**
 * Advanced Financial Data Analyzer
 * Provides deep analysis, predictions, and insights from user's financial data
 */
export class FinancialDataAnalyzer {
  
  /**
   * Analyze spending trends over time
   */
  analyzeSpendingTrends(transactions: Transaction[], months: number = 6) {
    const trends: Record<string, { month: string; amount: number }[]> = {};
    
    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthTransactions = transactions.filter(t => 
        t.type === 'expense' &&
        isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
      );
      
      monthTransactions.forEach(t => {
        if (!trends[t.category]) {
          trends[t.category] = [];
        }
        const existing = trends[t.category].find(m => m.month === monthStart.toISOString());
        if (existing) {
          existing.amount += t.amount;
        } else {
          trends[t.category].push({
            month: monthStart.toISOString(),
            amount: t.amount
          });
        }
      });
    }
    
    return trends;
  }

  /**
   * Predict future spending based on historical data
   */
  predictFutureSpending(transactions: Transaction[], category?: string): {
    nextMonth: number;
    next3Months: number;
    confidence: number;
  } {
    const last3Months = transactions.filter(t => {
      const threeMonthsAgo = subMonths(new Date(), 3);
      return t.type === 'expense' && 
             new Date(t.date) >= threeMonthsAgo &&
             (!category || t.category === category);
    });

    const monthlyAverage = last3Months.reduce((sum, t) => sum + t.amount, 0) / 3;
    
    // Calculate variance for confidence
    const amounts = last3Months.map(t => t.amount);
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - monthlyAverage, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.max(0, Math.min(100, 100 - (stdDev / monthlyAverage * 100)));

    return {
      nextMonth: monthlyAverage,
      next3Months: monthlyAverage * 3,
      confidence: Math.round(confidence)
    };
  }

  /**
   * Analyze cash flow patterns
   */
  analyzeCashFlow(transactions: Transaction[], months: number = 3) {
    const cashFlow: {
      month: string;
      income: number;
      expenses: number;
      netFlow: number;
    }[] = [];

    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthTransactions = transactions.filter(t =>
        isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
      );
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      cashFlow.push({
        month: monthStart.toISOString(),
        income,
        expenses,
        netFlow: income - expenses
      });
    }

    return cashFlow;
  }

  /**
   * Calculate savings rate
   */
  calculateSavingsRate(transactions: Transaction[], months: number = 3): number {
    const recentTransactions = transactions.filter(t => {
      const cutoff = subMonths(new Date(), months);
      return new Date(t.date) >= cutoff;
    });

    const totalIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  }

  /**
   * Identify unusual spending patterns (anomalies)
   */
  identifyAnomalies(transactions: Transaction[]): Transaction[] {
    const last30Days = transactions.filter(t => {
      const thirtyDaysAgo = subMonths(new Date(), 1);
      return new Date(t.date) >= thirtyDaysAgo && t.type === 'expense';
    });

    // Group by category and calculate average
    const categoryAverages: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    last30Days.forEach(t => {
      categoryAverages[t.category] = (categoryAverages[t.category] || 0) + t.amount;
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    Object.keys(categoryAverages).forEach(cat => {
      categoryAverages[cat] = categoryAverages[cat] / categoryCounts[cat];
    });

    // Find transactions that are 2x or more than category average
    return last30Days.filter(t => 
      t.amount >= (categoryAverages[t.category] || 0) * 2
    );
  }

  /**
   * Calculate goal achievement predictions
   */
  predictGoalAchievement(goal: Goal, transactions: Transaction[]): {
    projectedCompletionDate: Date;
    monthlyContributionNeeded: number;
    onTrack: boolean;
    projectedAmount: number;
  } {
    const targetDate = new Date(goal.targetDate);
    const daysRemaining = differenceInDays(targetDate, new Date());
    const monthsRemaining = Math.max(1, daysRemaining / 30);
    
    // Calculate average monthly contributions
    const goalTransactions = transactions.filter(t => 
      t.goalId === goal.id || 
      (t.category === goal.category && t.type === 'income')
    );
    
    const averageMonthlyContribution = goalTransactions.length > 0
      ? goalTransactions.reduce((sum, t) => sum + t.amount, 0) / 3 // Last 3 months average
      : 0;

    const remaining = goal.targetAmount - goal.currentAmount;
    const monthlyNeeded = remaining / monthsRemaining;
    
    const projectedAmount = goal.currentAmount + (averageMonthlyContribution * monthsRemaining);
    const onTrack = projectedAmount >= goal.targetAmount;
    
    const projectedMonths = averageMonthlyContribution > 0
      ? remaining / averageMonthlyContribution
      : monthsRemaining * 2;
    
    const projectedCompletionDate = addMonths(new Date(), projectedMonths);

    return {
      projectedCompletionDate,
      monthlyContributionNeeded: Math.max(0, monthlyNeeded),
      onTrack,
      projectedAmount
    };
  }

  /**
   * Analyze budget health
   */
  analyzeBudgetHealth(budgets: Budget[], transactions: Transaction[]): {
    category: string;
    budget: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    status: 'healthy' | 'warning' | 'critical' | 'exceeded';
    projectedOverage?: number;
  }[] {
    const currentMonth = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = differenceInDays(monthEnd, monthStart);
    const daysPassed = differenceInDays(new Date(), monthStart);

    return budgets.map(budget => {
      const spent = transactions
        .filter(t => 
          t.type === 'expense' &&
          t.category === budget.category &&
          isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const remaining = budget.amount - spent;
      const percentUsed = (spent / budget.amount) * 100;
      
      // Project spending for rest of month
      const dailyRate = daysPassed > 0 ? spent / daysPassed : 0;
      const projectedTotal = dailyRate * daysInMonth;
      const projectedOverage = projectedTotal > budget.amount ? projectedTotal - budget.amount : 0;

      let status: 'healthy' | 'warning' | 'critical' | 'exceeded';
      if (percentUsed >= 100) status = 'exceeded';
      else if (percentUsed >= 90) status = 'critical';
      else if (percentUsed >= 75) status = 'warning';
      else status = 'healthy';

      return {
        category: budget.category,
        budget: budget.amount,
        spent,
        remaining,
        percentUsed: Math.round(percentUsed),
        status,
        projectedOverage: projectedOverage > 0 ? projectedOverage : undefined
      };
    });
  }

  /**
   * Analyze debt payoff timeline
   */
  analyzeDebtPayoff(liabilities: EnhancedLiability[]): {
    liability: EnhancedLiability;
    monthsToPayoff: number;
    totalInterestPaid: number;
    recommendedPayment: number;
    payoffDate: Date;
  }[] {
    return liabilities.map(liability => {
      const remaining = liability.remainingAmount || 0;
      const monthlyPayment = liability.monthlyPayment || 0;
      const interestRate = (liability.interestRate || 0) / 100 / 12; // Monthly rate

      if (monthlyPayment === 0 || remaining === 0) {
        return {
          liability,
          monthsToPayoff: 0,
          totalInterestPaid: 0,
          recommendedPayment: 0,
          payoffDate: new Date()
        };
      }

      // Calculate months to payoff with current payment
      let balance = remaining;
      let months = 0;
      let totalInterest = 0;

      while (balance > 0 && months < 360) { // Max 30 years
        const interestCharge = balance * interestRate;
        const principalPayment = monthlyPayment - interestCharge;
        
        if (principalPayment <= 0) break; // Payment too low
        
        totalInterest += interestCharge;
        balance -= principalPayment;
        months++;
      }

      // Recommend 10% higher payment to reduce interest
      const recommendedPayment = monthlyPayment * 1.1;

      return {
        liability,
        monthsToPayoff: months,
        totalInterestPaid: totalInterest,
        recommendedPayment,
        payoffDate: addMonths(new Date(), months)
      };
    });
  }

  /**
   * Calculate financial health score
   */
  calculateFinancialHealth(
    accounts: FinancialAccount[],
    transactions: Transaction[],
    liabilities: EnhancedLiability[],
    budgets: Budget[],
    goals: Goal[]
  ): {
    overallScore: number;
    components: {
      liquidityScore: number;
      savingsScore: number;
      debtScore: number;
      budgetScore: number;
      goalScore: number;
    };
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    // 1. Liquidity Score (20%)
    const totalLiquid = accounts
      .filter(a => ['bank_savings', 'bank_current', 'cash', 'digital_wallet'].includes(a.type))
      .reduce((sum, a) => sum + (a.balance || 0), 0);
    
    const monthlyExpenses = this.predictFutureSpending(transactions).nextMonth;
    const monthsCovered = monthlyExpenses > 0 ? totalLiquid / monthlyExpenses : 0;
    
    let liquidityScore = Math.min(100, (monthsCovered / 6) * 100); // 6 months ideal
    if (monthsCovered < 3) {
      recommendations.push("Build emergency fund to cover 3-6 months of expenses");
      liquidityScore = Math.max(0, liquidityScore);
    }

    // 2. Savings Score (20%)
    const savingsRate = this.calculateSavingsRate(transactions, 3);
    let savingsScore = Math.min(100, (savingsRate / 20) * 100); // 20% ideal
    if (savingsRate < 10) {
      recommendations.push("Increase savings rate to at least 10% of income");
    }

    // 3. Debt Score (25%)
    const totalDebt = liabilities.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);
    const totalAssets = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
    const debtToAssetRatio = totalAssets > 0 ? totalDebt / totalAssets : 1;
    
    let debtScore = Math.max(0, 100 - (debtToAssetRatio * 100));
    if (debtToAssetRatio > 0.3) {
      recommendations.push("Work on reducing debt-to-asset ratio below 30%");
    }

    // 4. Budget Score (20%)
    const budgetHealth = this.analyzeBudgetHealth(budgets, transactions);
    const healthyBudgets = budgetHealth.filter(b => b.status === 'healthy').length;
    let budgetScore = budgets.length > 0 ? (healthyBudgets / budgets.length) * 100 : 50;
    const exceededBudgets = budgetHealth.filter(b => b.status === 'exceeded' || b.status === 'critical');
    if (exceededBudgets.length > 0) {
      recommendations.push(`Review ${exceededBudgets.length} budget(s) that are over or near limit`);
    }

    // 5. Goal Score (15%)
    const activeGoals = goals.filter(g => g.status === 'active');
    const onTrackGoals = activeGoals.filter(g => {
      const progress = (g.currentAmount / g.targetAmount) * 100;
      return progress >= 50; // At least halfway
    });
    let goalScore = activeGoals.length > 0 ? (onTrackGoals.length / activeGoals.length) * 100 : 50;
    if (activeGoals.length === 0) {
      recommendations.push("Set financial goals to track progress");
    }

    // Calculate weighted overall score
    const overallScore = Math.round(
      liquidityScore * 0.20 +
      savingsScore * 0.20 +
      debtScore * 0.25 +
      budgetScore * 0.20 +
      goalScore * 0.15
    );

    return {
      overallScore,
      components: {
        liquidityScore: Math.round(liquidityScore),
        savingsScore: Math.round(savingsScore),
        debtScore: Math.round(debtScore),
        budgetScore: Math.round(budgetScore),
        goalScore: Math.round(goalScore)
      },
      recommendations
    };
  }

  /**
   * Identify top spending categories
   */
  getTopSpendingCategories(transactions: Transaction[], limit: number = 5): {
    category: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }[] {
    const last30Days = transactions.filter(t => {
      const thirtyDaysAgo = subMonths(new Date(), 1);
      return new Date(t.date) >= thirtyDaysAgo && t.type === 'expense';
    });

    const categoryTotals: Record<string, { amount: number; count: number }> = {};
    let totalSpending = 0;

    last30Days.forEach(t => {
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = { amount: 0, count: 0 };
      }
      categoryTotals[t.category].amount += t.amount;
      categoryTotals[t.category].count += 1;
      totalSpending += t.amount;
    });

    return Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: Math.round((data.amount / totalSpending) * 100),
        transactionCount: data.count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }

  /**
   * Generate comprehensive financial report
   */
  generateComprehensiveReport(
    accounts: FinancialAccount[],
    transactions: Transaction[],
    goals: Goal[],
    budgets: Budget[],
    bills: Bill[],
    liabilities: EnhancedLiability[]
  ) {
    return {
      health: this.calculateFinancialHealth(accounts, transactions, liabilities, budgets, goals),
      cashFlow: this.analyzeCashFlow(transactions, 3),
      spendingTrends: this.analyzeSpendingTrends(transactions, 6),
      predictions: this.predictFutureSpending(transactions),
      anomalies: this.identifyAnomalies(transactions),
      topSpending: this.getTopSpendingCategories(transactions, 5),
      budgetHealth: this.analyzeBudgetHealth(budgets, transactions),
      debtAnalysis: this.analyzeDebtPayoff(liabilities),
      goalProjections: goals.map(g => ({
        goal: g,
        ...this.predictGoalAchievement(g, transactions)
      }))
    };
  }
}

export const financialDataAnalyzer = new FinancialDataAnalyzer();

