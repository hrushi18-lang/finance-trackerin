import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  RotateCcw,
  Download,
  Upload,
  Info
} from 'lucide-react';
import { simpleCurrencyService } from '../../services/simpleCurrencyService';
import { useProfile } from '../../contexts/ProfileContext';
import ExchangeRateEditor from '../../components/settings/ExchangeRateEditor';
import RateMatrix from '../../components/settings/RateMatrix';

interface RateDisplayData {
  from: string;
  to: string;
  rate: number;
  defaultRate: number;
  isCustom: boolean;
  lastUpdated?: string;
  notes?: string;
}

const ExchangeRateSettings: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [rates, setRates] = useState<RateDisplayData[]>([]);
  const [editingRate, setEditingRate] = useState<{from: string; to: string} | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [importResult, setImportResult] = useState<{success: boolean; imported: number; errors: string[]} | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const primaryCurrency = profile?.primaryCurrency || 'INR';

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = () => {
    const allRates = simpleCurrencyService.getAllRatesForDisplay();
    setRates(allRates);
  };

  const handleEditRate = (from: string, to: string) => {
    setEditingRate({ from, to });
  };

  const handleRateSaved = () => {
    setEditingRate(null);
    loadRates();
  };

  const handleExportRates = () => {
    const exportData = simpleCurrencyService.exportRates();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exchange-rates-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportRates = () => {
    if (!importData.trim()) return;

    const result = simpleCurrencyService.importRates(importData);
    setImportResult(result);
    
    if (result.success) {
      loadRates();
      setImportData('');
      setTimeout(() => setShowImportModal(false), 2000);
    }
  };

  const handleResetAllRates = () => {
    simpleCurrencyService.resetAllRates();
    loadRates();
    setShowResetConfirm(false);
  };

  const getCustomRatesCount = () => {
    return rates.filter(rate => rate.isCustom).length;
  };

  const getLastUpdated = () => {
    const customRates = rates.filter(rate => rate.isCustom && rate.lastUpdated);
    if (customRates.length === 0) return null;
    
    const latest = customRates.reduce((latest, current) => {
      if (!latest.lastUpdated) return current;
      if (!current.lastUpdated) return latest;
      return new Date(current.lastUpdated) > new Date(latest.lastUpdated) ? current : latest;
    });
    
    return latest.lastUpdated;
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="pt-12 pb-6 px-4">
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
            }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1 className="text-2xl font-heading" style={{ color: 'var(--text-primary)' }}>Exchange Rates</h1>
        </div>
        
        {/* Currency Info Card */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{
            backgroundColor: 'var(--background-secondary)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-body mb-1" style={{ color: 'var(--text-secondary)' }}>
                Primary Currency
              </h2>
              <p className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>
                {primaryCurrency} - {simpleCurrencyService.getCurrencyName(primaryCurrency)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Custom Rates</div>
              <div className="text-2xl font-heading" style={{ color: 'var(--primary)' }}>{getCustomRatesCount()}</div>
            </div>
          </div>
          
          {getLastUpdated() && (
            <div className="flex items-center gap-2 mt-3 text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
              <Info size={14} />
              <span>Updated: {new Date(getLastUpdated()!).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <h2 className="text-sm font-body mb-3 px-2" style={{ color: 'var(--text-secondary)' }}>
          ACTIONS
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="rounded-xl p-4 transition-all duration-200 active:scale-95"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <Upload size={20} className="mx-auto mb-2" style={{ color: 'var(--primary)' }} />
            <span className="text-xs font-body block" style={{ color: 'var(--text-primary)' }}>Import</span>
          </button>
          
          <button
            onClick={handleExportRates}
            className="rounded-xl p-4 transition-all duration-200 active:scale-95"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <Download size={20} className="mx-auto mb-2" style={{ color: 'var(--primary)' }} />
            <span className="text-xs font-body block" style={{ color: 'var(--text-primary)' }}>Export</span>
          </button>
          
          <button
            onClick={() => setShowResetConfirm(true)}
            className="rounded-xl p-4 transition-all duration-200 active:scale-95"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <RotateCcw size={20} className="mx-auto mb-2" style={{ color: 'var(--danger)' }} />
            <span className="text-xs font-body block" style={{ color: 'var(--text-primary)' }}>Reset</span>
          </button>
        </div>
      </div>

      {/* Exchange Rates */}
      <div className="px-4 mb-6">
        <h2 className="text-sm font-body mb-3 px-2" style={{ color: 'var(--text-secondary)' }}>
          EXCHANGE RATES
        </h2>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--background-secondary)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <RateMatrix 
            rates={rates}
            onEditRate={handleEditRate}
            primaryCurrency={primaryCurrency}
          />
        </div>
      </div>

      {/* Rate Editor Modal */}
      {editingRate && (
        <ExchangeRateEditor
          from={editingRate.from}
          to={editingRate.to}
          onSave={handleRateSaved}
          onCancel={() => setEditingRate(null)}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="rounded-2xl max-w-md w-full"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.2), -8px -8px 16px rgba(255,255,255,0.8)'
            }}
          >
            <div className="p-6">
              <h3 className="text-lg font-heading mb-4" style={{ color: 'var(--text-primary)' }}>
                Import Exchange Rates
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-body mb-2" style={{ color: 'var(--text-secondary)' }}>
                  JSON Data
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="w-full h-32 px-3 py-2 rounded-xl font-body text-sm"
                  style={{
                    backgroundColor: 'var(--background)',
                    color: 'var(--text-primary)',
                    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
                  }}
                  placeholder="Paste JSON data here..."
                />
              </div>

              {importResult && (
                <div 
                  className="mb-4 p-3 rounded-xl"
                  style={{
                    backgroundColor: importResult.success ? '#ecfdf5' : '#fef2f2',
                    color: importResult.success ? '#065f46' : '#991b1b'
                  }}
                >
                  <div className="text-sm font-body font-medium">
                    {importResult.success 
                      ? `Successfully imported ${importResult.imported} rates`
                      : 'Import failed'
                    }
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="text-sm mt-1">
                      {importResult.errors.map((error, index) => (
                        <div key={index}>• {error}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleImportRates}
                  className="flex-1 px-4 py-3 rounded-xl font-heading transition-all active:scale-95"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    boxShadow: '4px 4px 8px rgba(0,0,0,0.2), -4px -4px 8px rgba(255,255,255,0.3)'
                  }}
                >
                  Import
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportData('');
                    setImportResult(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl font-heading transition-all active:scale-95"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    color: 'var(--text-primary)',
                    boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="rounded-2xl max-w-md w-full"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.2), -8px -8px 16px rgba(255,255,255,0.8)'
            }}
          >
            <div className="p-6">
              <h3 className="text-lg font-heading mb-4" style={{ color: 'var(--text-primary)' }}>
                Reset All Rates
              </h3>
              <p className="text-sm font-body mb-6" style={{ color: 'var(--text-secondary)' }}>
                This will reset all custom exchange rates to their default values. 
                This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleResetAllRates}
                  className="flex-1 px-4 py-3 rounded-xl font-heading transition-all active:scale-95"
                  style={{
                    backgroundColor: 'var(--danger)',
                    color: 'white',
                    boxShadow: '4px 4px 8px rgba(0,0,0,0.2), -4px -4px 8px rgba(255,255,255,0.3)'
                  }}
                >
                  Reset All
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-heading transition-all active:scale-95"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    color: 'var(--text-primary)',
                    boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeRateSettings;
