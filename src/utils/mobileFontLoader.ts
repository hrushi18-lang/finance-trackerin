/**
 * Mobile-specific font loading utilities
 * Handles font loading optimization for mobile devices
 */

interface FontConfig {
  family: string;
  weights: number[];
  display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

const FONT_CONFIGS: FontConfig[] = [
  {
    family: 'Archivo',
    weights: [400, 500, 600, 700],
    display: 'swap'
  },
  {
    family: 'Archivo Black',
    weights: [400],
    display: 'swap'
  },
  {
    family: 'Playfair Display',
    weights: [400, 500, 600, 700],
    display: 'swap'
  }
];

class MobileFontLoader {
  private loadedFonts = new Set<string>();
  private loadingPromises = new Map<string, Promise<boolean>>();

  /**
   * Preload critical fonts for mobile
   */
  async preloadCriticalFonts(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Check if we're on mobile
    const isMobile = this.isMobileDevice();
    
    if (!isMobile) {
      console.log('Desktop detected, skipping mobile font optimization');
      return;
    }

    console.log('Mobile detected, optimizing font loading...');

    try {
      // Preload the most critical fonts first
      const criticalFonts = [
        'Archivo',
        'Archivo Black'
      ];

      for (const fontFamily of criticalFonts) {
        await this.loadFont(fontFamily);
      }

      // Load secondary fonts in background
      this.loadSecondaryFonts();

    } catch (error) {
      console.warn('Mobile font preloading failed:', error);
    }
  }

  /**
   * Load a specific font
   */
  async loadFont(fontFamily: string): Promise<boolean> {
    if (this.loadedFonts.has(fontFamily)) {
      return true;
    }

    if (this.loadingPromises.has(fontFamily)) {
      return this.loadingPromises.get(fontFamily)!;
    }

    const loadPromise = this.loadFontInternal(fontFamily);
    this.loadingPromises.set(fontFamily, loadPromise);

    try {
      const success = await loadPromise;
      if (success) {
        this.loadedFonts.add(fontFamily);
      }
      return success;
    } catch (error) {
      console.warn(`Font loading failed for ${fontFamily}:`, error);
      // Mark as loaded even if failed to prevent retry loops
      this.loadedFonts.add(fontFamily);
      return false;
    } finally {
      this.loadingPromises.delete(fontFamily);
    }
  }

  /**
   * Internal font loading logic
   */
  private async loadFontInternal(fontFamily: string): Promise<boolean> {
    if (!document.fonts) {
      console.warn('Font loading API not supported');
      return false;
    }

    try {
      // First check if font is already available
      if (document.fonts.check(`16px "${fontFamily}"`)) {
        console.log(`✅ Font already available: ${fontFamily}`);
        this.updateBodyClass();
        return true;
      }

      // Try to load the font with different weights
      const weights = this.getFontWeights(fontFamily);
      const loadPromises = weights.map(weight => 
        document.fonts.load(`${weight} 16px "${fontFamily}"`)
      );

      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled(loadPromises);
      
      // Check if any font weight loaded successfully
      const hasSuccessfulLoad = results.some(result => result.status === 'fulfilled');
      
      if (hasSuccessfulLoad) {
        console.log(`✅ Font loaded: ${fontFamily}`);
        this.updateBodyClass();
        return true;
      } else {
        console.warn(`⚠️ Font verification failed: ${fontFamily}, using fallback`);
        // Don't fail completely, just use fallback
        this.updateBodyClass();
        return false;
      }
    } catch (error) {
      console.warn(`⚠️ Font loading error for ${fontFamily}:`, error);
      // Don't fail completely, just use fallback
      this.updateBodyClass();
      return false;
    }
  }

  /**
   * Load secondary fonts in background
   */
  private loadSecondaryFonts(): void {
    const secondaryFonts = ['Playfair Display'];
    
    secondaryFonts.forEach(fontFamily => {
      this.loadFont(fontFamily).catch(error => {
        console.warn(`Background font loading failed for ${fontFamily}:`, error);
      });
    });
  }

  /**
   * Get font weights for a font family
   */
  private getFontWeights(fontFamily: string): number[] {
    const config = FONT_CONFIGS.find(c => c.family === fontFamily);
    return config?.weights || [400];
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
   * Update body class when fonts are loaded
   */
  private updateBodyClass(): void {
    if (this.loadedFonts.size >= 2) { // At least Archivo and Archivo Black
      document.body.classList.add('fonts-loaded');
      document.body.classList.remove('fonts-loading');
    }
  }

  /**
   * Get loading status
   */
  getLoadingStatus(): {
    loaded: string[];
    loading: string[];
    total: number;
    progress: number;
  } {
    const total = FONT_CONFIGS.length;
    const loaded = Array.from(this.loadedFonts);
    const loading = Array.from(this.loadingPromises.keys());
    
    return {
      loaded,
      loading,
      total,
      progress: (loaded.length / total) * 100
    };
  }

  /**
   * Force reload all fonts
   */
  async reloadFonts(): Promise<void> {
    this.loadedFonts.clear();
    this.loadingPromises.clear();
    document.body.classList.remove('fonts-loaded');
    document.body.classList.add('fonts-loading');
    
    await this.preloadCriticalFonts();
  }
}

// Export singleton instance
export const mobileFontLoader = new MobileFontLoader();

// Export utility functions
export const isFontLoaded = (fontFamily: string): boolean => {
  if (!document.fonts) return true;
  return document.fonts.check(`16px "${fontFamily}"`);
};

export const waitForFont = (fontFamily: string, timeout = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (isFontLoaded(fontFamily)) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isFontLoaded(fontFamily)) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
};
