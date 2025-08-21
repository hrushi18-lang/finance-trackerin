import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Target, Calendar, DollarSign } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface CategoryBudgetFormData {
  categoryId: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  alertThreshold: number;
}

interface CategoryBudgetFormProps {
  onSubmit: (data: CategoryBudgetFormData) => void;
  onCancel: () => void;
  initialData?: any;
}

export const CategoryBudgetForm: React.FC<CategoryBudgetFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const { currency } = useInternationalization();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<CategoryBudgetFormData>({
    defaultValues: initialData || {
      period: 'monthly',
      alertThreshold: 80
    }
  });

  const period = watch('period');
  const amount = watch('amount');
  const alertThreshold = watch('alertThreshold');

  const handleFormSubmit = (data: CategoryBudgetFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target size={32} className="text-primary-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Set Category Budget</h3>
        <p className="text-gray-400">Define spending limits for this category</p>
      </div>

      {/* Budget Amount */}
      <Input
        label="Budget Amount"
        type="number"
        step="0.01"
        icon={<CurrencyIcon currencyCode={currency.code} className="text-success-400" />}
        {...register('amount', {
          required: 'Budget amount is required',
          min: { value: 0.01, message: 'Amount must be greater than 0' }
        })}
        error={errors.amount?.message}
        className="bg-black/20 border-white/20 text-white"
      />

      {/* Period */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Budget Period</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'yearly', label: 'Yearly' }
          ].map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                value={option.value}
                {...register('period')}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                period === option.value 
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <span className="font-medium">{option.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Alert Threshold */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Alert Threshold (%)</label>
        <input
          type="range"
          min="50"
          max="100"
          step="5"
          {...register('alertThreshold')}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>50%</span>
          <span className="font-medium text-white">{alertThreshold}%</span>
          <span>100%</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Get alerts when you reach {alertThreshold}% of your budget
        </p>
      </div>

      {/* Preview */}
      {amount && (
        <div className="bg-primary-500/20 rounded-lg p-4 border border-primary-500/30">
          <div className="text-center">
            <p className="text-primary-400 font-medium mb-2">Budget Preview</p>
            <p className="text-white text-lg">
              {formatCurrency(amount)} per {period}
            </p>
            <p className="text-primary-300 text-sm mt-1">
              Alert at {formatCurrency((amount * alertThreshold) / 100)}
            </p>
          </div>
        </div>
      )}

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
          Set Budget
        </Button>
      </div>
    </form>
  );
};