import React, { useState, useEffect } from 'react';
import { AlertCircle, Calculator, CheckCircle } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { simpleCurrencyService } from '../../services/simpleCurrencyService';

interface ManualCurrencyEntryProps {
  amount: number;
  amountCurrency: string;
  accountCurrency: string;
  primaryCurrency: string;
  onConversionComplete: (result: {
    accountAmount: number;
    primaryAmount: number;
    exchangeRate: number;
    conversionSource: 'manual';
  }) => void;
  onCancel: () => void;
}

export const ManualCurrencyEntry: React.FC<ManualCurrencyEntryProps> = ({
  amount,
  amountCurrency,
  accountCurrency,
  primaryCurrency,
  onConversionComplete,
  onCancel
}) => {
  const [accountAmount, setAccountAmount] = useState<number>(0);
  const [primaryAmount, setPrimaryAmount] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    // Calculate initial values
    calculateConversion();
  }, []);

  const calculateConversion = () => {
    setIsCalculating(true);
    
    // Calculate exchange rate based on entered amounts
    const calculatedRate = accountAmount > 0 ? accountAmount / amount : 1;
    setExchangeRate(calculatedRate);
    
    // Calculate primary amount based on account amount
    const calculatedPrimary = simpleCurrencyService.convert(
      accountAmount, 
      accountCurrency, 
      primaryCurrency
    );
    setPrimaryAmount(calculatedPrimary);
    
    setIsCalculating(false);
  };

  const handleAccountAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setAccountAmount(numValue);
  };

  const handlePrimaryAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setPrimaryAmount(numValue);
  };

  const handleSubmit = () => {
    if (accountAmount <= 0) {
      alert('Please enter a valid account amount');
      return;
    }

    onConversionComplete({
      accountAmount,
      primaryAmount,
      exchangeRate,
      conversionSource: 'manual'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return simpleCurrencyService.formatAmount(amount, currency);
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center space-x-2 mb-4">
        <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400" />
        <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
          Manual Currency Conversion Required
        </h3>
      </div>
      
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            <strong>{amountCurrency}</strong> is not supported. Please enter the converted amounts manually.
          </p>
          
          <div className="space-y-4">
            {/* Original Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Original Amount
              </label>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatAmount(amount, amountCurrency)}
              </div>
            </div>

            {/* Account Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount in Account Currency ({accountCurrency})
              </label>
              <Input
                type="number"
                value={accountAmount}
                onChange={(e) => handleAccountAmountChange(e.target.value)}
                placeholder={`Enter amount in ${accountCurrency}`}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This amount will be deducted from your {accountCurrency} account
              </p>
            </div>

            {/* Primary Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount in Primary Currency ({primaryCurrency})
              </label>
              <Input
                type="number"
                value={primaryAmount}
                onChange={(e) => handlePrimaryAmountChange(e.target.value)}
                placeholder={`Enter amount in ${primaryCurrency}`}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This amount will be used for net worth calculation
              </p>
            </div>

            {/* Exchange Rate Display */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Calculator size={16} className="text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Exchange Rate
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                1 {amountCurrency} = {exchangeRate.toFixed(4)} {accountCurrency}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={handleSubmit}
            disabled={accountAmount <= 0 || isCalculating}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle size={16} className="mr-2" />
            {isCalculating ? 'Calculating...' : 'Confirm Conversion'}
          </Button>
          
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>
            <strong>Tip:</strong> You can use any currency converter (Google, XE.com) to get accurate rates.
            The exchange rate will be calculated automatically based on your entered amounts.
          </p>
        </div>
      </div>
    </div>
  );
};
