import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface MobileErrorRecoveryProps {
  children: React.ReactNode;
}

export const MobileErrorRecovery: React.FC<MobileErrorRecoveryProps> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [isNative] = useState(Capacitor.isNativePlatform());

  useEffect(() => {
    if (!isNative) return;

    // Global error handler for mobile
    const handleError = (event: ErrorEvent) => {
      console.error('Mobile error caught:', event.error);
      setErrorCount(prev => prev + 1);
      
      // If too many errors, show recovery screen
      if (errorCount >= 3) {
        setHasError(true);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Mobile promise rejection:', event.reason);
      setErrorCount(prev => prev + 1);
      
      if (errorCount >= 3) {
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isNative, errorCount]);

  const handleRecovery = () => {
    setHasError(false);
    setErrorCount(0);
    window.location.reload();
  };

  if (hasError && isNative) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
        <div className="text-center text-white p-8 max-w-sm">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-300 mb-6">
            The app encountered an error. Don't worry, your data is safe.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRecovery}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
            >
              Restart App
            </button>
            <button
              onClick={() => {
                // Clear localStorage and restart
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition-colors"
            >
              Reset App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
