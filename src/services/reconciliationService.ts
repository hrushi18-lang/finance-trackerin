import { Decimal } from 'decimal.js';
import { currencyConversionService } from './currencyConversionService';
import { timezoneService } from './timezoneService';

export interface FXGainLoss {
  id: string;
  accountId: string;
  currency: string;
  originalAmount: Decimal;
  originalRate: Decimal;
  currentAmount: Decimal;
  currentRate: Decimal;
  gainLoss: Decimal;
  gainLossPercentage: Decimal;
  period: string;
  timestamp: Date;
  isRealized: boolean;
}

export interface ReconciliationResult {
  accountId: string;
  currency: string;
  originalBalance: Decimal;
  currentBalance: Decimal;
  fxGainLoss: Decimal;
  fxGainLossPercentage: Decimal;
  unrealizedGainLoss: Decimal;
  realizedGainLoss: Decimal;
  period: string;
  lastReconciliation: Date;
  nextReconciliation: Date;
}

export interface ReconciliationConfig {
  autoReconcile: boolean;
  reconciliationFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  thresholdPercentage: number; // Minimum change to trigger reconciliation
  freezePeriods: boolean; // Freeze primary amounts during reconciliation
  notifyOnSignificantChanges: boolean;
  significantChangeThreshold: number; // Percentage threshold for notifications
}

export class ReconciliationService {
  private config: ReconciliationConfig;
  private fxGainLossHistory: Map<string, FXGainLoss[]> = new Map();
  private reconciliationHistory: Map<string, ReconciliationResult[]> = new Map();

  constructor(config: ReconciliationConfig) {
    this.config = config;
  }

  // Reconcile account balances with current exchange rates
  async reconcileAccount(
    accountId: string,
    currency: string,
    originalBalance: Decimal,
    originalRate: Decimal,
    currentRate: Decimal,
    period: string
  ): Promise<ReconciliationResult> {
    const currentBalance = originalBalance.mul(currentRate);
    const fxGainLoss = currentBalance.sub(originalBalance);
    const fxGainLossPercentage = originalBalance.gt(0) 
      ? fxGainLoss.div(originalBalance).mul(100)
      : new Decimal(0);

    // Calculate unrealized vs realized gains/losses
    const unrealizedGainLoss = fxGainLoss;
    const realizedGainLoss = new Decimal(0); // Would be calculated from actual transactions

    // Create reconciliation result
    const result: ReconciliationResult = {
      accountId,
      currency,
      originalBalance,
      currentBalance,
      fxGainLoss,
      fxGainLossPercentage,
      unrealizedGainLoss,
      realizedGainLoss,
      period,
      lastReconciliation: new Date(),
      nextReconciliation: this.getNextReconciliationDate()
    };

    // Store reconciliation history
    if (!this.reconciliationHistory.has(accountId)) {
      this.reconciliationHistory.set(accountId, []);
    }
    this.reconciliationHistory.get(accountId)!.push(result);

    // Create FX gain/loss record
    const fxGainLossRecord: FXGainLoss = {
      id: `fx_${accountId}_${Date.now()}`,
      accountId,
      currency,
      originalAmount: originalBalance,
      originalRate,
      currentAmount: currentBalance,
      currentRate,
      gainLoss: fxGainLoss,
      gainLossPercentage: fxGainLossPercentage,
      period,
      timestamp: new Date(),
      isRealized: false
    };

    // Store FX gain/loss history
    if (!this.fxGainLossHistory.has(accountId)) {
      this.fxGainLossHistory.set(accountId, []);
    }
    this.fxGainLossHistory.get(accountId)!.push(fxGainLossRecord);

    return result;
  }

  // Reconcile all accounts
  async reconcileAllAccounts(
    accounts: Array<{
      id: string;
      currency: string;
      balance: Decimal;
      originalRate: Decimal;
    }>,
    primaryCurrency: string
  ): Promise<ReconciliationResult[]> {
    const results: ReconciliationResult[] = [];
    const period = timezoneService.getCurrentBusinessDate().accountingPeriod;

    for (const account of accounts) {
      try {
        // Get current exchange rate
        const currentRate = await currencyConversionService.getExchangeRate(
          account.currency,
          primaryCurrency
        );

        // Reconcile account
        const result = await this.reconcileAccount(
          account.id,
          account.currency,
          account.balance,
          account.originalRate,
          new Decimal(currentRate.rate),
          period
        );

        results.push(result);
      } catch (error) {
        console.error(`Failed to reconcile account ${account.id}:`, error);
      }
    }

    return results;
  }

