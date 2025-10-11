import React from 'react';
import { simpleCurrencyService } from '../../services/simpleCurrencyService';

interface ProgressBarProps {
  current: number;
  target: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  showValues?: boolean;
  color?: string;
  className?: string;
  currency?: string; // ✅ Add currency prop to show the true data
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  target,
  size = 'md',
  showPercentage = true,
  showValues = true,
  color,
  className = '',
  currency // ✅ Accept currency prop
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  
  // ✅ Format amounts with currency if provided
  const formatAmount = (amount: number) => {
    if (!currency) {
      return amount.toLocaleString();
    }
    const symbol = simpleCurrencyService.getCurrencySymbol(currency);
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const getProgressColor = () => {
    if (color) return color;
    
    if (percentage >= 100) return 'var(--success)';
    if (percentage >= 75) return 'var(--primary)';
    if (percentage >= 50) return 'var(--accent)';
    if (percentage >= 25) return 'var(--warning)';
    return 'var(--error)';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Bar */}
      <div className={`w-full rounded-full overflow-hidden ${sizeClasses[size]}`} style={{ backgroundColor: 'var(--background-secondary)' }}>
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${sizeClasses[size]}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: getProgressColor()
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {showValues && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-numbers" style={{ color: 'var(--text-primary)' }}>
                {formatAmount(current)} / {formatAmount(target)}
              </span>
              {currency && (
                <span className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
                  {currency}
                </span>
              )}
            </div>
          )}
        </div>
        
        {showPercentage && (
          <span className="text-sm font-numbers font-medium" style={{ color: 'var(--text-secondary)' }}>
            {percentage.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
};
