import { AnalyticsCacheService } from './analyticsCache';
import { supabase } from '../lib/supabase';

export interface FinancialHealthMetrics {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  creditUtilization: number;
  emergencyFundMonths: number;
  investmentRatio: number;
  overallHealthScore: number;
  healthGrade: string;
  riskLevel: string;
  recommendations: string[];
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PredictionData {
  period: string;
  predicted: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: string[];
}

export class EnhancedAnalyticsEngine {
  private cacheService: AnalyticsCacheService;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.cacheService = AnalyticsCacheService.getInstance();
  }

  async calculateFinancialHealth(
    startDate: Date,
    endDate: Date,
    useCache: boolean = true
  ): Promise<FinancialHealthMetrics> {
    const cacheKey = AnalyticsCacheService.CACHE_TYPES.FINANCIAL_HEALTH;
    const periodStart = startDate.toISOString().split('T')[0];
    const periodEnd = endDate.toISOString().split('T')[0];

    if (useCache) {
      const cached = await this.cacheService.getCachedData(
        cacheKey,
        this.userId,
        periodStart,
        periodEnd,
        'monthly'
      );
      if (cached) return cached;
    }

    try {
      // Fetch all financial data
      const [accountsResult, transactionsResult, liabilitiesResult, goalsResult] = await Promise.all([
        supabase.from('financial_accounts').select('*').eq('user_id', this.userId),
        supabase.from('transactions').select('*').eq('user_id', this.userId)
          .gte('date', periodStart).lte('date', periodEnd),
        supabase.from('enhanced_liabilities').select('*').eq('user_id', this.userId),
        supabase.from('goals').select('*').eq('user_id', this.userId)
      ]);

      const accounts = accountsResult.data || [];
      const transactions = transactionsResult.data || [];
      const liabilities = liabilitiesResult.data || [];
      const goals = goalsResult.data || [];

      // Calculate metrics
      const totalAssets = accounts
        .filter(acc => ['bank_savings', 'bank_current', 'investment', 'goals_vault'].includes(acc.type))
        .reduce((sum, acc) => sum + (acc.balance || 0), 0);

      const totalLiabilities = liabilities
        .filter(liab => liab.status === 'active')
        .reduce((sum, liab) => sum + (liab.remaining_amount || 0), 0);

      const netWorth = totalAssets - totalLiabilities;

      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const netIncome = income - expenses;
      const savingsRate = income > 0 ? (netIncome / income) * 100 : 0;

      const debtToIncomeRatio = income > 0 ? totalLiabilities / income : 0;

      // Calculate credit utilization
      const creditCards = accounts.filter(acc => acc.type === 'credit_card');
      const totalCreditLimit = creditCards.reduce((sum, acc) => sum + (acc.credit_limit || 0), 0);
      const totalCreditUsed = creditCards.reduce((sum, acc) => sum + Math.abs(acc.balance || 0), 0);
      const creditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

      // Calculate emergency fund (3 months of expenses)
      const monthlyExpenses = expenses / Math.max(1, this.getMonthsBetween(startDate, endDate));
      const emergencyFund = accounts
        .filter(acc => acc.type === 'bank_savings')
        .reduce((sum, acc) => sum + (acc.balance || 0), 0);
      const emergencyFundMonths = monthlyExpenses > 0 ? emergencyFund / monthlyExpenses : 0;

      // Calculate investment ratio
      const investmentAccounts = accounts.filter(acc => acc.type === 'investment');
      const totalInvestment = investmentAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      const investmentRatio = totalAssets > 0 ? (totalInvestment / totalAssets) * 100 : 0;

      // Calculate overall health score
      const healthScore = this.calculateHealthScore({
        savingsRate,
        debtToIncomeRatio,
        creditUtilization,
        emergencyFundMonths,
        investmentRatio
      });

      const healthGrade = this.getHealthGrade(healthScore);
      const riskLevel = this.getRiskLevel(healthScore);
      const recommendations = this.generateRecommendations({
        savingsRate,
        debtToIncomeRatio,
        creditUtilization,
        emergencyFundMonths,
        investmentRatio,
        healthScore
      });

      const metrics: FinancialHealthMetrics = {
        netWorth,
        totalAssets,
        totalLiabilities,
        totalIncome: income,
        totalExpenses: expenses,
        savingsRate,
        debtToIncomeRatio,
        creditUtilization,
        emergencyFundMonths,
        investmentRatio,
        overallHealthScore: healthScore,
        healthGrade,
        riskLevel,
        recommendations
      };

      // Cache the result
      await this.cacheService.setCachedData(
        cacheKey,
        this.userId,
        periodStart,
        periodEnd,
        'monthly',
        metrics
      );

      return metrics;
    } catch (error) {
      console.error('Error calculating financial health:', error);
      throw error;
    }
  }

