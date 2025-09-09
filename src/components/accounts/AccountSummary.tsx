import React, { useState, useEffect } from 'react';
import { useEnhancedCurrency } from '../../contexts/EnhancedCurrencyContext';
import { useProfile } from '../../contexts/ProfileContext';

interface AccountSummaryProps {
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    isVisible: boolean;
  }>;
  className?: string;
}

interface CurrencySummary {
  currency: string;
  total: number;
  count: number;
  accounts: Array<{
    id: string;
    name: string;
    balance: number;
  }>;
}

const AccountSummary: React.FC<AccountSummaryProps> = ({ accounts, className = "" }) => {
  const { convertAmount, formatCurrency, getCurrencyInfo } = useEnhancedCurrency();
  const { userProfile } = useProfile();
  const [currencySummaries, setCurrencySummaries] = useState<CurrencySummary[]>([]);
  const [totalInPrimary, setTotalInPrimary] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const primaryCurrency = userProfile?.primaryCurrency || 'USD';
  const visibleAccounts = accounts.filter(account => account.isVisible);

  // Group accounts by currency
  useEffect(() => {
    const groupByCurrency = () => {
      const grouped = visibleAccounts.reduce((acc, account) => {
        const currency = account.currency;
        if (!acc[currency]) {
          acc[currency] = {
            currency,
            total: 0,
            count: 0,
            accounts: []
          };
        }
        acc[currency].total += account.balance;
        acc[currency].count += 1;
        acc[currency].accounts.push({
          id: account.id,
          name: account.name,
          balance: account.balance
        });
        return acc;
      }, {} as Record<string, CurrencySummary>);

      setCurrencySummaries(Object.values(grouped));
    };

    groupByCurrency();
  }, [visibleAccounts]);

  // Convert all currencies to primary currency
  useEffect(() => {
    const convertToPrimary = async () => {
      if (visibleAccounts.length === 0) return;

      setIsLoading(true);
      try {
        let total = 0;
        
        // Convert each account individually to primary currency
        for (const account of visibleAccounts) {
          if (account.currency === primaryCurrency) {
            total += account.balance;
          } else {
            const converted = await convertAmount(account.balance, account.currency, primaryCurrency);
            if (converted !== null) {
              total += converted;
            }
          }
        }
        
        setTotalInPrimary(total);
      } catch (error) {
        console.error('Failed to convert to primary currency:', error);
        setTotalInPrimary(null);
      } finally {
        setIsLoading(false);
      }
    };

    convertToPrimary();
  }, [visibleAccounts, primaryCurrency, convertAmount]);

  const formatCurrencyAmount = (amount: number, currency: string) => {
    return formatCurrency(amount, currency, true);
  };

  const getCurrencyInfo = (currency: string) => {
    return getCurrencyInfo(currency);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Total in Primary Currency */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Total Net Worth</h3>
            <p className="text-xs text-gray-500">All accounts in {primaryCurrency}</p>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="text-lg font-bold text-gray-400">Calculating...</div>
            ) : totalInPrimary !== null ? (
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrencyAmount(totalInPrimary, primaryCurrency)}
              </div>
            ) : (
              <div className="text-lg font-bold text-red-500">Error</div>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown by Currency */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">By Currency</h4>
        {currencySummaries.map((summary) => {
          const currencyInfo = getCurrencyInfo(summary.currency);
          const isPrimary = summary.currency === primaryCurrency;
          
          return (
            <div key={summary.currency} className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {currencyInfo && (
                    <span className="text-lg">{currencyInfo.flag_emoji}</span>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">
                      {summary.currency}
                    </div>
                    <div className="text-xs text-gray-500">
                      {summary.count} account{summary.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrencyAmount(summary.total, summary.currency)}
                  </div>
                  {!isPrimary && (
                    <div className="text-xs text-gray-500">
                      {currencyInfo?.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Details */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Account Details</h4>
        {currencySummaries.map((summary) => {
          const currencyInfo = getCurrencyInfo(summary.currency);
          
          return (
            <div key={summary.currency} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                {currencyInfo && (
                  <span className="text-sm">{currencyInfo.flag_emoji}</span>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {summary.currency} Accounts
                </span>
              </div>
              <div className="space-y-1">
                {summary.accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 truncate">{account.name}</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrencyAmount(account.balance, summary.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { AccountSummary };
export default AccountSummary;
