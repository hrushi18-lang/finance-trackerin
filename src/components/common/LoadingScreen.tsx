import React from 'react';
import { Wallet, Sparkles } from 'lucide-react';
import Silk from '../background/Silk';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading your financial data...' 
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
        <p className="text-forest-200 mb-6 font-body">{message}</p>
        
        <div className="w-48 h-2 bg-forest-700/30 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-forest-500 via-forest-400 to-forest-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
        
        <div className="mt-8 text-sm text-forest-300 font-body">
          <p>Your financial journey is loading...</p>
        </div>
      </div>
    </div>
  );
};
