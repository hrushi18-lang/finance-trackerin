import React from 'react';

interface ProgressBarProps {
  current: number;
  target: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  showValues?: boolean;
  color?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  target,
  size = 'md',
  showPercentage = true,
  showValues = true,
  color,
  className = ''
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  
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
            <span className="text-sm font-numbers" style={{ color: 'var(--text-primary)' }}>
              {current.toLocaleString()} / {target.toLocaleString()}
            </span>
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
