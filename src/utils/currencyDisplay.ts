/**
 * Currency Display Utilities
 * Helpers for displaying amounts in PRIMARY currency throughout the app
 * 
 * ✅ UPDATED: Now uses unifiedCurrencyService for all conversions
 * 
 * NATIVE CURRENCY = Original currency stored in database (primary display)
 * PRIMARY CURRENCY = User's preferred display currency (secondary info)
 */

import { simpleCurrencyService } from '../services/simpleCurrencyService';
import { formatCurrency as baseFormatCurrency } from './currencyFormatter';
import { Account, Transaction } from '../types/finance';

/**
 * Display amount in primary currency with optional native currency
 */
export function displayInPrimaryCurrency(
  amount: number,
  nativeCurrency: string,
  primaryCurrency: string,
  options: {
    showNative?: boolean;
    compact?: boolean;
  } = {}
): {
  primaryAmount: number;
  primaryFormatted: string;
  nativeFormatted?: string;
  needsConversion: boolean;
} {
  const { showNative = true, compact = false } = options;
  
  // Check if conversion is needed
  const needsConversion = nativeCurrency !== primaryCurrency;
  
  // Convert to primary if different
  const primaryAmount = needsConversion
    ? amount * simpleCurrencyService.getRate(nativeCurrency, primaryCurrency)
    : amount;
  
  // Format amounts
  const primaryFormatted = baseFormatCurrency(primaryAmount, { currency: primaryCurrency });
  const nativeFormatted = showNative && needsConversion
    ? baseFormatCurrency(amount, { currency: nativeCurrency })
    : undefined;
  
  return {
    primaryAmount: Math.round(primaryAmount * 100) / 100,
    primaryFormatted,
    nativeFormatted,
    needsConversion
  };
}

/**
 * Get account balance in primary currency for display
 */
export function getAccountPrimaryBalance(
  account: Account,
  primaryCurrency: string
): {
  amount: number;
  formatted: string;
  nativeFormatted?: string;
} {
  const display = displayInPrimaryCurrency(
    account.balance,
    account.currencycode || primaryCurrency,
    primaryCurrency
  );
  
  return {
    amount: display.primaryAmount,
    formatted: display.primaryFormatted,
    nativeFormatted: display.nativeFormatted
  };
}

/**
 * Get transaction amount in primary currency for display
 */
export function getTransactionPrimaryAmount(
  transaction: Transaction,
  primaryCurrency: string
): {
  amount: number;
  formatted: string;
  nativeFormatted?: string;
} {
  // Use stored primary_amount if available
  if ((transaction as any).primary_amount && (transaction as any).primary_currency) {
    const primaryAmount = (transaction as any).primary_amount;
    const storedPrimaryCurrency = (transaction as any).primary_currency;
    
    // If stored primary matches current primary, use it
    if (storedPrimaryCurrency === primaryCurrency) {
      return {
        amount: primaryAmount,
        formatted: baseFormatCurrency(primaryAmount, { currency: primaryCurrency }),
        nativeFormatted: transaction.native_currency && transaction.native_currency !== primaryCurrency
          ? baseFormatCurrency(transaction.native_amount || transaction.amount, { 
              currency: transaction.native_currency 
            })
          : undefined
      };
    }
  }
  
  // Fallback: calculate from native amount
  const nativeAmount = transaction.native_amount || transaction.amount;
  const nativeCurrency = transaction.native_currency || transaction.currencycode || primaryCurrency;
  
  return displayInPrimaryCurrency(nativeAmount, nativeCurrency, primaryCurrency);
}

/**
 * Get total net worth in primary currency
 */
export function getTotalNetWorth(
  accounts: Account[],
  liabilities: any[],
  primaryCurrency: string
): {
  amount: number;
  formatted: string;
  breakdown: {
    assets: number;
    liabilities: number;
  };
} {
  // Sum all accounts in primary currency
  const totalAssets = accounts.reduce((sum, account) => {
    const display = getAccountPrimaryBalance(account, primaryCurrency);
    return sum + display.amount;
  }, 0);
  
  // Sum all liabilities in primary currency
  const totalLiabilities = liabilities.reduce((sum, liability) => {
    const liabilityCurrency = liability.currencycode || primaryCurrency;
    const liabilityAmount = liability.remainingAmount || liability.amount || 0;
    
    const display = displayInPrimaryCurrency(
      liabilityAmount,
      liabilityCurrency,
      primaryCurrency,
      { showNative: false }
    );
    
    return sum + display.primaryAmount;
  }, 0);
  
  const netWorth = totalAssets - totalLiabilities;
  
  return {
    amount: Math.round(netWorth * 100) / 100,
    formatted: baseFormatCurrency(netWorth, { currency: primaryCurrency }),
    breakdown: {
      assets: Math.round(totalAssets * 100) / 100,
      liabilities: Math.round(totalLiabilities * 100) / 100
    }
  };
}

/**
 * Get bill amount in primary currency for display
 */
