/**
 * Font Loading Utility
 * Handles graceful font loading with fallbacks for mobile deployment
 */

interface FontConfig {
  family: string;
  weights: number[];
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

class FontLoader {
  private loadedFonts = new Set<string>();
  private fallbackTimeout = 3000; // 3 seconds fallback timeout

  /**
   * Load Google Fonts with fallback handling
   */
  async loadGoogleFonts(fonts: FontConfig[]): Promise<void> {
    try {
      // Check if fonts are already loaded
      const fontFaces = Array.from(document.fonts);
      const alreadyLoaded = fonts.every(font => 
        fontFaces.some(face => face.family === font.family)
      );

      if (alreadyLoaded) {
        console.log('Fonts already loaded');
        return;
      }

      // Create font URL with proper encoding
      const fontFamilies = fonts.map(font => {
        const weights = font.weights.join(';');
        return `${font.family.replace(/\s+/g, '+')}:wght@${weights}`;
      }).join('&family=');

      const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap&subset=latin`;

      // Load fonts with timeout
      await Promise.race([
        this.loadFontStylesheet(fontUrl),
        this.createTimeoutPromise(this.fallbackTimeout)
      ]);

      // Wait for fonts to be actually loaded
      await this.waitForFontsToLoad(fonts);

      // Mark fonts as loaded
      fonts.forEach(font => this.loadedFonts.add(font.family));

    } catch (error) {
      console.warn('Failed to load Google Fonts, using fallbacks:', error);
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
   * Load font stylesheet
   */
  private loadFontStylesheet(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error('Failed to load font stylesheet'));
      
      document.head.appendChild(link);
    });
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
  preloadCriticalFonts(): void {
    const criticalFonts = [
      { family: 'Archivo', weights: [400, 500, 600, 700] },
      { family: 'Archivo Black', weights: [400] },
      { family: 'Playfair Display', weights: [400, 500, 600, 700] }
    ];

    this.loadGoogleFonts(criticalFonts);
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
