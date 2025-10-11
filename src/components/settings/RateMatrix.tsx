import React from 'react';
import { Edit } from 'lucide-react';
import { simpleCurrencyService } from '../../services/simpleCurrencyService';

interface RateDisplayData {
  from: string;
  to: string;
  rate: number;
  defaultRate: number;
  isCustom: boolean;
  lastUpdated?: string;
  notes?: string;
}

interface RateMatrixProps {
  rates: RateDisplayData[];
  onEditRate: (from: string, to: string) => void;
  primaryCurrency: string;
}

const RateMatrix: React.FC<RateMatrixProps> = ({ rates, onEditRate, primaryCurrency }) => {
  const formatRate = (rate: number): string => {
    if (rate >= 1) {
      return rate.toFixed(4);
    } else {
      return rate.toFixed(6);
    }
  };

  return (
    <div className="divide-y divide-gray-200">
      {rates.map((rate, index) => (
        <button
          key={`${rate.from}-${rate.to}`}
          onClick={() => onEditRate(rate.from, rate.to)}
          className="w-full p-4 flex items-center justify-between active:bg-gray-50 transition-colors"
        >
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-heading" style={{ color: 'var(--text-primary)' }}>
                {rate.from} → {rate.to}
              </span>
              {rate.isCustom && (
                <span className="px-2 py-0.5 rounded-full text-xs font-body" style={{ 
                  backgroundColor: 'var(--primary)', 
                  color: 'white' 
                }}>
                  Custom
                </span>
              )}
            </div>
            <div className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              1 {rate.from} = {formatRate(rate.rate)} {rate.to}
            </div>
            {rate.isCustom && (
              <div className="text-xs font-body mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Default: {formatRate(rate.defaultRate)}
              </div>
            )}
            {rate.lastUpdated && (
              <div className="text-xs font-body mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Updated: {new Date(rate.lastUpdated).toLocaleDateString()}
              </div>
            )}
          </div>
          <Edit size={16} style={{ color: 'var(--text-tertiary)' }} />
        </button>
      ))}
    </div>
  );
};

export default RateMatrix;
