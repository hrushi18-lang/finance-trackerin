import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export interface MobileInfo {
  isMobile: boolean;
  isNative: boolean;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  isTablet: boolean;
  isPhone: boolean;
  hasNotch: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const useMobileDetection = (): MobileInfo => {
  const [mobileInfo, setMobileInfo] = useState<MobileInfo>({
    isMobile: false,
    isNative: false,
    platform: 'web',
    isTablet: false,
    isPhone: false,
    hasNotch: false,
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  useEffect(() => {
    const detectMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isNative = Capacitor.isNativePlatform();
      const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
      
      // Detect mobile devices
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || isNative;
      
      // Detect tablets
      const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) || 
                      (window.innerWidth >= 768 && window.innerHeight >= 1024);
      
      // Detect phones
      const isPhone = isMobile && !isTablet;
      
      // Detect notch (simplified detection)
      const hasNotch = isNative && (
        (platform === 'ios' && window.screen.height >= 812) ||
        (platform === 'android' && window.screen.height >= 800)
      );
      
      // Get safe area insets (simplified)
      const safeAreaInsets = {
        top: hasNotch ? 44 : 20,
        bottom: hasNotch ? 34 : 0,
        left: 0,
        right: 0
      };

      setMobileInfo({
        isMobile,
        isNative,
        platform,
        isTablet,
        isPhone,
        hasNotch,
        safeAreaInsets
      });
    };

    detectMobile();
    
    // Listen for orientation changes
    const handleResize = () => {
      detectMobile();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return mobileInfo;
};