  // Get next reconciliation date
  private getNextReconciliationDate(): Date {
    const now = new Date();
    
    switch (this.config.reconciliationFrequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case 'quarterly':
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  // Check if reconciliation is needed
  async isReconciliationNeeded(
    accountId: string,
    currency: string,
    currentRate: Decimal
  ): Promise<boolean> {
    const lastReconciliation = this.getLastReconciliation(accountId);
    if (!lastReconciliation) return true;

    // Check if enough time has passed
    const timeSinceLastReconciliation = Date.now() - lastReconciliation.lastReconciliation.getTime();
    const reconciliationInterval = this.getReconciliationInterval();
    
    if (timeSinceLastReconciliation < reconciliationInterval) {
      return false;
    }

    // Check if rate change exceeds threshold
    const rateChange = currentRate.sub(lastReconciliation.fxGainLoss).abs();
    const rateChangePercentage = lastReconciliation.fxGainLoss.gt(0) 
      ? rateChange.div(lastReconciliation.fxGainLoss).mul(100)
      : new Decimal(0);

    return rateChangePercentage.gte(this.config.thresholdPercentage);
  }

  // Get reconciliation interval in milliseconds
  private getReconciliationInterval(): number {
    switch (this.config.reconciliationFrequency) {
      case 'daily':
        return 24 * 60 * 60 * 1000;
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000;
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000;
      case 'quarterly':
        return 90 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  // Get last reconciliation for an account
  getLastReconciliation(accountId: string): ReconciliationResult | null {
    const history = this.reconciliationHistory.get(accountId);
    if (!history || history.length === 0) return null;
    
    return history[history.length - 1];
  }

  // Get FX gain/loss history for an account
  getFXGainLossHistory(accountId: string): FXGainLoss[] {
    return this.fxGainLossHistory.get(accountId) || [];
  }

  // Get reconciliation history for an account
  getReconciliationHistory(accountId: string): ReconciliationResult[] {
    return this.reconciliationHistory.get(accountId) || [];
  }

  // Calculate total FX gain/loss for a period
  calculateTotalFXGainLoss(period: string): {
    totalGainLoss: Decimal;
    totalUnrealizedGainLoss: Decimal;
    totalRealizedGainLoss: Decimal;
    accountBreakdown: Array<{
      accountId: string;
      currency: string;
      gainLoss: Decimal;
    }>;
  } {
    let totalGainLoss = new Decimal(0);
    let totalUnrealizedGainLoss = new Decimal(0);
    let totalRealizedGainLoss = new Decimal(0);
    const accountBreakdown: Array<{
      accountId: string;
      currency: string;
      gainLoss: Decimal;
    }> = [];

    for (const [accountId, history] of this.reconciliationHistory.entries()) {
      const periodHistory = history.filter(h => h.period === period);
      if (periodHistory.length === 0) continue;

      const latest = periodHistory[periodHistory.length - 1];
      totalGainLoss = totalGainLoss.add(latest.fxGainLoss);
      totalUnrealizedGainLoss = totalUnrealizedGainLoss.add(latest.unrealizedGainLoss);
      totalRealizedGainLoss = totalRealizedGainLoss.add(latest.realizedGainLoss);

      accountBreakdown.push({
        accountId,
        currency: latest.currency,
        gainLoss: latest.fxGainLoss
      });
    }

    return {
      totalGainLoss,
      totalUnrealizedGainLoss,
      totalRealizedGainLoss,
      accountBreakdown
    };
  }

  // Freeze primary amounts for a period
  freezePrimaryAmounts(period: string): void {
    // This would typically update the database to mark amounts as frozen
    console.log(`Freezing primary amounts for period ${period}`);
  }

  // Unfreeze primary amounts for a period
  unfreezePrimaryAmounts(period: string): void {
    // This would typically update the database to mark amounts as unfrozen
    console.log(`Unfreezing primary amounts for period ${period}`);
  }

  // Check for significant changes that require notification
  checkForSignificantChanges(accountId: string): boolean {
    const lastReconciliation = this.getLastReconciliation(accountId);
    if (!lastReconciliation) return false;

    const gainLossPercentage = lastReconciliation.fxGainLossPercentage.abs();
    return gainLossPercentage.gte(this.config.significantChangeThreshold);
  }

  // Get accounts that need reconciliation
  getAccountsNeedingReconciliation(): string[] {
    const accounts: string[] = [];
    
    for (const [accountId, history] of this.reconciliationHistory.entries()) {
      const lastReconciliation = history[history.length - 1];
      if (!lastReconciliation) continue;

      const timeSinceLastReconciliation = Date.now() - lastReconciliation.lastReconciliation.getTime();
      const reconciliationInterval = this.getReconciliationInterval();
      
      if (timeSinceLastReconciliation >= reconciliationInterval) {
        accounts.push(accountId);
      }
    }

    return accounts;
  }

  // Update configuration
  updateConfig(newConfig: Partial<ReconciliationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): ReconciliationConfig {
    return { ...this.config };
  }

  // Clear history (for testing)
  clearHistory(): void {
    this.fxGainLossHistory.clear();
    this.reconciliationHistory.clear();
  }
}

// Default configuration
const defaultConfig: ReconciliationConfig = {
  autoReconcile: true,
  reconciliationFrequency: 'daily',
  thresholdPercentage: 0.1, // 0.1% minimum change
  freezePeriods: false,
  notifyOnSignificantChanges: true,
  significantChangeThreshold: 5.0 // 5% significant change threshold
};

// Export singleton instance
export const reconciliationService = new ReconciliationService(defaultConfig);
