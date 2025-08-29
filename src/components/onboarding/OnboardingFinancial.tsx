import React from 'react';
import { useForm } from 'react-hook-form';
import { DollarSign, Wallet, CreditCard, Globe, Briefcase, Calculator } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface FinancialData {
  initialBalance: number;
  monthlyIncome: number;
  currency: string;
}

interface OnboardingFinancialProps {
  onNext: (data: FinancialData) => void;
  onPrev: () => void;
  initialData?: Partial<FinancialData>;
  canGoBack?: boolean;
}

export const OnboardingFinancial: React.FC<OnboardingFinancialProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = true
}) => {
  const { supportedCurrencies } = useInternationalization();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FinancialData>({
    defaultValues: {
      initialBalance: initialData?.initialBalance || 0,
      monthlyIncome: initialData?.monthlyIncome || 0,
      currency: initialData?.currency || 'USD'
    }
  });

  const selectedCurrency = watch('currency');

  const onSubmit = (data: FinancialData) => {
    onNext(data);
  };

  const getCurrencyFlag = (code: string) => {
    const flagMap: Record<string, string> = {
      'USD': '🇺🇸', 'EUR': '🇪🇺', 'GBP': '🇬🇧', 'JPY': '🇯🇵', 'CNY': '🇨🇳',
      'INR': '🇮🇳', 'AUD': '🇦🇺', 'CAD': '🇨🇦', 'SGD': '🇸🇬', 'HKD': '🇭🇰',
      'KRW': '🇰🇷', 'THB': '🇹🇭', 'MYR': '🇲🇾', 'IDR': '🇮🇩', 'PHP': '🇵🇭',
      'VND': '🇻🇳', 'CHF': '🇨🇭', 'SEK': '🇸🇪', 'NOK': '🇳🇴', 'DKK': '🇩🇰',
      'PLN': '🇵🇱', 'CZK': '🇨🇿', 'HUF': '🇭🇺', 'RUB': '🇷🇺', 'BRL': '🇧🇷',
      'MXN': '🇲🇽', 'ARS': '🇦🇷', 'CLP': '🇨🇱', 'COP': '🇨🇴', 'PEN': '🇵🇪',
      'AED': '🇦🇪', 'SAR': '🇸🇦', 'QAR': '🇶🇦', 'ILS': '🇮🇱', 'TRY': '🇹🇷',
      'ZAR': '🇿🇦', 'EGP': '🇪🇬', 'NGN': '🇳🇬', 'KES': '🇰🇪', 'BTC': '₿', 'ETH': 'Ξ'
    };
    return flagMap[code] || '💱';
  };

  const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'AUD', 'CAD'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet size={32} className="text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Set up your money accounts</h2>
        <p className="text-gray-400">Your coach needs to know your starting point to help you grow</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Account Setup Guide */}
        <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
          <h3 className="font-semibold text-blue-400 mb-3">💡 Why We Ask About Your Accounts</h3>
          <div className="space-y-2 text-sm text-blue-300">
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-0.5">💰</span>
              <div>
                <p className="font-medium">Cash Wallet:</p>
                <p className="text-xs text-blue-200">Track pocket money and daily expenses</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-0.5">🏦</span>
              <div>
                <p className="font-medium">Bank Account:</p>
                <p className="text-xs text-blue-200">Your main savings and income account</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-0.5">🚨</span>
              <div>
                <p className="font-medium">Emergency Fund:</p>
                <p className="text-xs text-blue-200">Safety net for unexpected expenses</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-0.5">💳</span>
              <div>
                <p className="font-medium">Credit/Debt:</p>
                <p className="text-xs text-blue-200">Track what you owe and payment progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Initial Balance */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <Input
            label="Current Total Money (All Accounts Combined)"
            type="number"
            step="0.01"
            placeholder="e.g., 15000"
            icon={<CurrencyIcon currencyCode={selectedCurrency} className="text-success-400" />}
            {...register('initialBalance', {
              required: 'Starting balance is required',
              min: { value: 0, message: 'Balance cannot be negative' }
            })}
            error={errors.initialBalance?.message}
            className="bg-black/20 border-white/20 text-white"
          />
          <p className="text-sm text-gray-400 mt-2">
            💡 <strong>Include everything:</strong> Cash in wallet + Bank savings + Any investments. 
            Don't worry about being exact - we\'ll help you organize this into separate accounts next!
          </p>
          <p className="text-sm text-gray-400 mt-2">
            This is your current account balance - we'll only record this once as your starting point.
          </p>
        </div>

        {/* Monthly Income */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <Input
            label="Monthly Income (Salary + Allowance + Any Other)"
            type="number"
            step="0.01"
            placeholder="e.g., 25000"
            icon={<Briefcase size={18} className="text-blue-400" />}
            {...register('monthlyIncome', {
              required: 'Monthly income is required',
              min: { value: 0, message: 'Income cannot be negative' }
            })}
            error={errors.monthlyIncome?.message}
            className="bg-black/20 border-white/20 text-white"
          />
          <p className="text-sm text-gray-400 mt-2">
            💰 <strong>Include all sources:</strong> Job salary, family allowance, freelance work, part-time income. 
            Your coach uses this to suggest realistic budgets and savings targets.
          </p>
        </div>

        {/* Currency Selection */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <Globe size={18} className="inline mr-2" />
            Preferred Currency
          </label>
          
          {/* Popular Currencies */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {popularCurrencies.map((code) => {
              const curr = supportedCurrencies.find(c => c.code === code);
              if (!curr) return null;
              
              return (
                <label key={code} className="cursor-pointer">
                  <input
                    type="radio"
                    value={code}
                    {...register('currency', { required: 'Currency is required' })}
                    className="sr-only"
                  />
                  <div className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                    selectedCurrency === code
                      ? 'border-primary-500 bg-primary-500/20 text-primary-400 shadow-lg scale-105'
                      : 'border-white/20 hover:border-white/30 text-gray-300 hover:bg-white/5'
                  }`}>
                    <div className="text-xl mb-1">{getCurrencyFlag(code)}</div>
                    <div className="font-medium">{code}</div>
                    <div className="text-xs opacity-70">{curr.symbol}</div>
                  </div>
                </label>
              );
            })}
          </div>
          
          {/* Other Currencies */}
          <select
            {...register('currency')}
            className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white"
          >
            <option value="" disabled>Select other currency</option>
            {supportedCurrencies.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {getCurrencyFlag(curr.code)} {curr.code} - {curr.name} ({curr.symbol})
              </option>
            ))}
          </select>
          
          {errors.currency && (
            <p className="text-sm text-error-400 mt-1">{errors.currency.message}</p>
          )}
        </div>

        {/* Financial Calculator Preview */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <div className="flex items-center space-x-3 mb-3">
            <Calculator size={18} className="text-primary-400" />
            <h3 className="font-medium text-white">Financial Snapshot</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-black/20 p-3 rounded-lg">
              <p className="text-gray-400 mb-1">Monthly Budget</p>
              <p className="font-medium text-white">
                <CurrencyIcon currencyCode={selectedCurrency} size={14} className="inline mr-1" />
                {watch('monthlyIncome') ? (watch('monthlyIncome') * 0.7).toFixed(2) : '0.00'}
              </p>
              <p className="text-xs text-gray-500">70% of income</p>
            </div>
            
            <div className="bg-black/20 p-3 rounded-lg">
              <p className="text-gray-400 mb-1">Recommended Savings</p>
              <p className="font-medium text-white">
                <CurrencyIcon currencyCode={selectedCurrency} size={14} className="inline mr-1" />
                {watch('monthlyIncome') ? (watch('monthlyIncome') * 0.2).toFixed(2) : '0.00'}
              </p>
              <p className="text-xs text-gray-500">20% of income</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <CreditCard size={16} className="text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-400 font-medium">🎯 Your Coach's Strategy</p>
              <p className="text-blue-300">
                By knowing your starting point and income, your financial coach can create personalized budgets, 
                suggest realistic savings goals, and give you tips that actually work for your situation. 
                All data is encrypted and never shared.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex space-x-3 pt-4">
          {canGoBack && (
            <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
              Back
            </Button>
          )}
          <Button type="submit" className="flex-1">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};