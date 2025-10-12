/**
 * QuickFilters Component
 * Provides currency and account selection dropdowns for headers
 */

import React from 'react';
import { DollarSign, Building2 } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { useProfile } from '../../contexts/ProfileContext';

interface QuickFiltersProps {
  selectedAccount?: string;
  onAccountChange?: (accountId: string) => void;
  showAccountFilter?: boolean;
  showCurrencyInfo?: boolean;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  selectedAccount,
  onAccountChange,
  showAccountFilter = true,
  showCurrencyInfo = true
}) => {
  const { accounts } = useFinance();
  const { profile } = useProfile();

  const primaryCurrency = profile?.primaryCurrency || 'INR';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Currency Display */}
      {showCurrencyInfo && (
        <div 
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium"
          style={{
            backgroundColor: 'var(--background-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)'
          }}
        >
          <DollarSign size={14} />
          <span>{primaryCurrency}</span>
        </div>
      )}

      {/* Account Filter */}
      {showAccountFilter && accounts.length > 0 && (
        <select
          value={selectedAccount || ''}
          onChange={(e) => onAccountChange?.(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs sm:text-sm font-medium appearance-none cursor-pointer min-w-[120px]"
          style={{
            backgroundColor: 'var(--background-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)'
          }}
        >
          <option value="">All Accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

