import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, DollarSign, Tag, Repeat, AlertCircle, CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { CategorySelector } from '../components/common/CategorySelector';
import { TopNavigation } from '../components/layout/TopNavigation';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';

interface BillFormData {
  title: string;
  description: string;
  amount: number;
  category: string;
  billCategory: 'account_specific' | 'category_based' | 'general';
  targetCategory?: string;
  frequency: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'one_time' | 'custom';
  customFrequencyDays?: number;
  dueDate: string;
  accountId?: string;
  isRecurring: boolean;
  autoPay: boolean;
  paymentMethod?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  isEssential: boolean;
  reminderDaysBefore: number;
}

const CreateBill: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useInternationalization();
  const { addBill, accounts } = useFinance();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BillFormData>({
    defaultValues: {
      billCategory: 'general',
      frequency: 'monthly',
      isRecurring: true,
      autoPay: false,
      priority: 'medium',
      isEssential: false,
      reminderDaysBefore: 3,
    },
  });

  const billCategory = watch('billCategory');
  const frequency = watch('frequency');
  const isRecurring = watch('isRecurring');
  const autoPay = watch('autoPay');

  const onSubmit = async (data: BillFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Calculate next due date based on frequency
      const dueDate = new Date(data.dueDate);
      let nextDueDate = new Date(dueDate);
      
      if (isRecurring && data.frequency !== 'one_time') {
        switch (data.frequency) {
          case 'weekly':
            nextDueDate.setDate(nextDueDate.getDate() + 7);
            break;
          case 'bi_weekly':
            nextDueDate.setDate(nextDueDate.getDate() + 14);
            break;
          case 'monthly':
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDueDate.setMonth(nextDueDate.getMonth() + 3);
            break;
          case 'semi_annual':
            nextDueDate.setMonth(nextDueDate.getMonth() + 6);
            break;
          case 'annual':
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
            break;
        }
      }

      const billData = {
        ...data,
        amount: Number(data.amount),
        dueDate: dueDate,
        nextDueDate: nextDueDate,
        customFrequencyDays: data.frequency === 'custom' ? Number(data.customFrequencyDays) : undefined,
        isActive: true,
        status: 'active' as const,
        billType: 'fixed' as const,
        estimatedAmount: Number(data.amount),
        isEmi: false,
        sendDueDateReminder: true,
        sendOverdueReminder: true,
        // Add missing required fields
        currencyCode: 'USD',
        isRecurring: isRecurring,
        activityScope: data.billCategory,
        accountIds: data.accountId ? [data.accountId] : [],
        linkedAccountsCount: data.accountId ? 1 : 0,
        isIncome: false,
        billStage: 'pending' as const,
        isVariableAmount: false,
        completionAction: 'continue' as const,
        isArchived: false,
        // Currency tracking fields
        original_amount: Number(data.amount),
        original_currency: 'USD',
        exchange_rate_used: 1.0
      };

      await addBill(billData);
      navigate('/bills');
    } catch (error: any) {
      console.error('Error creating bill, please try again without mistakes - Hrushi:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create bill. Please try again.';
      
      if (error.message) {
        if (error.message.includes('title already exists')) {
          errorMessage = 'A bill with this title already exists. Please choose a different title.';
        } else if (error.message.includes('Amount must be greater than 0')) {
          errorMessage = 'Amount must be greater than 0';
        } else if (error.message.includes('Due date is required')) {
          errorMessage = 'Due date is required';
        } else if (error.message.includes('Invalid account reference')) {
          errorMessage = 'Please select a valid account for this bill';
        } else if (error.message.includes('Invalid data provided')) {
          errorMessage = 'Please check your input values and try again';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      <TopNavigation title="Create Bill" showBack />
      
      <div className="px-6 py-4 space-y-6">
        {/* Bill Type Selection */}
        <div 
          className="p-6 rounded-2xl"
          style={{
            backgroundColor: 'var(--background-secondary)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Bill Type
          </h3>
          <div className="space-y-3">
            {[
              {
                type: 'general',
                title: 'General Bill',
                icon: FileText,
                description: 'Regular bill or expense',
                color: 'text-blue-600'
              },
              {
                type: 'account_specific',
                title: 'Account Specific',
                icon: CreditCard,
                description: 'Bill linked to a specific account',
                color: 'text-green-600'
              },
              {
                type: 'category_based',
                title: 'Category Based',
                icon: Tag,
                description: 'Bill for a specific category',
                color: 'text-purple-600'
              }
            ].map(({ type, title, icon: Icon, description, color }) => (
              <button
                key={type}
                onClick={() => setValue('billCategory', type as any)}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  billCategory === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: billCategory === type ? 'var(--primary)' : 'var(--background)' }}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={20} className={color} />
                  <div className="text-left">
                    <h4 className="font-heading font-medium" style={{ color: 'var(--text-primary)' }}>
                      {title}
                    </h4>
                    <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                      {description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bill Details Form */}
        <div 
          className="p-6 rounded-2xl"
          style={{
            backgroundColor: 'var(--background-secondary)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Bill Details
          </h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Bill Title
              </label>
              <Input
                {...register('title', { required: 'Title is required' })}
                placeholder="e.g., Rent, Electricity, Internet"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Description (Optional)
              </label>
              <Input
                {...register('description')}
                placeholder="Add more details about this bill"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Amount
              </label>
              <div className="relative">
                <DollarSign size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <Input
                  {...register('amount', { required: 'Amount is required' })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Due Date
              </label>
              <div className="relative">
                <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <Input
                  {...register('dueDate', { required: 'Due date is required' })}
                  type="date"
                  className="pl-10"
                />
              </div>
              {errors.dueDate && (
                <p className="text-red-500 text-sm mt-1">{errors.dueDate.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Category
              </label>
              <CategorySelector
                value={watch('category')}
                onChange={(category) => setValue('category', category)}
                type="bill"
                placeholder="Select a category"
                error={errors.category?.message}
              />
            </div>

            {/* Account Selection (for account-specific bills) */}
            {billCategory === 'account_specific' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Payment Account
                </label>
                <select
                  {...register('accountId', { required: billCategory === 'account_specific' ? 'Account is required' : false })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {formatCurrency(account.balance || 0)}
                    </option>
                  ))}
                </select>
                {errors.accountId && (
                  <p className="text-red-500 text-sm mt-1">{errors.accountId.message}</p>
                )}
              </div>
            )}

            {/* Target Category (for category-based bills) */}
            {billCategory === 'category_based' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Target Category
                </label>
                <Input
                  {...register('targetCategory', { required: billCategory === 'category_based' ? 'Target category is required' : false })}
                  placeholder="e.g., Utilities, Groceries, Transportation"
                />
                {errors.targetCategory && (
                  <p className="text-red-500 text-sm mt-1">{errors.targetCategory.message}</p>
                )}
              </div>
            )}

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Frequency
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['weekly', 'bi_weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'one_time'].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setValue('frequency', freq as any)}
                    className={`p-3 rounded-lg border transition-all ${
                      frequency === freq
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {freq.replace('_', ' ').charAt(0).toUpperCase() + freq.replace('_', ' ').slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Recurring Bill */}
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--background)' }}>
              <div className="flex items-center space-x-3">
                <Repeat size={20} style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <h4 className="font-heading font-medium" style={{ color: 'var(--text-primary)' }}>
                    Recurring Bill
                  </h4>
                  <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                    This bill repeats automatically
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isRecurring')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Auto Pay */}
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--background)' }}>
              <div className="flex items-center space-x-3">
                <CreditCard size={20} style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <h4 className="font-heading font-medium" style={{ color: 'var(--text-primary)' }}>
                    Auto Pay
                  </h4>
                  <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                    Automatically pay this bill
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('autoPay')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Payment Method (if auto pay is enabled) */}
            {autoPay && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Payment Method
                </label>
                <select
                  {...register('paymentMethod')}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select payment method</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="digital_wallet">Digital Wallet</option>
                </select>
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'low', label: 'Low', color: 'text-green-600' },
                  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
                  { value: 'high', label: 'High', color: 'text-red-600' }
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('priority', value as any)}
                    className={`p-3 rounded-lg border transition-all ${
                      watch('priority') === value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={color}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Essential Bill */}
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--background)' }}>
              <div className="flex items-center space-x-3">
                <AlertCircle size={20} style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <h4 className="font-heading font-medium" style={{ color: 'var(--text-primary)' }}>
                    Essential Bill
                  </h4>
                  <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                    This is a critical bill that must be paid
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isEssential')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Reminder Days */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Reminder Days Before Due
              </label>
              <Input
                {...register('reminderDaysBefore', { required: 'Reminder days is required' })}
                type="number"
                min="0"
                max="30"
                placeholder="3"
              />
              {errors.reminderDaysBefore && (
                <p className="text-red-500 text-sm mt-1">{errors.reminderDaysBefore.message}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Notes (Optional)
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any additional notes about this bill"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                onClick={() => navigate('/bills')}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Bill'}
              </Button>
            </div>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-center space-x-2">
              <AlertCircle size={20} className="text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateBill;