export function getBillPrimaryAmount(
  bill: any,
  primaryCurrency: string
): {
  amount: number;
  formatted: string;
  nativeFormatted?: string;
} {
  const billAmount = bill.amount || 0;
  const billCurrency = bill.currencycode || primaryCurrency;
  
  return displayInPrimaryCurrency(billAmount, billCurrency, primaryCurrency);
}

/**
 * Get goal amount in primary currency for display
 */
export function getGoalPrimaryAmount(
  goal: any,
  primaryCurrency: string
): {
  current: { amount: number; formatted: string };
  target: { amount: number; formatted: string };
  progress: number;
} {
  const goalCurrency = goal.currencycode || primaryCurrency;
  
  const currentDisplay = displayInPrimaryCurrency(
    goal.currentAmount || 0,
    goalCurrency,
    primaryCurrency,
    { showNative: false }
  );
  
  const targetDisplay = displayInPrimaryCurrency(
    goal.targetAmount || 0,
    goalCurrency,
    primaryCurrency,
    { showNative: false }
  );
  
  const progress = targetDisplay.primaryAmount > 0
    ? (currentDisplay.primaryAmount / targetDisplay.primaryAmount) * 100
    : 0;
  
  return {
    current: {
      amount: currentDisplay.primaryAmount,
      formatted: currentDisplay.primaryFormatted
    },
    target: {
      amount: targetDisplay.primaryAmount,
      formatted: targetDisplay.primaryFormatted
    },
    progress: Math.min(progress, 100)
  };
}

/**
 * Format dual display (PRIMARY large, native small)
 */
export function formatDualDisplay(
  amount: number,
  nativeCurrency: string,
  primaryCurrency: string,
  className?: {
    primary?: string;
    native?: string;
  }
): JSX.Element | null {
  const display = displayInPrimaryCurrency(amount, nativeCurrency, primaryCurrency);
  
  return (
    <div className="dual-currency-display">
      {/* PRIMARY - LARGE, PROMINENT */}
      <span className={className?.primary || 'text-2xl font-bold text-gray-900'}>
        {display.primaryFormatted}
      </span>
      
      {/* NATIVE - SMALL, SECONDARY (only if different) */}
      {display.nativeFormatted && (
        <span className={className?.native || 'text-sm text-gray-500 ml-2'}>
          ({display.nativeFormatted})
        </span>
      )}
    </div>
  ) as any;
}

/**
 * Get all account balances in primary currency (for charts/totals)
 */
export function getAllAccountsInPrimary(
  accounts: Account[],
  primaryCurrency: string
): Array<{
  accountId: string;
  name: string;
  primaryAmount: number;
  nativeAmount: number;
  nativeCurrency: string;
}> {
  return accounts.map(account => {
    const display = getAccountPrimaryBalance(account, primaryCurrency);
    
    return {
      accountId: account.id,
      name: account.name,
      primaryAmount: display.amount,
      nativeAmount: account.balance,
      nativeCurrency: account.currencycode || primaryCurrency
    };
  });
}

/**
 * Calculate month-to-date spending in primary currency
 */
export function getMonthlySpendingInPrimary(
  transactions: Transaction[],
  primaryCurrency: string
): {
  total: number;
  formatted: string;
  byCategory: Record<string, number>;
} {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  
  let total = 0;
  const byCategory: Record<string, number> = {};
  
  transactions
    .filter(t => t.type === 'expense' && new Date(t.date) >= monthStart)
    .forEach(t => {
      const display = getTransactionPrimaryAmount(t, primaryCurrency);
      total += display.amount;
      
      const category = t.category || 'Uncategorized';
      byCategory[category] = (byCategory[category] || 0) + display.amount;
    });
  
  return {
    total: Math.round(total * 100) / 100,
    formatted: baseFormatCurrency(total, { currency: primaryCurrency }),
    byCategory
  };
}

/**
 * Check if user's primary currency matches their current location
 */
export function isPrimaryCurrencyOptimal(
  primaryCurrency: string,
  accounts: Account[]
): {
  isOptimal: boolean;
  suggestion?: string;
  reason?: string;
} {
  // Count accounts by currency
  const currencyCount: Record<string, number> = {};
  accounts.forEach(account => {
    const currency = account.currencycode || primaryCurrency;
    currencyCount[currency] = (currencyCount[currency] || 0) + 1;
  });
  
  // Find most common account currency
  const mostCommon = Object.entries(currencyCount).reduce(
    (max, [currency, count]) => count > max.count ? { currency, count } : max,
    { currency: primaryCurrency, count: 0 }
  );
  
  if (mostCommon.currency !== primaryCurrency && mostCommon.count > 1) {
    return {
      isOptimal: false,
      suggestion: mostCommon.currency,
      reason: `You have ${mostCommon.count} accounts in ${mostCommon.currency}. Consider switching primary currency for less conversion.`
    };
  }
  
  return { isOptimal: true };
}

