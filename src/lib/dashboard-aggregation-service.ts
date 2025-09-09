import { exchangeRateService } from './exchange-rate-service';

export interface AccountData {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  isVisible: boolean;
}

export interface TransactionData {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency_code: string;
  date: string;
  exchange_rate_used?: number;
}

export interface GoalData {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  currency_code: string;
  status: string;
}

export interface LiabilityData {
  id: string;
  name: string;
  remaining_amount: number;
  currency_code: string;
  status: string;
}

export interface BillData {
  id: string;
  title: string;
  amount: number;
  currency_code: string;
  due_date: string;
  status: string;
}

export interface DashboardSummary {
  netWorth: {
    total: number;
    primaryCurrency: string;
    breakdown: Array<{
      currency: string;
      amount: number;
      convertedAmount: number;
      percentage: number;
    }>;
  };
  accounts: {
    total: number;
    visible: number;
    byCurrency: Array<{
      currency: string;
      count: number;
      total: number;
      convertedTotal: number;
    }>;
  };
  transactions: {
    thisMonth: {
      income: number;
      expenses: number;
      net: number;
      byCurrency: Array<{
        currency: string;
        income: number;
        expenses: number;
        net: number;
      }>;
    };
  };
  goals: {
    total: number;
    active: number;
    totalTarget: number;
    totalCurrent: number;
    byCurrency: Array<{
      currency: string;
      target: number;
      current: number;
      progress: number;
    }>;
  };
  liabilities: {
    total: number;
    active: number;
    totalDebt: number;
    byCurrency: Array<{
      currency: string;
      amount: number;
      convertedAmount: number;
    }>;
  };
  bills: {
    total: number;
    active: number;
    totalAmount: number;
    overdue: number;
    byCurrency: Array<{
      currency: string;
      amount: number;
      convertedAmount: number;
      count: number;
    }>;
  };
}

class DashboardAggregationService {
  // Main aggregation function
  async aggregateDashboard(
    accounts: AccountData[],
    transactions: TransactionData[],
    goals: GoalData[],
    liabilities: LiabilityData[],
    bills: BillData[],
    primaryCurrency: string
  ): Promise<DashboardSummary> {
    try {
      // Get current month transactions
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const thisMonthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
      });

      // Aggregate all data
      const [
        netWorth,
        accountsSummary,
        transactionsSummary,
        goalsSummary,
        liabilitiesSummary,
        billsSummary
      ] = await Promise.all([
        this.aggregateNetWorth(accounts, primaryCurrency),
        this.aggregateAccounts(accounts, primaryCurrency),
        this.aggregateTransactions(thisMonthTransactions, primaryCurrency),
        this.aggregateGoals(goals, primaryCurrency),
        this.aggregateLiabilities(liabilities, primaryCurrency),
        this.aggregateBills(bills, primaryCurrency)
      ]);

