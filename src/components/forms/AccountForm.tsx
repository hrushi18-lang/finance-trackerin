import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building, Smartphone, Wallet, CreditCard, TrendingUp, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { FinancialAccount } from '../../types';

interface AccountFormData {
  name: string;
  type: 'bank_savings' | 'bank_current' | 'bank_student' | 'digital_wallet' | 'cash' | 'credit_card' | 'investment';
  balance: number;
  institution?: string;
  platform?: string;
  isVisible: boolean;
}

interface AccountFormProps {
  initialData?: FinancialAccount;
  onSubmit: (data: Omit<FinancialAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currency'>) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const AccountForm: React.FC<AccountFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const { currency } = useInternationalization();
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<AccountFormData>({
    defaultValues: initialData || {
      type: 'bank_savings',
      balance: 0,
      isVisible: true
    }
  });

  const selectedType = watch('type');

  const accountTypes = [
    { 
      value: 'bank_savings', 
      label: 'Savings Account', 
      icon: Building, 
      color: 'blue',
      description: 'Regular savings account'
    },
    { 
      value: 'bank_current', 
      label: 'Current Account', 
      icon: Building, 
      color: 'green',
      description: 'Business current account'
    },
    { 
      value: 'bank_student', 
      label: 'Student Account', 
      icon: Building, 
      color: 'purple',
      description: 'Student banking account'
    },
    { 
      value: 'digital_wallet', 
      label: 'Digital Wallet', 
      icon: Smartphone, 
      color: 'orange',
      description: 'PayTM, PhonePe, GPay, etc.'
    },
    { 
      value: 'cash', 
      label: 'Cash', 
      icon: Wallet, 
      color: 'gray',
      description: 'Physical cash wallet'
    },
    { 
      value: 'credit_card', 
      label: 'Credit Card', 
      icon: CreditCard, 
      color: 'red',
      description: 'Credit card account'
    },
    { 
      value: 'investment', 
      label: 'Investment Account', 
      icon: TrendingUp, 
      color: 'yellow',
      description: 'SIP, Mutual Funds, etc.'
    }
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: isSelected ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-white/20 hover:border-blue-400/50',
      green: isSelected ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-white/20 hover:border-green-400/50',
      purple: isSelected ? 'border-purple-500 bg-purple-500/20 text-purple-400' : 'border-white/20 hover:border-purple-400/50',
      orange: isSelected ? 'border-orange-500 bg-orange-500/20 text-orange-400' : 'border-white/20 hover:border-orange-400/50',
      gray: isSelected ? 'border-gray-500 bg-gray-500/20 text-gray-400' : 'border-white/20 hover:border-gray-400/50',
      red: isSelected ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-white/20 hover:border-red-400/50',
      yellow: isSelected ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400' : 'border-white/20 hover:border-yellow-400/50',
    };
    return colors[color as keyof typeof colors];
  };

  const handleFormSubmit = async (data: AccountFormData) => {
    try {
      setError(null);
      await onSubmit({
        ...data,
        balance: Number(data.balance) || 0
      });
    } catch (error: any) {
      console.error('Error submitting account:', error);
      setError(error.message || 'Failed to save account');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} className="text-error-400" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
        <h3 className="text-lg font-semibold text-white mb-2">
          {initialData ? 'Edit Account' : 'Add New Account'}
        </h3>
        <p className="text-gray-300 text-sm">
          Track your finances across multiple accounts and payment methods.
        </p>
      </div>

      {/* Account Name */}
      <Input
        label="Account Name"
        type="text"
        placeholder="e.g., Main Savings, PayTM Wallet"
        icon={<Wallet size={18} className="text-blue-400" />}
        {...register('name', { 
          required: 'Account name is required',
          minLength: { value: 2, message: 'Name must be at least 2 characters' }
        })}
        error={errors.name?.message}
        className="bg-black/20 border-white/20 text-white"
      />

      {/* Account Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Account Type</label>
        <div className="grid grid-cols-2 gap-3">
          {accountTypes.map((type) => {
            const isSelected = selectedType === type.value;
            const IconComponent = type.icon;
            
            return (
              <label key={type.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={type.value}
                  {...register('type', { required: 'Account type is required' })}
                  className="sr-only"
                />
                <div className={`p-4 rounded-lg border-2 transition-colors ${getColorClasses(type.color, isSelected)}`}>
                  <div className="flex items-center space-x-3">
                    <IconComponent size={20} />
                    <div>
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs opacity-80">{type.description}</p>
                    </div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        {errors.type && (
          <p className="text-sm text-error-400 mt-1">{errors.type.message}</p>
        )}
      </div>

      {/* Institution/Platform */}
      {(selectedType?.includes('bank') || selectedType === 'digital_wallet') && (
        <Input
          label={selectedType?.includes('bank') ? 'Bank Name' : 'Platform Name'}
          type="text"
          placeholder={selectedType?.includes('bank') ? 'e.g., State Bank of India' : 'e.g., PayTM, PhonePe'}
          icon={selectedType?.includes('bank') ? <Building size={18} className="text-green-400" /> : <Smartphone size={18} className="text-orange-400" />}
          {...register(selectedType?.includes('bank') ? 'institution' : 'platform')}
          className="bg-black/20 border-white/20 text-white"
        />
      )}

      {/* Initial Balance */}
      <Input
        label="Current Balance"
        type="number"
        step="0.01"
        placeholder="0"
        icon={<CurrencyIcon currencyCode={currency.code} className="text-success-400" />}
        {...register('balance', {
          required: 'Balance is required',
          min: { value: 0, message: 'Balance cannot be negative' }
        })}
        error={errors.balance?.message}
        className="bg-black/20 border-white/20 text-white"
        helpText="Current balance in this account"
      />

      {/* Visibility */}
      <div className="bg-black/20 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Show on Dashboard</p>
            <p className="text-sm text-gray-400">Include this account in total balance calculations</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              {...register('isVisible')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          loading={isSubmitting}
        >
          {initialData ? 'Update' : 'Add'} Account
        </Button>
      </div>
    </form>
  );
};