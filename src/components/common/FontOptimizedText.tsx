import React from 'react';
import { useFontLoading } from '../../hooks/useFontLoading';

interface FontOptimizedTextProps {
  children: React.ReactNode;
  fontFamily?: 'heading' | 'numbers' | 'titles' | 'description';
  className?: string;
  fallbackClassName?: string;
}

/**
 * Component that handles font loading gracefully with fallbacks
 */
export const FontOptimizedText: React.FC<FontOptimizedTextProps> = ({
  children,
  fontFamily = 'body',
  className = '',
  fallbackClassName = ''
}) => {
  const { isLoaded, fontClass } = useFontLoading();

  const getFontClass = () => {
    switch (fontFamily) {
      case 'heading':
        return 'font-heading';
      case 'numbers':
        return 'font-numbers';
      case 'titles':
        return 'font-titles';
      case 'description':
        return 'font-description';
      default:
        return 'font-titles';
    }
  };

  const combinedClassName = `${getFontClass()} ${fontClass} ${className} ${!isLoaded ? fallbackClassName : ''}`.trim();

  return (
    <span className={combinedClassName}>
      {children}
    </span>
  );
};

export default FontOptimizedText;
