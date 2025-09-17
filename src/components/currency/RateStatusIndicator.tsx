import React from 'react';
import { RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react';
import { currencyService } from '../../services/currencyService';

interface RateStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const RateStatusIndicator: React.FC<RateStatusIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const rateStatus = currencyService.getRateStatus();
  
  const getStatusColor = () => {
    if (rateStatus.source === 'fallback') return 'text-red-500';
    if (rateStatus.isFresh) return 'text-green-500';
    if (rateStatus.hoursOld < 6) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getStatusIcon = () => {
    if (rateStatus.source === 'fallback') return <WifiOff size={14} />;
    if (rateStatus.isFresh) return <Wifi size={14} />;
    return <Clock size={14} />;
  };

  const getStatusText = () => {
    if (rateStatus.source === 'fallback') return 'Offline rates';
    if (rateStatus.isFresh) return 'Live rates';
    if (rateStatus.hoursOld < 1) return 'Recent rates';
    if (rateStatus.hoursOld < 24) return `${rateStatus.hoursOld}h old`;
    return 'Stale rates';
  };

  const formatLastUpdated = () => {
    if (!rateStatus.lastUpdated) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - rateStatus.lastUpdated.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return rateStatus.lastUpdated.toLocaleDateString();
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-xs font-medium">
          {getStatusText()}
        </span>
      </div>
      
      {showDetails && (
        <div className="text-xs text-gray-500">
          • {formatLastUpdated()}
        </div>
      )}
      
      <button
        onClick={() => currencyService.refreshRates()}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Refresh exchange rates"
      >
        <RefreshCw size={12} className="text-gray-400 hover:text-gray-600" />
      </button>
    </div>
  );
};
