import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useEnhancedCurrency } from '../../contexts/EnhancedCurrencyContext';
import { useProfile } from '../../contexts/ProfileContext';

interface TransactionCardProps {
  transaction: {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    date: string;
    currency_code: string;
    original_amount?: number;
    original_currency?: string;
    exchange_rate?: number;
    exchange_rate_used?: number;
    status: 'completed' | 'pending' | 'cancelled';
    transfer_to_account_id?: string;
    parent_transaction_id?: string;
  };
  accountCurrency?: string;
  showConversion?: boolean;
  className?: string;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  accountCurrency,
  showConversion = true,
  className = ""
}) => {
  const { convertAmount, formatCurrency, getCurrencyInfo } = useEnhancedCurrency();
  const { userProfile } = useProfile();
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const primaryCurrency = userProfile?.primaryCurrency || 'USD';
  const isCrossCurrency = transaction.original_currency && transaction.original_currency !== transaction.currency_code;
  const isTransfer = transaction.transfer_to_account_id || transaction.parent_transaction_id;
  const isLinkedTransaction = transaction.parent_transaction_id;

  const currencyInfo = getCurrencyInfo(transaction.currency_code);
  const originalCurrencyInfo = transaction.original_currency ? getCurrencyInfo(transaction.original_currency) : null;

  // Convert amount to primary currency if needed
  useEffect(() => {
    const convertToPrimary = async () => {
      if (transaction.currency_code === primaryCurrency || !showConversion) {
        setConvertedAmount(transaction.amount);
        return;
      }

      setIsLoading(true);
      try {
        // Use stored exchange rate if available
        if (transaction.exchange_rate_used) {
          const converted = transaction.amount * transaction.exchange_rate_used;
          setConvertedAmount(converted);
        } else {
          // Get current exchange rate
          const converted = await convertAmount(transaction.amount, transaction.currency_code, primaryCurrency);
          setConvertedAmount(converted);
        }
      } catch (error) {
        console.error('Failed to convert transaction amount:', error);
        setConvertedAmount(null);
      } finally {
        setIsLoading(false);
      }
    };

    convertToPrimary();
  }, [transaction, primaryCurrency, showConversion, convertAmount]);

  const getTransactionIcon = () => {
    if (isTransfer) {
      return <ArrowRightLeft className="w-4 h-4" />;
    }
    return transaction.type === 'income' ? 
      <ArrowDownRight className="w-4 h-4" /> : 
      <ArrowUpRight className="w-4 h-4" />;
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getAmountColor = () => {
    if (transaction.status === 'cancelled') return 'text-red-500';
    if (transaction.type === 'income') return 'text-green-600';
    return 'text-red-600';
  };

  const formatAmount = (amount: number, currency: string) => {
    return formatCurrency(Math.abs(amount), currency, true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const shouldShowConversion = showConversion && 
    transaction.currency_code !== primaryCurrency && 
    convertedAmount !== null && 
    !isLoading;

  return (
    <div className={`bg-white rounded-lg p-4 border border-gray-100 hover:shadow-sm transition-all duration-200 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Transaction Icon */}
          <div className={`p-2 rounded-lg ${
            transaction.type === 'income' 
              ? 'bg-green-50 text-green-600' 
              : 'bg-red-50 text-red-600'
          }`}>
            {getTransactionIcon()}
          </div>

          {/* Transaction Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900 truncate">
                {transaction.description}
              </h4>
              {isLinkedTransaction && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Linked
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{transaction.category}</span>
              <span>•</span>
              <span>{formatDate(transaction.date)}</span>
              {getStatusIcon()}
            </div>

            {/* Cross-currency indicator */}
            {isCrossCurrency && (
              <div className="flex items-center space-x-1 mt-1 text-xs text-blue-600">
                <span>{originalCurrencyInfo?.flag_emoji}</span>
                <span>{transaction.original_currency}</span>
                <span>→</span>
                <span>{currencyInfo?.flag_emoji}</span>
                <span>{transaction.currency_code}</span>
                {transaction.exchange_rate && (
                  <span className="text-gray-500">
                    (Rate: {transaction.exchange_rate.toFixed(4)})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right">
          {/* Primary Amount */}
          <div className={`font-semibold ${getAmountColor()}`}>
            {formatAmount(transaction.amount, transaction.currency_code)}
          </div>
          
          {/* Currency Info */}
          <div className="text-xs text-gray-500 flex items-center space-x-1">
            {currencyInfo && <span>{currencyInfo.flag_emoji}</span>}
            <span>{transaction.currency_code}</span>
          </div>

          {/* Converted Amount */}
          {shouldShowConversion && (
            <div className="text-sm text-gray-600 mt-1">
              {formatAmount(convertedAmount!, primaryCurrency)}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-xs text-gray-400 mt-1">
              Converting...
            </div>
          )}
        </div>
      </div>

      {/* Original Amount (for cross-currency transactions) */}
      {isCrossCurrency && transaction.original_amount && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Original Amount</span>
            <div className="flex items-center space-x-1">
              <span className="font-medium text-gray-700">
                {formatAmount(transaction.original_amount, transaction.original_currency!)}
              </span>
              {originalCurrencyInfo && (
                <span className="text-gray-500">
                  {originalCurrencyInfo.flag_emoji} {transaction.original_currency}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { TransactionCard };
export default TransactionCard;
