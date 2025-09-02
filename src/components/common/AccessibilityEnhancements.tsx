import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Eye, EyeOff, Type, Contrast, MousePointer } from 'lucide-react';
import { Button } from './Button';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
}

interface AccessibilityEnhancementsProps {
  className?: string;
}

export const AccessibilityEnhancements: React.FC<AccessibilityEnhancementsProps> = ({
  className = ''
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: false,
    focusIndicators: true
  });

  const [isOpen, setIsOpen] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Apply accessibility settings
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Screen reader optimizations
    if (settings.screenReader) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }

    // Keyboard navigation
    if (settings.keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }

    // Focus indicators
    if (settings.focusIndicators) {
      root.classList.add('focus-indicators');
    } else {
      root.classList.remove('focus-indicators');
    }

    // Save settings
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setSettings({
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: false,
      focusIndicators: true
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Accessibility Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title="Accessibility Settings"
        aria-label="Open accessibility settings"
      >
        <Eye size={20} className="text-gray-400 hover:text-primary-400" />
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-forest-900 border border-forest-600/30 rounded-xl shadow-2xl z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Accessibility Settings</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close accessibility settings"
              >
                <span className="text-gray-400 text-xl">×</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Contrast size={18} className="text-blue-400" />
                  <div>
                    <p className="text-white font-medium">High Contrast</p>
                    <p className="text-xs text-gray-400">Enhanced color contrast for better visibility</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('highContrast', !settings.highContrast)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.highContrast ? 'bg-primary-500' : 'bg-gray-600'
                  }`}
                  aria-label={`${settings.highContrast ? 'Disable' : 'Enable'} high contrast`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.highContrast ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Large Text */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Type size={18} className="text-green-400" />
                  <div>
                    <p className="text-white font-medium">Large Text</p>
                    <p className="text-xs text-gray-400">Increase text size for better readability</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('largeText', !settings.largeText)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.largeText ? 'bg-primary-500' : 'bg-gray-600'
                  }`}
                  aria-label={`${settings.largeText ? 'Disable' : 'Enable'} large text`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.largeText ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MousePointer size={18} className="text-purple-400" />
                  <div>
                    <p className="text-white font-medium">Reduced Motion</p>
                    <p className="text-xs text-gray-400">Minimize animations and transitions</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.reducedMotion ? 'bg-primary-500' : 'bg-gray-600'
                  }`}
                  aria-label={`${settings.reducedMotion ? 'Disable' : 'Enable'} reduced motion`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.reducedMotion ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Screen Reader Optimizations */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Volume2 size={18} className="text-orange-400" />
                  <div>
                    <p className="text-white font-medium">Screen Reader Mode</p>
                    <p className="text-xs text-gray-400">Optimize for screen readers</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('screenReader', !settings.screenReader)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.screenReader ? 'bg-primary-500' : 'bg-gray-600'
                  }`}
                  aria-label={`${settings.screenReader ? 'Disable' : 'Enable'} screen reader mode`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.screenReader ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Keyboard Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MousePointer size={18} className="text-yellow-400" />
                  <div>
                    <p className="text-white font-medium">Enhanced Keyboard Navigation</p>
                    <p className="text-xs text-gray-400">Improve keyboard accessibility</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('keyboardNavigation', !settings.keyboardNavigation)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.keyboardNavigation ? 'bg-primary-500' : 'bg-gray-600'
                  }`}
                  aria-label={`${settings.keyboardNavigation ? 'Disable' : 'Enable'} enhanced keyboard navigation`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.keyboardNavigation ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Focus Indicators */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Eye size={18} className="text-red-400" />
                  <div>
                    <p className="text-white font-medium">Focus Indicators</p>
                    <p className="text-xs text-gray-400">Show focus outlines for keyboard navigation</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('focusIndicators', !settings.focusIndicators)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.focusIndicators ? 'bg-primary-500' : 'bg-gray-600'
                  }`}
                  aria-label={`${settings.focusIndicators ? 'Disable' : 'Enable'} focus indicators`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.focusIndicators ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Reset Button */}
            <div className="mt-6 pt-4 border-t border-forest-600/30">
              <Button
                onClick={resetToDefaults}
                variant="outline"
                size="sm"
                className="w-full border-forest-500/30 text-forest-300 hover:bg-forest-600/10"
              >
                Reset to Defaults
              </Button>
            </div>

            {/* Accessibility Info */}
            <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <p className="text-blue-300 text-xs">
                💡 These settings help make FinTrack accessible to everyone. 
                Changes are saved automatically and apply across the entire app.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Keyboard Navigation Hook
export const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip to main content
      if (event.key === 'Tab' && event.shiftKey && event.altKey) {
        event.preventDefault();
        const mainContent = document.querySelector('main, [role="main"]');
        if (mainContent) {
          (mainContent as HTMLElement).focus();
        }
      }

      // Skip to navigation
      if (event.key === 'Tab' && event.altKey) {
        event.preventDefault();
        const navigation = document.querySelector('nav, [role="navigation"]');
        if (navigation) {
          (navigation as HTMLElement).focus();
        }
      }

      // Close modals with Escape
      if (event.key === 'Escape') {
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="Close"]');
          if (closeButton) {
            (closeButton as HTMLElement).click();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};

// Screen Reader Announcements
export const useScreenReaderAnnouncements = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return { announce };
};
