import React from 'react';
import { Wallet, Sparkles } from 'lucide-react';
import Silk from '../background/Silk';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading your financial data...',
  submessage,
  showRetry = false,
  onRetry
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-800">
      <div className="absolute inset-0 bg-gradient-to-br from-forest-900 via-forest-800 to-forest-700"></div>
      <div className="relative z-10 flex flex-col items-center text-center p-8">
        <div className="relative">
          <div className="w-20 h-20 bg-forest-600/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Wallet size={40} className="text-forest-400" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles size={24} className="text-forest-300 animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-2xl font-heading font-bold text-white mb-3">FinTrack</h2>
        <p className="text-forest-200 mb-2 font-body">{message}</p>
        {submessage && (
          <p className="text-forest-300 mb-6 font-body text-sm">{submessage}</p>
        )}
        
        <div className="w-48 h-2 bg-forest-700/30 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-forest-500 via-forest-400 to-forest-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
        
        <div className="mt-8 text-sm text-forest-300 font-body">
          <p>Your financial journey is loading...</p>
        </div>

        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 px-6 py-3 bg-forest-600 hover:bg-forest-500 text-white rounded-lg font-medium transition-colors"
          >
            Retry Loading
          </button>
        )}
      </div>
    </div>
  );
};
