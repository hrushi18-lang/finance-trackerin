import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FinancialAccount } from '../../types';
import { getCurrencyInfo, formatCurrency } from '../../utils/currency-converter';
import { useProfile } from '../../contexts/ProfileContext';
import { AccountActionsMenu } from './AccountActionsMenu';
import { RateStatusIndicator } from '../currency/RateStatusIndicator';
import { 
  CreditCard, 
  Wallet, 
  Building2, 
  PiggyBank, 
  Banknote,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';

interface AccountCardProps {
  account: FinancialAccount;
  onEdit?: (account: FinancialAccount) => void;
  onDelete?: (account: FinancialAccount) => void;
  onDuplicate?: (account: FinancialAccount) => void;
  onTransfer?: (account: FinancialAccount) => void;
  onViewHistory?: (account: FinancialAccount) => void;
  onViewAnalytics?: (account: FinancialAccount) => void;
  onToggleVisibility?: (account: FinancialAccount) => void;
  onTogglePin?: (account: FinancialAccount) => void;
  onArchive?: (account: FinancialAccount) => void;
  showBalance?: boolean;
  showDualCurrency?: boolean;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onEdit,
  onDelete,
  onDuplicate,
  onTransfer,
  onViewHistory,
  onViewAnalytics,
  onToggleVisibility,
  onTogglePin,
  onArchive,
  showBalance = true,
  showDualCurrency = true
}) => {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const navigate = useNavigate();
  const { profile } = useProfile();
  const getAccountIcon = (type: FinancialAccount['type']) => {
    switch (type) {
      case 'bank_savings':
      case 'bank_current':
      case 'bank_student':
        return <Building2 size={20} />;
      case 'digital_wallet':
        return <Wallet size={20} />;
      case 'cash':
        return <Banknote size={20} />;
      case 'credit_card':
        return <CreditCard size={20} />;
      case 'investment':
        return <TrendingUp size={20} />;
      default:
        return <PiggyBank size={20} />;
    }
  };

  const getAccountColor = (type: FinancialAccount['type']) => {
    switch (type) {
      case 'bank_savings':
        return 'text-green-600';
      case 'bank_current':
        return 'text-blue-600';
      case 'bank_student':
        return 'text-purple-600';
      case 'digital_wallet':
        return 'text-orange-600';
      case 'cash':
        return 'text-yellow-600';
      case 'credit_card':
        return 'text-red-600';
      case 'investment':
        return 'text-indigo-600';
      default:
        return 'text-gray-600';
    }
  };


  // Get display currency and converted balance
  const primaryCurrency = profile?.primaryCurrency || 'USD';
  const accountCurrency = account.currencycode || account.native_currency || primaryCurrency;
  const accountBalance = account.balance || 0;
  
  // Get dual currency data from account fields
  const nativeAmount = account.native_amount || accountBalance;
  const nativeCurrency = account.native_currency || accountCurrency;
  const convertedAmount = account.converted_amount || accountBalance;
  const convertedCurrency = account.converted_currency || primaryCurrency;
  const exchangeRate = account.exchange_rate || 1.0;
  const needsConversion = account.native_currency !== account.converted_currency;
  
  // Check if we should show dual currency
  const shouldShowDualCurrency = showDualCurrency && needsConversion;
  
  // Display amount - show native currency as main, primary currency as description
  const displayAmount = shouldShowDualCurrency ? nativeAmount : convertedAmount;
  const displayCurrency = shouldShowDualCurrency ? nativeCurrency : convertedCurrency;

  const formatAccountType = (type: FinancialAccount['type']) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleCardClick = () => {
    navigate(`/accounts/${account.id}`);
  };

  return (
    <div
      className="relative p-4 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer"
      style={{
        backgroundColor: 'var(--background)',
        boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
      }}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg ${getAccountColor(account.type)} flex-shrink-0`} style={{ backgroundColor: 'var(--background-secondary)' }}>
            {getAccountIcon(account.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {account.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-xs font-body truncate" style={{ color: 'var(--text-secondary)' }}>
                {formatAccountType(account.type)}
              </p>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">
                {getCurrencyInfo(nativeCurrency)?.flag || '💱'} {nativeCurrency}
              </span>
              {shouldShowDualCurrency && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                  {getCurrencyInfo(convertedCurrency)?.flag || '💱'} {convertedCurrency}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 flex-shrink-0">
          {onToggleVisibility && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(account);
              }}
              className="p-2 rounded-lg active:bg-gray-100 transition-colors"
            >
              {account.isVisible ? (
                <Eye size={16} style={{ color: 'var(--text-secondary)' }} />
              ) : (
                <EyeOff size={16} style={{ color: 'var(--text-tertiary)' }} />
              )}
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(account);
              }}
              className="px-3 py-2 text-xs rounded-lg active:bg-gray-100 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {showBalance && account.isVisible && (
        <div className="mb-3">
          {shouldShowDualCurrency ? (
            <div className="space-y-1">
              {/* Main balance - Native currency */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {nativeCurrency}
                </span>
                <p className={`text-xl font-heading ${nativeAmount < 0 ? 'text-red-600' : ''}`} 
                   style={{ color: nativeAmount < 0 ? 'var(--error)' : 'var(--text-primary)' }}>
                  {formatCurrency(nativeAmount, nativeCurrency)}
                </p>
              </div>
              
              {/* Description - Primary currency */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  ≈ {convertedCurrency}
                </span>
                <p className={`text-sm font-medium ${convertedAmount < 0 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                  {formatCurrency(convertedAmount, convertedCurrency)}
                </p>
              </div>
              
              {/* Exchange rate info */}
              {exchangeRate && exchangeRate !== 1.0 && (
                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>
                    1 {nativeCurrency} = {exchangeRate.toFixed(4)} {convertedCurrency}
                  </span>
                  <RateStatusIndicator showDetails={false} />
                </div>
              )}
            </div>
          ) : (
            <p className={`text-xl font-heading ${displayAmount < 0 ? 'text-red-600' : ''}`} 
               style={{ color: displayAmount < 0 ? 'var(--error)' : 'var(--text-primary)' }}>
              {formatCurrency(displayAmount, displayCurrency)}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1">
        {account.institution && (
          <p className="text-xs font-body truncate" style={{ color: 'var(--text-secondary)' }}>
            {account.institution}
          </p>
        )}

        {account.platform && (
          <p className="text-xs font-body truncate" style={{ color: 'var(--text-tertiary)' }}>
            {account.platform}
          </p>
        )}
      </div>

      {/* Actions Menu */}
      {showActionsMenu && (
        <AccountActionsMenu
          account={account}
          onEdit={onEdit || (() => {})}
          onDuplicate={onDuplicate || (() => {})}
          onTransfer={onTransfer || (() => {})}
          onViewHistory={onViewHistory || (() => {})}
          onViewAnalytics={onViewAnalytics || (() => {})}
          onToggleVisibility={onToggleVisibility || (() => {})}
          onTogglePin={onTogglePin || (() => {})}
          onArchive={onArchive || (() => {})}
          onDelete={onDelete || (() => {})}
          onClose={() => setShowActionsMenu(false)}
        />
      )}
    </div>
  );
};
