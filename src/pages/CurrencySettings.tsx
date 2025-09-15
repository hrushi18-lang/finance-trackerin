import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { CurrencySelector } from '../components/currency/CurrencySelector';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';

const CurrencySettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { 
    currency, 
    secondaryCurrency, 
    setCurrency, 
    setSecondaryCurrency, 
    supportedCurrencies,
    formatCurrency 
  } = useInternationalization();

  const [primaryCurrency, setPrimaryCurrency] = useState(currency.code);
  const [secondaryCurrencyCode, setSecondaryCurrencyCode] = useState(secondaryCurrency?.code || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update local state when context changes
  useEffect(() => {
    setPrimaryCurrency(currency.code);
    setSecondaryCurrencyCode(secondaryCurrency?.code || '');
  }, [currency.code, secondaryCurrency?.code]);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update profile with new currency settings
      await updateProfile({
        primaryCurrency,
        displayCurrency: secondaryCurrencyCode || primaryCurrency
      });

      // Update internationalization context
      const selectedPrimary = supportedCurrencies.find(c => c.code === primaryCurrency);
      if (selectedPrimary) {
        setCurrency(selectedPrimary);
      }

      if (secondaryCurrencyCode) {
        const selectedSecondary = supportedCurrencies.find(c => c.code === secondaryCurrencyCode);
        if (selectedSecondary) {
          setSecondaryCurrency(selectedSecondary);
        }
      } else {
        setSecondaryCurrency(null);
      }

      setSuccess('Currency settings updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update currency settings. Please try again.');
      console.error('Currency update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPrimaryCurrency(currency.code);
    setSecondaryCurrencyCode(secondaryCurrency?.code || '');
    setError(null);
    setSuccess(null);
  };

  const currentPrimary = supportedCurrencies.find(c => c.code === primaryCurrency);
  const currentSecondary = supportedCurrencies.find(c => c.code === secondaryCurrencyCode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate('/settings')}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Currency Settings</h1>
            <p className="text-gray-600">Manage your primary and secondary currencies</p>
          </div>
        </div>

        {/* Current Settings Display */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Primary Currency</p>
                <p className="text-sm text-gray-600">
                  {currentPrimary?.name} ({currentPrimary?.symbol})
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(1000)}
                </p>
                <p className="text-xs text-gray-500">Example: 1,000</p>
              </div>
            </div>

            {secondaryCurrency && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Secondary Currency</p>
                  <p className="text-sm text-gray-600">
                    {currentSecondary?.name} ({currentSecondary?.symbol})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(1000, secondaryCurrencyCode)}
                  </p>
                  <p className="text-xs text-gray-500">Example: 1,000</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Currency Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Currencies</h2>
          
          <div className="space-y-6">
            {/* Primary Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Currency *
              </label>
              <CurrencySelector
                value={primaryCurrency}
                onChange={setPrimaryCurrency}
                showFlag={true}
                showFullName={true}
                popularOnly={false}
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be your main currency for all transactions and displays
              </p>
            </div>

            {/* Secondary Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Currency (Optional)
              </label>
              <CurrencySelector
                value={secondaryCurrencyCode}
                onChange={setSecondaryCurrencyCode}
                showFlag={true}
                showFullName={true}
                popularOnly={false}
                excludeCurrency={primaryCurrency}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional secondary currency for dual-currency displays
              </p>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSave}
              disabled={isLoading || primaryCurrency === currency.code && secondaryCurrencyCode === (secondaryCurrency?.code || '')}
              className="flex-1"
            >
              <Save size={16} className="mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isLoading}
            >
              <RotateCcw size={16} className="mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">About Currency Settings</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your primary currency will be used for all transactions and calculations</li>
            <li>• Secondary currency is optional and used for dual-currency displays</li>
            <li>• Changing currencies will update all existing data displays</li>
            <li>• Exchange rates are updated automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CurrencySettings;
