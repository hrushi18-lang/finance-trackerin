import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface MobileLoadingGuardProps {
  children: React.ReactNode;
  maxLoadingTime?: number;
}

export const MobileLoadingGuard: React.FC<MobileLoadingGuardProps> = ({ 
  children, 
  maxLoadingTime = 15000 // 15 seconds max
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [isNative] = useState(Capacitor.isNativePlatform());

  useEffect(() => {
    // Only apply timeout protection on mobile
    if (!isNative) {
      setIsLoading(false);
      return;
    }

    // Set a maximum loading time
    const timeoutId = setTimeout(() => {
      console.warn('Mobile loading timeout reached - forcing app to show');
      setHasTimedOut(true);
      setIsLoading(false);
    }, maxLoadingTime);

    // Also try to detect when the app is actually ready
    const checkReady = () => {
      // Check if critical elements are loaded
      const hasRoot = document.getElementById('root');
      const hasContent = document.querySelector('[data-app-content]');
      
      if (hasRoot && hasContent) {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    // Check immediately and then periodically
    checkReady();
    const intervalId = setInterval(checkReady, 1000);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isNative, maxLoadingTime]);

  // Show a minimal loading screen on mobile timeout
  if (isLoading && hasTimedOut) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-4">💰</div>
          <h1 className="text-2xl font-bold mb-2">FinTrack</h1>
          <p className="text-gray-300 mb-6">Loading your financial data...</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
          >
            Refresh App
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-4 animate-pulse">💰</div>
          <h1 className="text-2xl font-bold mb-2">FinTrack</h1>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
