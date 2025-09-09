import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '../common/Button';

interface StaleRatesBannerProps {
  isVisible: boolean;
  onRefresh: () => void;
  onDismiss: () => void;
  className?: string;
}

export const StaleRatesBanner: React.FC<StaleRatesBannerProps> = ({
  isVisible,
  onRefresh,
  onDismiss,
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Exchange rates may be outdated
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              We're currently using exchange rates from a previous day. 
              This may affect the accuracy of currency conversions.
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh Rates
            </Button>
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="text-yellow-800 hover:bg-yellow-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaleRatesBanner;
