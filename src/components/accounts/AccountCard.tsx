import React from 'react';
import { FinancialAccount } from '../../lib/finance-manager';
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
  showBalance?: boolean;
  onToggleVisibility?: (account: FinancialAccount) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onEdit,
  onDelete,
  showBalance = true,
  onToggleVisibility
}) => {
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(balance);
  };

  const formatAccountType = (type: FinancialAccount['type']) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div
      className="p-4 rounded-2xl transition-all duration-200 hover:scale-105"
      style={{
        backgroundColor: 'var(--background)',
        boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
      }}
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
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              {formatAccountType(account.type)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onToggleVisibility && (
            <button
              onClick={() => onToggleVisibility(account)}
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
                onClick={() => onEdit(account)}
                className="px-2 py-1 text-xs rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(account)}
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
    </div>
  );
};