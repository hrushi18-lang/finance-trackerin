import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle, Edit3, DollarSign } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { GlassCard } from '../common/GlassCard';
import { simpleCurrencyService } from '../../services/simpleCurrencyService';

interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  displayRate: string;
}

export const CurrencyRatesSettings: React.FC = () => {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Default rates with slight adjustments
  const defaultRates: CurrencyRate[] = [
    { from: 'USD', to: 'INR', rate: 88.20, displayRate: '88.20' },
    { from: 'INR', to: 'USD', rate: 0.0113, displayRate: '0.0113' },
    { from: 'USD', to: 'EUR', rate: 0.85, displayRate: '0.85' },
    { from: 'EUR', to: 'USD', rate: 1.176, displayRate: '1.176' },
    { from: 'USD', to: 'GBP', rate: 0.73, displayRate: '0.73' },
    { from: 'GBP', to: 'USD', rate: 1.370, displayRate: '1.370' },
    { from: 'EUR', to: 'INR', rate: 103.60, displayRate: '103.60' },
    { from: 'INR', to: 'EUR', rate: 0.0097, displayRate: '0.0097' },
    { from: 'GBP', to: 'INR', rate: 120.00, displayRate: '120.00' },
    { from: 'INR', to: 'GBP', rate: 0.0083, displayRate: '0.0083' },
    { from: 'EUR', to: 'GBP', rate: 0.86, displayRate: '0.86' },
    { from: 'GBP', to: 'EUR', rate: 1.163, displayRate: '1.163' }
  ];

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = () => {
    try {
      const savedRates = localStorage.getItem('userCurrencyRates');
      if (savedRates) {
        const parsedRates = JSON.parse(savedRates);
        setRates(parsedRates.map((rate: any) => ({
          ...rate,
          displayRate: rate.rate.toString()
        })));
      } else {
        setRates(defaultRates.map(rate => ({
          ...rate,
          displayRate: rate.rate.toString()
        })));
      }
    } catch (error) {
      console.error('Error loading rates:', error);
      setRates(defaultRates.map(rate => ({
        ...rate,
        displayRate: rate.rate.toString()
      })));
    }
  };

  const handleRateChange = (index: number, value: string) => {
    const newRates = [...rates];
    newRates[index].displayRate = value;
    setRates(newRates);
  };

  const validateRates = (): boolean => {
    for (const rate of rates) {
      const numValue = parseFloat(rate.displayRate);
      if (isNaN(numValue) || numValue <= 0) {
        setMessage({
          type: 'error',
          text: `Invalid rate for ${rate.from} → ${rate.to}. Please enter a positive number.`
        });
        return false;
      }
    }
    return true;
  };

  const saveRates = async () => {
    if (!validateRates()) return;

    setIsSaving(true);
    try {
      const ratesToSave = rates.map(rate => ({
        from: rate.from,
        to: rate.to,
        rate: parseFloat(rate.displayRate)
      }));

      // Save to localStorage
      localStorage.setItem('userCurrencyRates', JSON.stringify(ratesToSave));

      // Update the currency service
      simpleCurrencyService.updateUserRates(ratesToSave);

      setMessage({
        type: 'success',
        text: 'Currency rates updated successfully!'
      });

      setIsEditing(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to save rates. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setRates(defaultRates.map(rate => ({
      ...rate,
      displayRate: rate.rate.toString()
    })));
    setMessage({
      type: 'success',
      text: 'Rates reset to default values'
    });
  };

  const formatCurrencyPair = (from: string, to: string) => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'INR': '₹',
      'EUR': '€',
      'GBP': '£'
    };
    return `${symbols[from]}1 ${from} = ${symbols[to]}X ${to}`;
  };

  const getRateDescription = (from: string, to: string) => {
    const descriptions: Record<string, string> = {
      'USD-INR': 'US Dollar to Indian Rupee',
      'INR-USD': 'Indian Rupee to US Dollar',
      'USD-EUR': 'US Dollar to Euro',
      'EUR-USD': 'Euro to US Dollar',
      'USD-GBP': 'US Dollar to British Pound',
      'GBP-USD': 'British Pound to US Dollar',
      'EUR-INR': 'Euro to Indian Rupee',
      'INR-EUR': 'Indian Rupee to Euro',
      'GBP-INR': 'British Pound to Indian Rupee',
      'INR-GBP': 'Indian Rupee to British Pound',
      'EUR-GBP': 'Euro to British Pound',
      'GBP-EUR': 'British Pound to Euro'
    };
    return descriptions[`${from}-${to}`] || `${from} to ${to}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Currency Exchange Rates
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage exchange rates for currency conversions
          </p>
        </div>
        
        <div className="flex space-x-3">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit3 size={16} className="mr-2" />
              Edit Rates
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                onClick={saveRates}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save size={16} className="mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  loadRates();
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {rates.map((rate, index) => (
          <GlassCard key={`${rate.from}-${rate.to}`} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {rate.from} → {rate.to}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getRateDescription(rate.from, rate.to)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Exchange Rate
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.0001"
                    value={rate.displayRate}
                    onChange={(e) => handleRateChange(index, e.target.value)}
                    placeholder="Enter rate"
                    className="w-full"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-lg font-mono text-gray-900 dark:text-white">
                      {rate.displayRate}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatCurrencyPair(rate.from, rate.to)}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {isEditing && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Reset to Defaults
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Restore original exchange rates
              </p>
            </div>
            <Button
              onClick={resetToDefaults}
              variant="outline"
              className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-700 dark:hover:bg-orange-900/20"
            >
              <RefreshCw size={16} className="mr-2" />
              Reset
            </Button>
          </div>
        </GlassCard>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Tips
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Rates are used for all currency conversions in the app</li>
          <li>• Changes take effect immediately after saving</li>
          <li>• You can reset to default rates at any time</li>
          <li>• Rates are stored locally on your device</li>
        </ul>
      </div>
    </div>
  );
};
