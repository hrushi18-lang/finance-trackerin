import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FinancialAccount } from '../../types';
import { getCurrencyInfo } from '../../utils/currency-converter';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { useEnhancedCurrency } from '../../contexts/EnhancedCurrencyContext';
import { AccountActionsMenu } from './AccountActionsMenu';
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
  const { formatCurrency: formatCurrencyI18n } = useInternationalization();
  const { convertAmount } = useEnhancedCurrency();
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
  const displayCurrency = account.displayCurrency || account.currencyCode || 'USD';
  const originalCurrency = account.currencyCode || 'USD';
  const originalBalance = account.originalBalance || account.balance || 0;
  const convertedBalance = account.convertedBalance || 
    (originalCurrency !== displayCurrency ? 
      convertAmount(originalBalance, originalCurrency, displayCurrency) || originalBalance :
      originalBalance);
  
  // Check if we should show dual currency
  const shouldShowDualCurrency = showDualCurrency && originalCurrency !== displayCurrency;

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
                {getCurrencyInfo(originalCurrency)?.flag || '💱'} {originalCurrency}
              </span>
              {shouldShowDualCurrency && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                  {getCurrencyInfo(displayCurrency)?.flag || '💱'} {displayCurrency}
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
              {/* Original currency balance */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {originalCurrency}
                </span>
                <p className={`text-lg font-heading ${originalBalance < 0 ? 'text-red-600' : ''}`} 
                   style={{ color: originalBalance < 0 ? 'var(--error)' : 'var(--text-primary)' }}>
                  {formatCurrencyI18n(originalBalance)}
                </p>
              </div>
              
              {/* Converted balance */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  {displayCurrency}
                </span>
                <p className={`text-xl font-heading ${convertedBalance < 0 ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'}`} 
                   style={{ color: convertedBalance < 0 ? 'var(--error)' : 'var(--primary)' }}>
                  {formatCurrencyI18n(convertedBalance)}
                </p>
              </div>
              
              {/* Exchange rate info */}
              {account.exchangeRateUsed && (
                <div className="text-xs text-gray-400 dark:text-gray-500 text-right">
                  1 {originalCurrency} = {account.exchangeRateUsed.toFixed(4)} {displayCurrency}
                </div>
              )}
            </div>
          ) : (
            <p className={`text-xl font-heading ${account.balance < 0 ? 'text-red-600' : ''}`} 
               style={{ color: account.balance < 0 ? 'var(--error)' : 'var(--text-primary)' }}>
              {formatCurrencyI18n(account.balance)}
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
