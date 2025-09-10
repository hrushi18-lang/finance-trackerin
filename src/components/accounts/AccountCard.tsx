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
      className="relative p-4 rounded-2xl transition-all duration-200 hover:scale-105 cursor-pointer"
      style={{
        backgroundColor: 'var(--background)',
        boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
      }}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getAccountColor(account.type)}`} style={{ backgroundColor: 'var(--background-secondary)' }}>
            {getAccountIcon(account.type)}
          </div>
          <div>
            <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
              {account.name}
            </h3>
            <div className="flex items-center space-x-2">
              <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                {formatAccountType(account.type)}
              </p>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                {getCurrencyInfo(account.currency)?.flag} {account.currency}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onToggleVisibility && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(account);
              }}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {account.is_visible ? (
                <Eye size={16} style={{ color: 'var(--text-secondary)' }} />
              ) : (
                <EyeOff size={16} style={{ color: 'var(--text-tertiary)' }} />
              )}
            </button>
          )}
          
          <div className="flex space-x-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(account);
                }}
                className="px-2 py-1 text-xs rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(account);
                }}
                className="px-2 py-1 text-xs rounded-lg hover:bg-red-100 transition-colors text-red-600"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {showBalance && account.is_visible && (
        <div className="mb-3">
          <p className="text-2xl font-heading" style={{ color: 'var(--text-primary)' }}>
            {formatBalance(account.balance, account.currency)}
          </p>
        </div>
      )}

      {account.institution && (
        <div className="mb-2">
          <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
            {account.institution}
          </p>
        </div>
      )}

      {account.platform && (
        <div>
          <p className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
            {account.platform}
          </p>
        </div>
      )}

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
