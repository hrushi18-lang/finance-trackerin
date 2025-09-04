import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

interface MobileSplashScreenProps {
  children: React.ReactNode;
  minDisplayTime?: number;
}

export const MobileSplashScreen: React.FC<MobileSplashScreenProps> = ({
  children,
  minDisplayTime = 2000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isNative] = useState(Capacitor.isNativePlatform());

  useEffect(() => {
    if (!isNative) {
      setIsVisible(false);
      return;
    }

    const hideSplash = async () => {
      try {
        // Wait for minimum display time
        await new Promise(resolve => setTimeout(resolve, minDisplayTime));
        
        // Hide the native splash screen
        await SplashScreen.hide({
          fadeOutDuration: 500
        });
        
        // Hide our custom splash screen
        setIsVisible(false);
      } catch (error) {
        console.error('Error hiding splash screen:', error);
        setIsVisible(false);
      }
    };

    hideSplash();
  }, [isNative, minDisplayTime]);

  if (!isVisible) {
    return <>{children}</>;
  }

  return (
    <div className="mobile-splash-screen">
      <div className="mobile-splash-content">
        <div className="mobile-splash-logo">
          <div className="mobile-splash-icon">
            💰
          </div>
          <h1 className="mobile-splash-title">FinTrack</h1>
          <p className="mobile-splash-subtitle">Personal Finance Manager</p>
        </div>
        
        <div className="mobile-splash-spinner">
          <div className="mobile-spinner"></div>
        </div>
      </div>
      
      <style jsx>{`
        .mobile-splash-screen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d3f1a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          color: white;
        }
        
        .mobile-splash-content {
          text-align: center;
          animation: mobileFadeIn 0.5s ease-out;
        }
        
        .mobile-splash-logo {
          margin-bottom: 48px;
        }
        
        .mobile-splash-icon {
          font-size: 64px;
          margin-bottom: 16px;
          animation: mobileBounce 2s ease-in-out infinite;
        }
        
        .mobile-splash-title {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #10B981;
        }
        
        .mobile-splash-subtitle {
          font-size: 16px;
          margin: 0;
          opacity: 0.8;
        }
        
        .mobile-splash-spinner {
          display: flex;
          justify-content: center;
        }
        
        @keyframes mobileFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes mobileBounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
};
