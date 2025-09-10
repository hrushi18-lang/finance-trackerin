import React, { useEffect, useState } from 'react';
import { useFontLoading, preloadFonts } from '../../hooks/useFontLoading';

interface FontLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FontLoader: React.FC<FontLoaderProps> = ({ 
  children, 
  fallback = (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading fonts...</p>
      </div>
    </div>
  )
}) => {
  const { fontsLoaded, fontsLoading, fontError } = useFontLoading();
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await preloadFonts();
        setIsPreloading(false);
      } catch (error) {
        console.warn('Font preloading failed:', error);
        setIsPreloading(false);
      }
    };

    loadFonts();
  }, []);

  // Show fallback while fonts are loading
  if (fontsLoading || isPreloading) {
    return <>{fallback}</>;
  }

  // Show children when fonts are loaded or if there's an error (graceful degradation)
  return <>{children}</>;
};

// Font loading indicator component
export const FontLoadingIndicator: React.FC = () => {
  const { fontsLoaded, fontsLoading } = useFontLoading();

  if (!fontsLoading && fontsLoaded) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center space-x-2 bg-white rounded-lg shadow-lg px-3 py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading fonts...</span>
      </div>
    </div>
  );
};

// Font status component for debugging
export const FontStatus: React.FC = () => {
  const { fontsLoaded, fontsLoading, fontError } = useFontLoading();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
      <div>Fonts Loading: {fontsLoading ? 'Yes' : 'No'}</div>
      <div>Fonts Loaded: {fontsLoaded ? 'Yes' : 'No'}</div>
      <div>Font Error: {fontError ? 'Yes' : 'No'}</div>
    </div>
  );
};
