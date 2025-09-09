import React, { useState, useEffect } from 'react';
import { Building, Smartphone, CreditCard, PiggyBank, Eye, EyeOff, MoreHorizontal } from 'lucide-react';
import { useEnhancedCurrency } from '../../contexts/EnhancedCurrencyContext';
import { useProfile } from '../../contexts/ProfileContext';

interface AccountCardProps {
  account: {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    institution?: string;
    isVisible: boolean;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
  className?: string;
}

const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onEdit,
  onDelete,
  onToggleVisibility,
  className = ""
}) => {
  const { convertAmount, formatCurrency, getCurrencyInfo } = useEnhancedCurrency();
  const { userProfile } = useProfile();
  const [convertedBalance, setConvertedBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currencyInfo = getCurrencyInfo(account.currency);
  const primaryCurrency = userProfile?.primaryCurrency || 'USD';

  // Convert balance to primary currency
  useEffect(() => {
    const convertBalance = async () => {
      if (account.currency === primaryCurrency) {
        setConvertedBalance(account.balance);
        return;
      }

      setIsLoading(true);
      try {
        const converted = await convertAmount(account.balance, account.currency, primaryCurrency);
        setConvertedBalance(converted);
      } catch (error) {
        console.error('Failed to convert balance:', error);
        setConvertedBalance(null);
      } finally {
        setIsLoading(false);
      }
    };

    convertBalance();
  }, [account.balance, account.currency, primaryCurrency, convertAmount]);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank_savings':
      case 'bank_current':
      case 'bank_student':
        return <Building className="w-5 h-5" />;
      case 'digital_wallet':
        return <Smartphone className="w-5 h-5" />;
      case 'credit_card':
        return <CreditCard className="w-5 h-5" />;
      case 'goals_vault':
        return <PiggyBank className="w-5 h-5" />;
      default:
        return <Building className="w-5 h-5" />;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'bank_savings':
      case 'bank_current':
      case 'bank_student':
        return 'text-blue-600 bg-blue-50';
      case 'digital_wallet':
        return 'text-purple-600 bg-purple-50';
      case 'credit_card':
        return 'text-red-600 bg-red-50';
      case 'goals_vault':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatAccountBalance = (amount: number, currency: string) => {
    return formatCurrency(amount, currency, true);
  };

  const showConversion = account.currency !== primaryCurrency && convertedBalance !== null;

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getAccountTypeColor(account.type)}`}>
            {getAccountIcon(account.type)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{account.name}</h3>
            {account.institution && (
              <p className="text-xs text-gray-500">{account.institution}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {!account.isVisible && (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <div className="space-y-2">
        {/* Native Currency Balance */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Balance</span>
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              {formatAccountBalance(account.balance, account.currency)}
            </div>
            {currencyInfo && (
              <div className="text-xs text-gray-500 flex items-center space-x-1">
                <span>{currencyInfo.flag_emoji}</span>
                <span>{currencyInfo.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Converted Balance (if different currency) */}
        {showConversion && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">In {primaryCurrency}</span>
            <div className="text-right">
              {isLoading ? (
                <div className="text-sm text-gray-400">Converting...</div>
              ) : (
                <div className="font-medium text-gray-700">
                  {formatAccountBalance(convertedBalance!, primaryCurrency)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account Type Badge */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">Type</span>
          <span className="text-xs font-medium text-gray-600 capitalize">
            {account.type.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
};

export { AccountCard };
export default AccountCard;