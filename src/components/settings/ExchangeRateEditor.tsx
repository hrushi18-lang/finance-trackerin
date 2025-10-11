import React, { useState, useEffect } from 'react';
import { X, Info, AlertTriangle } from 'lucide-react';
import { simpleCurrencyService } from '../../services/simpleCurrencyService';

interface ExchangeRateEditorProps {
  from: string;
  to: string;
  onSave: () => void;
  onCancel: () => void;
}

const ExchangeRateEditor: React.FC<ExchangeRateEditorProps> = ({ 
  from, 
  to, 
  onSave, 
  onCancel 
}) => {
  const [newRate, setNewRate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const currentRate = simpleCurrencyService.getRate(from, to);
  const defaultRate = simpleCurrencyService.getDefaultRate(from, to);
  const isCustom = simpleCurrencyService.isCustomRate(from, to);
  const metadata = simpleCurrencyService.getRateMetadata(from, to);

  useEffect(() => {
    setNewRate(currentRate.toString());
    if (metadata?.notes) {
      setNotes(metadata.notes);
    }
    validateRate();
  }, [from, to, currentRate]);

  const validateRate = (value?: string) => {
    const rate = parseFloat(value || newRate);
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    if (isNaN(rate) || rate <= 0) {
      newErrors.push('Rate must be a positive number');
    }

    if (!isNaN(rate) && rate > 0) {
      const deviation = Math.abs(rate - defaultRate) / defaultRate;
      if (deviation > 0.2) {
        newWarnings.push(
          `${(deviation * 100).toFixed(1)}% from default`
        );
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
  };

  const handleRateChange = (value: string) => {
    setNewRate(value);
    validateRate(value);
  };

  const handleSave = () => {
    const rate = parseFloat(newRate);
    
    if (errors.length > 0) return;
    if (isNaN(rate) || rate <= 0) {
      setErrors(['Rate must be a positive number']);
      return;
    }

    simpleCurrencyService.saveUserRate(from, to, rate, notes.trim() || undefined);
    onSave();
  };

  const handleResetToDefault = () => {
    if (isCustom) {
      simpleCurrencyService.deleteUserRate(from, to);
      onSave();
    }
  };

  const calculateInverse = () => {
    const rate = parseFloat(newRate);
    if (!isNaN(rate) && rate > 0) return 1 / rate;
    return 0;
  };

  const previewConversion = (amount: number) => {
    const rate = parseFloat(newRate);
    if (!isNaN(rate) && rate > 0) return amount * rate;
    return 0;
  };

  const formatAmount = (amount: number, currency: string) => {
    const symbol = simpleCurrencyService.getCurrencySymbol(currency);
    return `${symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div 
        className="w-full max-h-[90vh] overflow-y-auto rounded-t-3xl"
        style={{
          backgroundColor: 'var(--background)',
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-heading" style={{ color: 'var(--text-primary)' }}>
              Edit Rate
            </h3>
            <button
              onClick={onCancel}
              className="p-2 rounded-full transition-all"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
            >
              <X size={18} style={{ color: 'var(--text-primary)' }} />
            </button>
          </div>

          {/* Rate Pair */}
          <div 
            className="rounded-2xl p-4 mb-6 text-center"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="text-2xl font-heading mb-1" style={{ color: 'var(--text-primary)' }}>
              {from} → {to}
            </div>
            <div className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              {simpleCurrencyService.getCurrencyName(from)} to {simpleCurrencyService.getCurrencyName(to)}
            </div>
          </div>

          {/* Current vs Default */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div 
              className="rounded-xl p-3"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)'
              }}
            >
              <div className="text-xs font-body mb-1" style={{ color: 'var(--text-secondary)' }}>
                Current
              </div>
              <div className="text-lg font-heading" style={{ color: 'var(--primary)' }}>
                {currentRate.toFixed(4)}
              </div>
              {isCustom && (
                <div className="text-xs font-body" style={{ color: 'var(--primary)' }}>Custom</div>
              )}
            </div>
            <div 
              className="rounded-xl p-3"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)'
              }}
            >
              <div className="text-xs font-body mb-1" style={{ color: 'var(--text-secondary)' }}>
                Default
              </div>
              <div className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>
                {defaultRate.toFixed(4)}
              </div>
              <div className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>System</div>
            </div>
          </div>

          {/* Rate Input */}
          <div className="mb-4">
            <label className="block text-sm font-body mb-2" style={{ color: 'var(--text-secondary)' }}>
              New Exchange Rate
            </label>
            <div className="relative">
              <input
                type="number"
                value={newRate}
                onChange={(e) => handleRateChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl font-heading text-lg"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  color: 'var(--text-primary)',
                  boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)',
                  border: errors.length > 0 ? '2px solid var(--danger)' : 'none'
                }}
                placeholder="Enter rate..."
                step="0.0001"
                min="0"
              />
              <div className="absolute right-4 top-3 text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
                {to}
              </div>
            </div>
            
            {errors.length > 0 && (
              <div className="mt-2 text-sm font-body flex items-center gap-1" style={{ color: 'var(--danger)' }}>
                <AlertTriangle size={14} />
                <span>{errors[0]}</span>
              </div>
            )}
            {warnings.length > 0 && (
              <div className="mt-2 text-sm font-body flex items-center gap-1" style={{ color: '#f59e0b' }}>
                <Info size={14} />
                <span>{warnings[0]}</span>
              </div>
            )}
          </div>

          {/* Inverse Rate */}
          <div 
            className="rounded-xl p-3 mb-4"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
            }}
          >
            <div className="text-xs font-body mb-1" style={{ color: 'var(--text-secondary)' }}>
              Inverse Rate (Auto-calculated)
            </div>
            <div className="text-sm font-heading" style={{ color: 'var(--text-primary)' }}>
              1 {to} = {calculateInverse().toFixed(6)} {from}
            </div>
          </div>

          {/* Preview */}
          <div 
            className="rounded-xl p-3 mb-4"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="text-xs font-body mb-2" style={{ color: 'var(--text-secondary)' }}>
              Preview
            </div>
            <div className="space-y-1 text-sm font-body" style={{ color: 'var(--text-primary)' }}>
              <div>{formatAmount(100, from)} = {formatAmount(previewConversion(100), to)}</div>
              <div>{formatAmount(1000, from)} = {formatAmount(previewConversion(1000), to)}</div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-body mb-2" style={{ color: 'var(--text-secondary)' }}>
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl font-body text-sm"
              style={{
                backgroundColor: 'var(--background-secondary)',
                color: 'var(--text-primary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
              placeholder="Add notes (e.g., bank rate, market rate)..."
              rows={3}
            />
          </div>

          {/* Last Updated */}
          {metadata?.lastUpdated && (
            <div className="mb-6 text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
              Last updated: {new Date(metadata.lastUpdated).toLocaleString()}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {isCustom && (
              <button
                onClick={handleResetToDefault}
                className="w-full px-4 py-3 rounded-xl font-heading transition-all active:scale-95"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  color: 'var(--text-secondary)',
                  boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)'
                }}
              >
                Reset to Default
              </button>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 rounded-xl font-heading transition-all active:scale-95"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  color: 'var(--text-primary)',
                  boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={errors.length > 0}
                className="flex-1 px-4 py-3 rounded-xl font-heading transition-all active:scale-95"
                style={{
                  backgroundColor: errors.length > 0 ? '#d1d5db' : 'var(--primary)',
                  color: 'white',
                  boxShadow: '4px 4px 8px rgba(0,0,0,0.2), -4px -4px 8px rgba(255,255,255,0.3)',
                  cursor: errors.length > 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Save Rate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeRateEditor;
