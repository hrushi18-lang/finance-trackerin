import React from 'react';
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { ConversionResult } from '../../lib/currency-conversion-service';

interface ConversionTransparencyProps {
  result: ConversionResult;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ConversionTransparency: React.FC<ConversionTransparencyProps> = ({
  result,
  showIcon = true,
  size = 'sm',
  className = ''
}) => {
  const getIcon = () => {
    if (result.isStale) {
      return <AlertTriangle className="text-yellow-500" size={getIconSize()} />;
    }
    if (result.fxSource === 'same_currency') {
      return <CheckCircle className="text-green-500" size={getIconSize()} />;
    }
    return <Info className="text-blue-500" size={getIconSize()} />;
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 12;
      case 'md': return 14;
      case 'lg': return 16;
      default: return 12;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'md': return 'text-sm';
      case 'lg': return 'text-base';
      default: return 'text-xs';
    }
  };

  const getContainerClasses = () => {
    const baseClasses = 'flex items-center gap-1 text-gray-600';
    const sizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    };
    return `${baseClasses} ${sizeClasses[size]} ${className}`;
  };

  if (result.fxSource === 'same_currency') {
    return (
      <div className={getContainerClasses()}>
        {showIcon && getIcon()}
        <span>Same currency - no conversion needed</span>
      </div>
    );
  }

  return (
    <div className={getContainerClasses()}>
      {showIcon && getIcon()}
      <span className={getTextSize()}>
        Converted using rate <span className="font-mono font-medium">{result.fxRate.toFixed(6)}</span>
        {' '}({result.fxSource}) on {result.fxDate}
        {result.isStale && (
          <span className="text-yellow-600 font-medium ml-1">
            (stale)
          </span>
        )}
      </span>
    </div>
  );
};

export default ConversionTransparency;
