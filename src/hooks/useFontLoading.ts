import { useState, useEffect } from 'react';
import { fontLoader } from '../utils/fontLoader';

/**
 * Hook to handle font loading states in React components
 */
export const useFontLoading = (fontFamily?: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkFontStatus = async () => {
      if (fontFamily) {
        // Check specific font
        const loaded = await fontLoader.waitForFont(fontFamily, 3000);
        setIsLoaded(loaded);
        setIsLoading(false);
      } else {
        // Check all critical fonts
        const { loaded, pending } = fontLoader.getLoadingStatus();
        setIsLoaded(pending.length === 0);
        setIsLoading(pending.length > 0);
      }
    };

    checkFontStatus();

    // Check again after a delay to catch late-loading fonts
    const timeout = setTimeout(() => {
      checkFontStatus();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [fontFamily]);

  return {
    isLoading,
    isLoaded,
    fontClass: isLoaded ? 'font-loaded' : 'font-loading'
  };
};

export default useFontLoading;
