import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContextOffline';

interface OfflineIndicatorProps {
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const { isOffline, syncStatus } = useFinance();

  if (!isOffline && syncStatus.pendingChanges === 0) {
    return null; // Don't show anything when online and synced
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      {isOffline ? (
        <div className="flex items-center space-x-2 bg-orange-100 text-orange-800 px-3 py-2 rounded-lg shadow-lg border border-orange-200">
          <WifiOff size={16} />
          <span className="text-sm font-medium">Offline Mode</span>
        </div>
      ) : syncStatus.pendingChanges > 0 ? (
        <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg shadow-lg border border-blue-200">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm font-medium">
            Syncing {syncStatus.pendingChanges} changes...
          </span>
        </div>
      ) : syncStatus.lastError ? (
        <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-2 rounded-lg shadow-lg border border-red-200">
          <AlertCircle size={16} />
          <span className="text-sm font-medium">Sync Error</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg shadow-lg border border-green-200">
          <Wifi size={16} />
          <span className="text-sm font-medium">Synced</span>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;