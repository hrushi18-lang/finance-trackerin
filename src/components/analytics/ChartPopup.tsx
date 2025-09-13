import React from 'react';
import { X, Calendar, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface ChartPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Record<string, unknown>;
  type: 'ring' | 'bar';
  onRangeSelect?: (startDate: Date, endDate: Date) => void;
}

export const ChartPopup: React.FC<ChartPopupProps> = ({
  isOpen,
  onClose,
  title,
  data,
  type,
  onRangeSelect
}) => {
  const { formatCurrency } = useInternationalization();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-scale-in"
        style={{
          backgroundColor: 'var(--background)',
          boxShadow: '20px 20px 40px rgba(0,0,0,0.2), -20px -20px 40px rgba(255,255,255,0.7)'
        }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--primary)',
                  boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.2), inset -2px -2px 4px rgba(255,255,255,0.3)'
                }}
              >
                {type === 'ring' ? <TrendingUp size={20} className="text-white" /> : <TrendingDown size={20} className="text-white" />}
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold">{title}</h2>
                <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
                  Interactive Analytics
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
            >
              <X size={18} style={{ color: 'var(--text-primary)' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Date Range Selector */}
          <div 
            className="mb-6 p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <Calendar size={18} style={{ color: 'var(--text-primary)' }} />
              <h3 className="font-heading font-medium">Date Range</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Last 7 Days', days: 7 },
                { label: 'Last 30 Days', days: 30 },
                { label: 'Last 3 Months', days: 90 },
                { label: 'Last 6 Months', days: 180 }
              ].map((range) => (
                <button
                  key={range.days}
                  onClick={() => {
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - range.days);
                    onRangeSelect?.(startDate, endDate);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--background)',
                    color: 'var(--text-primary)',
                    boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)'
                  }}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Display */}
          <div 
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <Filter size={18} style={{ color: 'var(--text-primary)' }} />
              <h3 className="font-heading font-medium">Chart Data</h3>
            </div>
            
            {type === 'ring' && data && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-numbers font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(data.value || 0)}
                  </div>
                  <div className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
                    {data.label}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: 'var(--background)',
                      boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
                    }}
                  >
                    <div className="text-sm font-body mb-1" style={{ color: 'var(--text-tertiary)' }}>
                      Amount
                    </div>
                    <div className="text-lg font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(data.value || 0)}
                    </div>
                  </div>
                  
                  <div 
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: 'var(--background)',
                      boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
                    }}
                  >
                    <div className="text-sm font-body mb-1" style={{ color: 'var(--text-tertiary)' }}>
                      Category
                    </div>
                    <div className="text-lg font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
                      {data.label || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {type === 'bar' && data && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-numbers font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {data.month}
                  </div>
                  <div className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
                    Monthly Summary
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: 'var(--background)',
                      boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
                    }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp size={16} style={{ color: 'var(--success)' }} />
                      <div className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
                        Income
                      </div>
                    </div>
                    <div className="text-lg font-numbers font-bold" style={{ color: 'var(--success)' }}>
                      {formatCurrency(data.income || 0)}
                    </div>
                  </div>
                  
                  <div 
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: 'var(--background)',
                      boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
                    }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingDown size={16} style={{ color: 'var(--error)' }} />
                      <div className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
                        Spending
                      </div>
                    </div>
                    <div className="text-lg font-numbers font-bold" style={{ color: 'var(--error)' }}>
                      {formatCurrency(data.spending || 0)}
                    </div>
                  </div>
                </div>
                
                <div 
                  className="p-4 rounded-xl"
                  style={{
                    backgroundColor: 'var(--background)',
                    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
                  }}
                >
                  <div className="text-sm font-body mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    Net Income
                  </div>
                  <div className={`text-xl font-numbers font-bold ${
                    (data.income - data.spending) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency((data.income || 0) - (data.spending || 0))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
