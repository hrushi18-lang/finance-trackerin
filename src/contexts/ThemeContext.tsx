import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'cool-blue' | 'olive' | 'angular';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('cool-blue');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('fintrack-theme') as Theme;
    const savedDarkMode = localStorage.getItem('fintrack-dark-mode') === 'true';
    
    if (savedTheme && ['cool-blue', 'olive'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
    
    setIsDarkMode(savedDarkMode);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Set theme data attribute
    if (theme === 'olive') {
      root.setAttribute('data-theme', 'olive');
    } else {
      root.removeAttribute('data-theme');
    }
    
    // Set dark mode class
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, isDarkMode]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('fintrack-theme', newTheme);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('fintrack-dark-mode', newDarkMode.toString());
  };

  const value = {
    theme,
    setTheme,
    isDarkMode,
    toggleDarkMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
