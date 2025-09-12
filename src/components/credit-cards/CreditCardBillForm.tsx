import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CreditCard, Calendar, Percent, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useCreditCardBills } from '../../contexts/CreditCardBillContext';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CreditCardBillFormData, MidCycleImportData } from '../../types/credit_card_bills';

interface CreditCardBillFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreditCardBillFormData | MidCycleImportData) => Promise<void>;
  initialData?: Partial<CreditCardBillFormData>;
  isMidCycleImport?: boolean;
}

export const CreditCardBillForm: React.FC<CreditCardBillFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isMidCycleImport = false
}) => {
  const { accounts } = useFinance();
  const { supportedCurrencies } = useInternationalization();
  const { getCreditCardSettings, calculateMinimumDue } = useCreditCardBills();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [settings, setSettings] = useState<any>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<CreditCardBillFormData | MidCycleImportData>({
    defaultValues: {
      billingCycleStartDay: 1,
      billingCycleEndDay: 30,
      dueDateDaysAfterStatement: 15,
      minimumDuePercentage: 5.0,
      autoPayEnabled: false,
      autoPayAmountType: 'minimum',
      reminderDaysBeforeDue: [7, 3, 1],
      sendSpendingAlerts: true,
      spendingAlertThresholds: [50, 75, 90],
      sendOverdueAlerts: true,
      primaryCurrency: 'USD',
      displayCurrency: 'USD',
      ...initialData
    }
  });

  const watchedAccount = watch('creditCardAccountId' as keyof (CreditCardBillFormData | MidCycleImportData));
  const watchedBalance = watch('currentOutstandingBalance' as keyof (CreditCardBillFormData | MidCycleImportData));

  // Load settings when account changes
  useEffect(() => {
    if (watchedAccount) {
      getCreditCardSettings(watchedAccount as string).then(setSettings);
    }
  }, [watchedAccount, getCreditCardSettings]);

  // Calculate minimum due when balance or percentage changes
  useEffect(() => {
    if (isMidCycleImport && watchedBalance && settings?.minimumDuePercentage) {
      const minimumDue = calculateMinimumDue(watchedBalance as number, settings.minimumDuePercentage);
      setValue('minimumDuePercentage' as keyof (CreditCardBillFormData | MidCycleImportData), settings.minimumDuePercentage);
    }
  }, [watchedBalance, settings, isMidCycleImport, calculateMinimumDue, setValue]);

  const creditCardAccounts = accounts.filter(account => account.type === 'credit_card');

  const handleFormSubmit = async (data: CreditCardBillFormData | MidCycleImportData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Validate required fields
      if (!data.creditCardAccountId) {
        setError('Please select a credit card account');
        return;
      }
      
      if (isMidCycleImport) {
        const importData = data as MidCycleImportData;
        if (!importData.currentOutstandingBalance || importData.currentOutstandingBalance <= 0) {
          setError('Please enter a valid outstanding balance');
          return;
        }
        if (!importData.nextDueDate) {
          setError('Please select the next due date');
          return;
        }
      }
      
      await onSubmit(data);
      reset();
      onClose();
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(err.message || 'Failed to save credit card bill settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isMidCycleImport ? 'Import Mid-Cycle Balance' : 'Credit Card Bill Settings'}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Credit Card Account Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Credit Card Account
          </label>
          <select
            {...register('creditCardAccountId' as keyof (CreditCardBillFormData | MidCycleImportData), { required: 'Please select a credit card account' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            <option value="">Select a credit card account</option>
            {creditCardAccounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.currency})
              </option>
            ))}
          </select>
          {errors.creditCardAccountId && (
            <p className="mt-1 text-sm text-red-600">{errors.creditCardAccountId.message}</p>
          )}
        </div>

        {isMidCycleImport && (
          <>
            {/* Current Outstanding Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Outstanding Balance
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('currentOutstandingBalance' as keyof (CreditCardBillFormData | MidCycleImportData), { 
                  required: 'Please enter the outstanding balance',
                  min: { value: 0.01, message: 'Balance must be greater than 0' }
                })}
                placeholder="0.00"
              />
              {errors.currentOutstandingBalance && (
                <p className="mt-1 text-sm text-red-600">{errors.currentOutstandingBalance.message}</p>
              )}
            </div>

            {/* Next Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Due Date
              </label>
              <Input
                type="date"
                {...register('nextDueDate' as keyof (CreditCardBillFormData | MidCycleImportData), { 
                  required: 'Please select the next due date' 
                })}
              />
              {errors.nextDueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.nextDueDate.message}</p>
              )}
            </div>
          </>
        )}

        {/* Billing Cycle Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Billing Cycle Settings
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cycle Start Day
              </label>
              <Input
                type="number"
                min="1"
                max="31"
                {...register('billingCycleStartDay' as keyof (CreditCardBillFormData | MidCycleImportData), { 
                  required: 'Please enter cycle start day',
                  min: { value: 1, message: 'Must be between 1-31' },
                  max: { value: 31, message: 'Must be between 1-31' }
                })}
              />
              {errors.billingCycleStartDay && (
                <p className="mt-1 text-sm text-red-600">{errors.billingCycleStartDay.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cycle End Day
              </label>
              <Input
                type="number"
                min="1"
                max="31"
                {...register('billingCycleEndDay' as keyof (CreditCardBillFormData | MidCycleImportData), { 
                  required: 'Please enter cycle end day',
                  min: { value: 1, message: 'Must be between 1-31' },
                  max: { value: 31, message: 'Must be between 1-31' }
                })}
              />
              {errors.billingCycleEndDay && (
                <p className="mt-1 text-sm text-red-600">{errors.billingCycleEndDay.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date (Days After Statement)
            </label>
            <Input
              type="number"
              min="1"
              max="60"
              {...register('dueDateDaysAfterStatement' as keyof (CreditCardBillFormData | MidCycleImportData), { 
                required: 'Please enter due date days',
                min: { value: 1, message: 'Must be between 1-60' },
                max: { value: 60, message: 'Must be between 1-60' }
              })}
            />
            {errors.dueDateDaysAfterStatement && (
              <p className="mt-1 text-sm text-red-600">{errors.dueDateDaysAfterStatement.message}</p>
            )}
          </div>
        </div>

        {/* Payment Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Percent className="h-5 w-5 mr-2" />
            Payment Settings
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Due Percentage
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('minimumDuePercentage' as keyof (CreditCardBillFormData | MidCycleImportData), { 
                  required: 'Please enter minimum due percentage',
                  min: { value: 0.01, message: 'Must be greater than 0' },
                  max: { value: 100, message: 'Must be less than 100' }
                })}
                placeholder="5.0"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
            {errors.minimumDuePercentage && (
              <p className="mt-1 text-sm text-red-600">{errors.minimumDuePercentage.message}</p>
            )}
            {isMidCycleImport && watchedBalance && settings?.minimumDuePercentage && (
              <p className="mt-1 text-sm text-gray-600">
                Minimum due: {calculateMinimumDue(watchedBalance as number, settings.minimumDuePercentage).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Currency Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Currency Settings
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Currency
              </label>
              <select
                {...register('primaryCurrency' as keyof (CreditCardBillFormData | MidCycleImportData), { required: 'Please select primary currency' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {supportedCurrencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              {errors.primaryCurrency && (
                <p className="mt-1 text-sm text-red-600">{errors.primaryCurrency.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Currency
              </label>
              <select
                {...register('displayCurrency' as keyof (CreditCardBillFormData | MidCycleImportData), { required: 'Please select display currency' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {supportedCurrencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              {errors.displayCurrency && (
                <p className="mt-1 text-sm text-red-600">{errors.displayCurrency.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isMidCycleImport ? 'Importing...' : 'Saving...'}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {isMidCycleImport ? 'Import Balance' : 'Save Settings'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
