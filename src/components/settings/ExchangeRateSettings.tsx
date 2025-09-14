import React, { useState, useEffect } from 'react';
import { RefreshCw, Edit3, Save, X, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { exchangeRateService } from '../../services/exchangeRateService';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface ExchangeRateSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RateData {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  lastUpdated: Date;
  isEditing: boolean;
  tempRate: number;
}

export const ExchangeRateSettings: React.FC<ExchangeRateSettingsProps> = ({
  isOpen,
  onClose
}) => {
  const { supportedCurrencies, currency } = useInternationalization();
  const [rates, setRates] = useState<RateData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState(currency.code);

  // Load rates when component opens
  useEffect(() => {
    if (isOpen) {
      loadRates();
    }
  }, [isOpen, selectedCurrency]);

  const loadRates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const allRates: RateData[] = [];
      
      // Get rates for selected currency
      for (const targetCurrency of supportedCurrencies) {
        if (targetCurrency.code === selectedCurrency) continue;
        
        try {
          const rate = await exchangeRateService.getExchangeRate(selectedCurrency, targetCurrency.code);
          const history = await exchangeRateService.getRateHistory(selectedCurrency, targetCurrency.code, 1);
          
          allRates.push({
            fromCurrency: selectedCurrency,
            toCurrency: targetCurrency.code,
            rate: rate || 1,
            source: history[0]?.source || 'fallback',
            lastUpdated: history[0] ? new Date(history[0].created_at) : new Date(),
            isEditing: false,
            tempRate: rate || 1
          });
        } catch (error) {
          console.error(`Failed to load rate for ${targetCurrency.code}:`, error);
        }
      }
      
      setRates(allRates);
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
      setError('Failed to load exchange rates');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRates = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      await exchangeRateService.refreshAllRates();
      await loadRates();
    } catch (error) {
      console.error('Failed to refresh rates:', error);
      setError('Failed to refresh exchange rates');
    } finally {
      setIsRefreshing(false);
    }
  };

  const startEditing = (index: number) => {
    const newRates = [...rates];
    newRates[index].isEditing = true;
    newRates[index].tempRate = newRates[index].rate;
    setRates(newRates);
  };

  const cancelEditing = (index: number) => {
    const newRates = [...rates];
    newRates[index].isEditing = false;
    newRates[index].tempRate = newRates[index].rate;
    setRates(newRates);
  };

  const saveRate = async (index: number) => {
    const rateData = rates[index];
    
    try {
      await exchangeRateService.updateManualRate(
        rateData.fromCurrency,
        rateData.toCurrency,
        rateData.tempRate
      );
      
      const newRates = [...rates];
      newRates[index].rate = rateData.tempRate;
      newRates[index].source = 'manual';
      newRates[index].lastUpdated = new Date();
      newRates[index].isEditing = false;
      setRates(newRates);
    } catch (error) {
      console.error('Failed to save rate:', error);
      setError('Failed to save exchange rate');
    }
  };

  const updateTempRate = (index: number, value: string) => {
    const newRates = [...rates];
    newRates[index].tempRate = parseFloat(value) || 0;
    setRates(newRates);
  };

  const getCurrencyInfo = (code: string) => {
    return supportedCurrencies.find(c => c.code === code);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'api':
        return <RefreshCw size={16} className="text-green-600" />;
      case 'manual':
        return <Edit3 size={16} className="text-blue-600" />;
      case 'fallback':
        return <AlertCircle size={16} className="text-orange-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'api':
        return 'Live Rate';
      case 'manual':
        return 'Manual';
      case 'fallback':
        return 'Fallback';
      default:
        return 'Unknown';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Exchange Rate Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Exchange Rates</h3>
            <p className="text-sm text-gray-600">
              Manage exchange rates for currency conversions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {supportedCurrencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            <Button
              onClick={refreshRates}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle size={20} className="text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={24} className="animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading exchange rates...</span>
          </div>
        )}

        {/* Rates List */}
        {!isLoading && (
          <div className="space-y-3">
            {rates.map((rate, index) => {
              const fromInfo = getCurrencyInfo(rate.fromCurrency);
              const toInfo = getCurrencyInfo(rate.toCurrency);
              
              return (
                <div
                  key={`${rate.fromCurrency}-${rate.toCurrency}`}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{fromInfo?.flag || '💱'}</span>
                        <span className="font-medium text-gray-900">{rate.fromCurrency}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-2xl">{toInfo?.flag || '💱'}</span>
                        <span className="font-medium text-gray-900">{rate.toCurrency}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getSourceIcon(rate.source)}
                        <span className="text-sm text-gray-600">
                          {getSourceLabel(rate.source)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {rate.isEditing ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.0001"
                            value={rate.tempRate}
                            onChange={(e) => updateTempRate(index, e.target.value)}
                            className="w-24 text-right"
                          />
                          <Button
                            onClick={() => saveRate(index)}
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            <Save size={14} />
                            <span>Save</span>
                          </Button>
                          <Button
                            onClick={() => cancelEditing(index)}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            <X size={14} />
                            <span>Cancel</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              {rate.rate.toFixed(4)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Updated {rate.lastUpdated.toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            onClick={() => startEditing(index)}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            <Edit3 size={14} />
                            <span>Edit</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle size={20} className="text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">About Exchange Rates</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Live Rate:</strong> Automatically fetched from exchange rate APIs</li>
                <li>• <strong>Manual:</strong> User-adjusted rates that override API rates</li>
                <li>• <strong>Fallback:</strong> Hardcoded rates used when APIs are unavailable</li>
                <li>• Rates are cached for 24 hours to reduce API calls</li>
                <li>• Manual rates take precedence over API rates</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
