import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FinancialAccount } from '../../lib/finance-manager';
import { formatCurrency, getCurrencyInfo } from '../../utils/currency-converter';
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
  showBalance = true
}) => {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const navigate = useNavigate();
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

  const formatBalance = (balance: number, currency: string = 'USD') => {
    return formatCurrency(balance, currency);
  };

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
                {getCurrencyInfo(account.currency)?.flag} {account.currency}
              </span>
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
              {account.is_visible ? (
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

      {showBalance && account.is_visible && (
        <div className="mb-3">
          <p className="text-xl font-heading" style={{ color: 'var(--text-primary)' }}>
            {formatBalance(account.balance, account.currency)}
          </p>
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
