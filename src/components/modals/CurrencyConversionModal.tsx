import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Check, AlertCircle, DollarSign } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { simpleCurrencyService } from '../../services/simpleCurrencyService';

interface CurrencyConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (convertedAmount: number, originalAmount: number, rate: number) => void;
  originalAmount: number;
  originalCurrency: string;
  targetCurrency: string;
  billTitle?: string;
  paymentType?: string;
}

export const CurrencyConversionModal: React.FC<CurrencyConversionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  originalAmount,
  originalCurrency,
  targetCurrency,
  billTitle,
  paymentType = 'payment'
}) => {
  const { supportedCurrencies, formatCurrency } = useInternationalization();
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get currency info
  const originalCurrencyInfo = supportedCurrencies.find(c => c.code === originalCurrency);
  const targetCurrencyInfo = supportedCurrencies.find(c => c.code === targetCurrency);

  // Calculate initial conversion
  useEffect(() => {
    if (isOpen && originalAmount > 0) {
      calculateConversion();
    }
  }, [isOpen, originalAmount, originalCurrency, targetCurrency]);

  const calculateConversion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use simple currency service for conversion
      const rate = simpleCurrencyService.getRate(originalCurrency, targetCurrency);
      const converted = originalAmount * rate;
      
      setExchangeRate(rate);
      setConvertedAmount(converted);
    } catch (err) {
      setError('Failed to calculate conversion rate');
      console.error('Conversion error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setConvertedAmount(amount);
  };

  const handleConfirm = () => {
    if (convertedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    onConfirm(convertedAmount, originalAmount, exchangeRate);
    onClose();
  };

  const formatCurrencyAmount = (amount: number, currencyCode: string) => {
    const currency = supportedCurrencies.find(c => c.code === currencyCode);
    if (!currency) return amount.toString();

    const formatted = amount.toFixed(currency.decimals);
    return currency.symbolPosition === 'before' 
      ? `${currency.symbol}${formatted}`
      : `${formatted} ${currency.symbol}`;
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Currency Conversion
              </h2>
              <p className="text-sm text-gray-600">
                {paymentType === 'payment' ? 'Pay' : 'Convert'} {billTitle ? `for ${billTitle}` : 'amount'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Conversion Display */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Original Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrencyAmount(originalAmount, originalCurrency)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {originalCurrencyInfo?.name}
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <ArrowRightLeft className="w-6 h-6 text-gray-400 mb-2" />
              <div className="text-center">
                <p className="text-xs text-gray-500">Rate</p>
                <p className="text-sm font-medium text-gray-700">
                  1 {originalCurrency} = {exchangeRate.toFixed(4)} {targetCurrency}
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Converted Amount</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrencyAmount(convertedAmount, targetCurrency)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {targetCurrencyInfo?.name}
              </p>
            </div>
          </div>

          {/* Exchange Rate Info */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-medium text-gray-700">Exchange Rate Information</p>
            </div>
            <p className="text-xs text-gray-600">
              Rates are approximate and may vary. You can adjust the converted amount below for accuracy.
            </p>
          </div>
        </div>

        {/* Amount Adjustment */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjust Converted Amount (Optional)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="number"
                step="0.01"
                value={convertedAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter converted amount"
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              You can fine-tune the amount if the conversion seems inaccurate
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || convertedAmount <= 0}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Converting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>Confirm {paymentType === 'payment' ? 'Payment' : 'Conversion'}</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