  async getTrendAnalysis(
    startDate: Date,
    endDate: Date,
    metric: 'income' | 'expenses' | 'savings' | 'netWorth',
    useCache: boolean = true
  ): Promise<TrendData[]> {
    const cacheKey = `${AnalyticsCacheService.CACHE_TYPES.TREND_ANALYSIS}_${metric}`;
    const periodStart = startDate.toISOString().split('T')[0];
    const periodEnd = endDate.toISOString().split('T')[0];

    if (useCache) {
      const cached = await this.cacheService.getCachedData(
        cacheKey,
        this.userId,
        periodStart,
        periodEnd,
        'monthly'
      );
      if (cached) return cached;
    }

    try {
      const months = this.getMonthsBetween(startDate, endDate);
      const trendData: TrendData[] = [];

      for (let i = 0; i < months; i++) {
        const monthStart = new Date(startDate);
        monthStart.setMonth(monthStart.getMonth() + i);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0); // Last day of the month

        const monthStartStr = monthStart.toISOString().split('T')[0];
        const monthEndStr = monthEnd.toISOString().split('T')[0];

        let value = 0;
        switch (metric) {
          case 'income':
            value = await this.getMonthlyIncome(monthStartStr, monthEndStr);
            break;
          case 'expenses':
            value = await this.getMonthlyExpenses(monthStartStr, monthEndStr);
            break;
          case 'savings':
            const income = await this.getMonthlyIncome(monthStartStr, monthEndStr);
            const expenses = await this.getMonthlyExpenses(monthStartStr, monthEndStr);
            value = income - expenses;
            break;
          case 'netWorth':
            value = await this.getMonthlyNetWorth(monthStartStr, monthEndStr);
            break;
        }

        const previousValue = trendData.length > 0 ? trendData[trendData.length - 1].value : 0;
        const change = value - previousValue;
        const changePercent = previousValue !== 0 ? (change / Math.abs(previousValue)) * 100 : 0;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (Math.abs(changePercent) > 5) {
          trend = change > 0 ? 'up' : 'down';
        }

        trendData.push({
          period: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          value,
          change,
          changePercent: Math.abs(changePercent),
          trend
        });
      }

      // Cache the result
      await this.cacheService.setCachedData(
        cacheKey,
        this.userId,
        periodStart,
        periodEnd,
        'monthly',
        trendData
      );

      return trendData;
    } catch (error) {
      console.error('Error calculating trend analysis:', error);
      throw error;
    }
  }

  async getPredictiveAnalytics(
    startDate: Date,
    endDate: Date,
    metric: 'income' | 'expenses' | 'savings',
    useCache: boolean = true
  ): Promise<PredictionData[]> {
    const cacheKey = `${AnalyticsCacheService.CACHE_TYPES.PREDICTIVE_ANALYTICS}_${metric}`;
    const periodStart = startDate.toISOString().split('T')[0];
    const periodEnd = endDate.toISOString().split('T')[0];

    if (useCache) {
      const cached = await this.cacheService.getCachedData(
        cacheKey,
        this.userId,
        periodStart,
        periodEnd,
        'monthly'
      );
      if (cached) return cached;
    }

    try {
      // Get historical data for prediction
      const historicalData = await this.getTrendAnalysis(
        new Date(startDate.getTime() - 12 * 30 * 24 * 60 * 60 * 1000), // 12 months ago
        endDate,
        metric,
        false
      );

      const predictions: PredictionData[] = [];
      const futureMonths = 3; // Predict next 3 months

      for (let i = 1; i <= futureMonths; i++) {
        const futureDate = new Date(endDate);
        futureDate.setMonth(futureDate.getMonth() + i);
        
        // Simple linear regression for prediction
        const predicted = this.predictValue(historicalData, i);
        const confidence = this.calculateConfidence(historicalData);
        const trend = this.predictTrend(historicalData);
        const factors = this.identifyFactors(historicalData, metric);

        predictions.push({
          period: futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          predicted,
          confidence,
          trend,
          factors
        });
      }

      // Cache the result
      await this.cacheService.setCachedData(
        cacheKey,
        this.userId,
        periodStart,
        periodEnd,
        'monthly',
        predictions
      );

      return predictions;
    } catch (error) {
      console.error('Error calculating predictive analytics:', error);
      throw error;
    }
  }

  private calculateHealthScore(metrics: any): number {
    let score = 0;
    
    // Savings rate (0-25 points)
    if (metrics.savingsRate >= 20) score += 25;
    else if (metrics.savingsRate >= 10) score += 20;
    else if (metrics.savingsRate >= 5) score += 15;
    else if (metrics.savingsRate >= 0) score += 10;
    
    // Debt-to-income ratio (0-25 points)
    if (metrics.debtToIncomeRatio <= 0.2) score += 25;
    else if (metrics.debtToIncomeRatio <= 0.3) score += 20;
    else if (metrics.debtToIncomeRatio <= 0.4) score += 15;
    else if (metrics.debtToIncomeRatio <= 0.5) score += 10;
    
    // Credit utilization (0-20 points)
    if (metrics.creditUtilization <= 20) score += 20;
    else if (metrics.creditUtilization <= 30) score += 15;
    else if (metrics.creditUtilization <= 50) score += 10;
    else if (metrics.creditUtilization <= 70) score += 5;
    
    // Emergency fund (0-20 points)
    if (metrics.emergencyFundMonths >= 6) score += 20;
    else if (metrics.emergencyFundMonths >= 3) score += 15;
    else if (metrics.emergencyFundMonths >= 1) score += 10;
    
    // Investment ratio (0-10 points)
    if (metrics.investmentRatio >= 20) score += 10;
    else if (metrics.investmentRatio >= 10) score += 7;
    else if (metrics.investmentRatio >= 5) score += 5;
    
    return Math.min(100, Math.max(0, score));
  }

  private getHealthGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 45) return 'D+';
    if (score >= 40) return 'D';
    if (score >= 35) return 'D-';
    return 'F';
  }

  private getRiskLevel(score: number): string {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'very_high';
  }

  private generateRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];
    
    if (metrics.savingsRate < 10) {
      recommendations.push('Increase your savings rate to at least 10% of income');
    }
    
    if (metrics.debtToIncomeRatio > 0.3) {
      recommendations.push('Focus on reducing debt to improve your debt-to-income ratio');
    }
    
    if (metrics.creditUtilization > 30) {
      recommendations.push('Pay down credit card balances to reduce utilization');
    }
    
    if (metrics.emergencyFundMonths < 3) {
      recommendations.push('Build an emergency fund covering 3-6 months of expenses');
    }
    
    if (metrics.investmentRatio < 10) {
      recommendations.push('Consider increasing your investment allocation');
    }
    
    if (metrics.healthScore < 50) {
      recommendations.push('Create a comprehensive financial plan to improve your overall health');
    }
    
    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  private async getMonthlyIncome(startDate: string, endDate: string): Promise<number> {
    const { data } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', this.userId)
      .eq('type', 'income')
      .gte('date', startDate)
      .lte('date', endDate);
    
    return data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  }

  private async getMonthlyExpenses(startDate: string, endDate: string): Promise<number> {
    const { data } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', this.userId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate);
    
    return data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  }

  private async getMonthlyNetWorth(startDate: string, endDate: string): Promise<number> {
    const [accountsResult, liabilitiesResult] = await Promise.all([
      supabase.from('financial_accounts').select('balance, type').eq('user_id', this.userId),
      supabase.from('enhanced_liabilities').select('remaining_amount').eq('user_id', this.userId).eq('status', 'active')
    ]);

    const totalAssets = accountsResult.data?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;
    const totalLiabilities = liabilitiesResult.data?.reduce((sum, liab) => sum + (liab.remaining_amount || 0), 0) || 0;
    
    return totalAssets - totalLiabilities;
  }

  private getMonthsBetween(startDate: Date, endDate: Date): number {
    return (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
           (endDate.getMonth() - startDate.getMonth()) + 1;
  }

  private predictValue(historicalData: TrendData[], monthsAhead: number): number {
    if (historicalData.length < 2) return historicalData[0]?.value || 0;
    
    const recent = historicalData.slice(-3); // Use last 3 months
    const avgChange = recent.reduce((sum, item, index) => {
      if (index === 0) return 0;
      return sum + (item.value - recent[index - 1].value);
    }, 0) / (recent.length - 1);
    
    return recent[recent.length - 1].value + (avgChange * monthsAhead);
  }

  private calculateConfidence(historicalData: TrendData[]): number {
    if (historicalData.length < 3) return 50;
    
    // Calculate variance in recent data
    const recent = historicalData.slice(-6); // Last 6 months
    const avg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
    const variance = recent.reduce((sum, item) => sum + Math.pow(item.value - avg, 2), 0) / recent.length;
    const stdDev = Math.sqrt(variance);
    const coefficient = avg > 0 ? stdDev / avg : 1;
    
    // Convert to confidence percentage (lower variance = higher confidence)
    return Math.max(30, Math.min(95, 100 - (coefficient * 100)));
  }

  private predictTrend(historicalData: TrendData[]): 'increasing' | 'decreasing' | 'stable' {
    if (historicalData.length < 2) return 'stable';
    
    const recent = historicalData.slice(-3);
    const first = recent[0].value;
    const last = recent[recent.length - 1].value;
    const change = last - first;
    const changePercent = first > 0 ? (change / first) * 100 : 0;
    
    if (Math.abs(changePercent) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  private identifyFactors(historicalData: TrendData[], metric: string): string[] {
    const factors: string[] = [];
    
    if (metric === 'income') {
      factors.push('Salary trends', 'Bonus patterns', 'Investment returns');
    } else if (metric === 'expenses') {
      factors.push('Seasonal spending', 'Inflation impact', 'Lifestyle changes');
    } else if (metric === 'savings') {
      factors.push('Income stability', 'Expense control', 'Financial goals');
    }
    
    return factors;
  }
}
