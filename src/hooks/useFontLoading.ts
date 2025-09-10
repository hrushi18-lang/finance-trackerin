import { useState, useEffect } from 'react';

interface FontLoadingState {
  fontsLoaded: boolean;
  fontsLoading: boolean;
  fontError: boolean;
}

export const useFontLoading = (): FontLoadingState => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontsLoading, setFontsLoading] = useState(true);
  const [fontError, setFontError] = useState(false);

  useEffect(() => {
    // Check if fonts are already loaded
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
        setFontsLoading(false);
        document.body.classList.add('fonts-loaded');
        document.body.classList.remove('fonts-loading');
      }).catch(() => {
        setFontError(true);
        setFontsLoading(false);
        document.body.classList.add('fonts-loaded');
        document.body.classList.remove('fonts-loading');
      });
    } else {
      // Fallback for older browsers
      const timeout = setTimeout(() => {
        setFontsLoaded(true);
        setFontsLoading(false);
        document.body.classList.add('fonts-loaded');
        document.body.classList.remove('fonts-loading');
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, []);

  // Add loading class to body initially
  useEffect(() => {
    document.body.classList.add('fonts-loading');
    
    return () => {
      document.body.classList.remove('fonts-loading', 'fonts-loaded');
    };
  }, []);

  return {
    fontsLoaded,
    fontsLoading,
    fontError
  };
};

// Font loading utility functions
export const preloadFonts = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!document.fonts) {
      resolve();
      return;
    }

    const fontFamilies = [
      'Archivo',
      'Archivo Black',
      'Playfair Display'
    ];

    const loadPromises = fontFamilies.map(family => {
      return document.fonts.load(`400 16px "${family}"`).catch(() => {
        console.warn(`Failed to load font: ${family}`);
        return null;
      });
    });

    Promise.all(loadPromises)
      .then(() => {
        document.body.classList.add('fonts-loaded');
        document.body.classList.remove('fonts-loading');
        resolve();
      })
      .catch(reject);
  });
};

// Check if a specific font is available
export const isFontAvailable = (fontFamily: string): boolean => {
  if (!document.fonts) return true;
  
  try {
    return document.fonts.check(`16px "${fontFamily}"`);
  } catch {
    return false;
  }
};

// Get the best available font from a list
export const getBestAvailableFont = (fontList: string[]): string => {
  for (const font of fontList) {
    if (isFontAvailable(font)) {
      return font;
    }
  }
  return fontList[fontList.length - 1]; // Return last fallback
};