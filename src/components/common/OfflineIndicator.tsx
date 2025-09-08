import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  isOnline, 
  className = '' 
}) => {
  if (isOnline) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 ${className}`}>
      <WifiOff size={16} />
      <span className="text-sm font-medium">Offline Mode</span>
    </div>
  );
};
