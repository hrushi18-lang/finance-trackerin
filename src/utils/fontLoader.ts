/**
 * Font Loading Utility
 * Handles graceful font loading with fallbacks for mobile deployment
 */

import { mobileFontLoader } from './mobileFontLoader';

interface FontConfig {
  family: string;
  weights: number[];
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

class FontLoader {
  private loadedFonts = new Set<string>();
  private fallbackTimeout = 3000; // 3 seconds fallback timeout

  /**
   * Load self-hosted fonts with fallback handling
   */
  async loadSelfHostedFonts(fonts: FontConfig[]): Promise<void> {
    try {
      // Check if fonts are already loaded
      const fontFaces = Array.from(document.fonts);
      const alreadyLoaded = fonts.every(font => 
        fontFaces.some(face => face.family === font.family)
      );

      if (alreadyLoaded) {
        console.log('Self-hosted fonts already loaded');
        return;
      }

      // Self-hosted fonts are loaded via @font-face in CSS
      // Just wait for them to be available
      await this.waitForFontsToLoad(fonts);

      // Mark fonts as loaded
      fonts.forEach(font => this.loadedFonts.add(font.family));

    } catch (error) {
      console.warn('Failed to load self-hosted fonts, using fallbacks:', error);
      this.enableFallbackFonts();
    }
  }

  /**
   * Wait for fonts to actually load
   */
  private async waitForFontsToLoad(fonts: FontConfig[]): Promise<void> {
    const promises = fonts.map(font => this.waitForFont(font.family, 3000));
    await Promise.allSettled(promises);
  }

  /**
   * Load font stylesheet (deprecated - using self-hosted fonts)
   */
  private loadFontStylesheet(url: string): Promise<void> {
    // This method is no longer used with self-hosted fonts
    return Promise.resolve();
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Font loading timeout')), ms);
    });
  }

  /**
   * Enable fallback fonts
   */
  private enableFallbackFonts(): void {
    document.documentElement.classList.add('fonts-fallback');
    console.log('Using system fallback fonts due to network issues');
  }

  /**
   * Check if font is loaded
   */
  isFontLoaded(fontFamily: string): boolean {
    return this.loadedFonts.has(fontFamily) || 
           Array.from(document.fonts).some(face => face.family === fontFamily);
  }

  /**
   * Wait for font to be loaded
   */
  async waitForFont(fontFamily: string, timeout = 5000): Promise<boolean> {
    if (this.isFontLoaded(fontFamily)) {
      return true;
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkFont = () => {
        if (this.isFontLoaded(fontFamily)) {
          resolve(true);
          return;
        }

        if (Date.now() - startTime > timeout) {
          console.warn(`Font ${fontFamily} loading timeout, using fallback`);
          resolve(false);
          return;
        }

        requestAnimationFrame(checkFont);
      };

      checkFont();
    });
  }

  /**
   * Preload critical fonts for better performance
   */
  async preloadCriticalFonts(): Promise<void> {
    // Use mobile font loader for mobile devices
    if (this.isMobileDevice()) {
      await mobileFontLoader.preloadCriticalFonts();
      return;
    }

    // Use self-hosted font loading for desktop
    const criticalFonts = [
      { family: 'Archivo', weights: [400, 500, 600, 700] },
      { family: 'Archivo Black', weights: [400] },
      { family: 'Playfair Display', weights: [400, 500, 600, 700] }
    ];

    await this.loadSelfHostedFonts(criticalFonts);
  }

  /**
   * Check if device is mobile
   */
  private isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  /**
   * Get font loading status
   */
  getLoadingStatus(): { loaded: string[]; pending: string[] } {
    const allFonts = ['Archivo', 'Archivo Black', 'Playfair Display'];
    const loaded = allFonts.filter(font => this.isFontLoaded(font));
    const pending = allFonts.filter(font => !this.isFontLoaded(font));

    return { loaded, pending };
  }
}

// Create singleton instance
export const fontLoader = new FontLoader();

// Auto-load critical fonts on app start
if (typeof window !== 'undefined') {
  // Load fonts immediately
  fontLoader.preloadCriticalFonts();

  // Add fallback class if fonts fail to load
  setTimeout(() => {
    const { pending } = fontLoader.getLoadingStatus();
    if (pending.length > 0) {
      document.documentElement.classList.add('fonts-fallback');
      console.log('Using fallback fonts for:', pending);
    }
  }, 2000);
}

export default fontLoader;