      return {
        netWorth,
        accounts: accountsSummary,
        transactions: transactionsSummary,
        goals: goalsSummary,
        liabilities: liabilitiesSummary,
        bills: billsSummary
      };
    } catch (error) {
      console.error('Error aggregating dashboard data:', error);
      throw error;
    }
  }

  // Aggregate net worth
  private async aggregateNetWorth(accounts: AccountData[], primaryCurrency: string) {
    const visibleAccounts = accounts.filter(account => account.isVisible);
    
    let totalInPrimary = 0;
    const breakdown = new Map<string, { amount: number; convertedAmount: number; count: number }>();

    // Convert each account individually to primary currency
    for (const account of visibleAccounts) {
      let convertedAmount = account.balance;

      if (account.currency !== primaryCurrency) {
        const exchangeRate = await exchangeRateService.getExchangeRate(account.currency, primaryCurrency);
        if (exchangeRate) {
          convertedAmount = account.balance * exchangeRate;
        }
      }

      totalInPrimary += convertedAmount;

      // Group by currency for breakdown
      if (!breakdown.has(account.currency)) {
        breakdown.set(account.currency, { amount: 0, convertedAmount: 0, count: 0 });
      }
      
      const currencyData = breakdown.get(account.currency)!;
      currencyData.amount += account.balance;
      currencyData.convertedAmount += convertedAmount;
      currencyData.count += 1;
    }

    // Convert breakdown to array
    const breakdownArray = Array.from(breakdown.entries()).map(([currency, data]) => ({
      currency,
      amount: data.amount,
      convertedAmount: data.convertedAmount,
      percentage: totalInPrimary > 0 ? (data.convertedAmount / totalInPrimary) * 100 : 0
    }));

    return {
      total: totalInPrimary,
      primaryCurrency,
      breakdown: breakdownArray
    };
  }

  // Aggregate accounts
  private async aggregateAccounts(accounts: AccountData[], primaryCurrency: string) {
    const visibleAccounts = accounts.filter(account => account.isVisible);
    const currencyGroups = new Map<string, { count: number; total: number; convertedTotal: number }>();
    
    // Convert each account individually to primary currency
    for (const account of visibleAccounts) {
      let convertedTotal = account.balance;

      if (account.currency !== primaryCurrency) {
        const exchangeRate = await exchangeRateService.getExchangeRate(account.currency, primaryCurrency);
        if (exchangeRate) {
          convertedTotal = account.balance * exchangeRate;
        }
      }

      // Group by currency
      if (!currencyGroups.has(account.currency)) {
        currencyGroups.set(account.currency, { count: 0, total: 0, convertedTotal: 0 });
      }
      
      const currencyData = currencyGroups.get(account.currency)!;
      currencyData.count += 1;
      currencyData.total += account.balance;
      currencyData.convertedTotal += convertedTotal;
    }

    const byCurrency = Array.from(currencyGroups.entries()).map(([currency, data]) => ({
      currency,
      count: data.count,
      total: data.total,
      convertedTotal: data.convertedTotal
    }));

    return {
      total: accounts.length,
      visible: visibleAccounts.length,
      byCurrency
    };
  }

  // Aggregate transactions
  private async aggregateTransactions(transactions: TransactionData[], primaryCurrency: string) {
    const currencyGroups = this.groupByCurrency(transactions, 'amount');
    
    let totalIncome = 0;
    let totalExpenses = 0;
    const byCurrency = [];

    for (const [currency, transactions] of currencyGroups) {
      let income = 0;
      let expenses = 0;

      transactions.forEach(transaction => {
        if (transaction.type === 'income') {
          income += transaction.amount;
        } else {
          expenses += transaction.amount;
        }
      });

      let convertedIncome = income;
      let convertedExpenses = expenses;

      if (currency !== primaryCurrency) {
        const exchangeRate = await exchangeRateService.getExchangeRate(currency, primaryCurrency);
        if (exchangeRate) {
          convertedIncome = income * exchangeRate;
          convertedExpenses = expenses * exchangeRate;
        }
      }

      totalIncome += convertedIncome;
      totalExpenses += convertedExpenses;

      byCurrency.push({
        currency,
        income,
        expenses,
        net: income - expenses
      });
    }

    return {
      thisMonth: {
        income: totalIncome,
        expenses: totalExpenses,
        net: totalIncome - totalExpenses,
        byCurrency
      }
    };
  }

  // Aggregate goals
  private async aggregateGoals(goals: GoalData[], primaryCurrency: string) {
    const activeGoals = goals.filter(goal => goal.status === 'active');
    const currencyGroups = this.groupByCurrency(goals, 'target_amount');
    
    let totalTarget = 0;
    let totalCurrent = 0;
    const byCurrency = [];

    for (const [currency, goals] of currencyGroups) {
      const target = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
      const current = goals.reduce((sum, goal) => sum + goal.current_amount, 0);

      let convertedTarget = target;
      let convertedCurrent = current;

      if (currency !== primaryCurrency) {
        const exchangeRate = await exchangeRateService.getExchangeRate(currency, primaryCurrency);
        if (exchangeRate) {
          convertedTarget = target * exchangeRate;
          convertedCurrent = current * exchangeRate;
        }
      }

      totalTarget += convertedTarget;
      totalCurrent += convertedCurrent;

      byCurrency.push({
        currency,
        target,
        current,
        progress: target > 0 ? (current / target) * 100 : 0
      });
    }

    return {
      total: goals.length,
      active: activeGoals.length,
      totalTarget,
      totalCurrent,
      byCurrency
    };
  }

  // Aggregate liabilities
  private async aggregateLiabilities(liabilities: LiabilityData[], primaryCurrency: string) {
    const activeLiabilities = liabilities.filter(liability => liability.status === 'active');
    const currencyGroups = this.groupByCurrency(liabilities, 'remaining_amount');
    
    let totalDebt = 0;
    const byCurrency = [];

    for (const [currency, liabilities] of currencyGroups) {
      const amount = liabilities.reduce((sum, liability) => sum + liability.remaining_amount, 0);
      let convertedAmount = amount;

      if (currency !== primaryCurrency) {
        const exchangeRate = await exchangeRateService.getExchangeRate(currency, primaryCurrency);
        if (exchangeRate) {
          convertedAmount = amount * exchangeRate;
        }
      }

      totalDebt += convertedAmount;
      byCurrency.push({
        currency,
        amount,
        convertedAmount
      });
    }

    return {
      total: liabilities.length,
      active: activeLiabilities.length,
      totalDebt,
      byCurrency
    };
  }

  // Aggregate bills
  private async aggregateBills(bills: BillData[], primaryCurrency: string) {
    const activeBills = bills.filter(bill => bill.status === 'active');
    const overdueBills = bills.filter(bill => {
      const dueDate = new Date(bill.due_date);
      return dueDate < new Date() && bill.status === 'active';
    });
    
    const currencyGroups = this.groupByCurrency(bills, 'amount');
    
    let totalAmount = 0;
    const byCurrency = [];

    for (const [currency, bills] of currencyGroups) {
      const amount = bills.reduce((sum, bill) => sum + bill.amount, 0);
      let convertedAmount = amount;

      if (currency !== primaryCurrency) {
        const exchangeRate = await exchangeRateService.getExchangeRate(currency, primaryCurrency);
        if (exchangeRate) {
          convertedAmount = amount * exchangeRate;
        }
      }

      totalAmount += convertedAmount;
      byCurrency.push({
        currency,
        amount,
        convertedAmount,
        count: bills.length
      });
    }

    return {
      total: bills.length,
      active: activeBills.length,
      totalAmount,
      overdue: overdueBills.length,
      byCurrency
    };
  }

  // Helper function to group data by currency
  private groupByCurrency<T>(items: T[], amountField: keyof T): Map<string, T[]> {
    const groups = new Map<string, T[]>();
    
    items.forEach(item => {
      const currency = (item as any).currency_code || (item as any).currency;
      if (!groups.has(currency)) {
        groups.set(currency, []);
      }
      groups.get(currency)!.push(item);
    });

    return groups;
  }

  // Get currency conversion summary
  async getCurrencyConversionSummary(
    items: Array<{ currency: string; amount: number }>,
    primaryCurrency: string
  ) {
    const currencyGroups = this.groupByCurrency(items, 'amount');
    const summary = [];

    for (const [currency, items] of currencyGroups) {
      const total = items.reduce((sum, item) => sum + item.amount, 0);
      let convertedAmount = total;

      if (currency !== primaryCurrency) {
        const exchangeRate = await exchangeRateService.getExchangeRate(currency, primaryCurrency);
        if (exchangeRate) {
          convertedAmount = total * exchangeRate;
        }
      }

      summary.push({
        currency,
        originalAmount: total,
        convertedAmount,
        exchangeRate: currency !== primaryCurrency ? 
          await exchangeRateService.getExchangeRate(currency, primaryCurrency) : 1
      });
    }

    return summary;
  }
}

export const dashboardAggregationService = new DashboardAggregationService();

