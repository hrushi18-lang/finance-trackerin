/**
 * Feature Flags System
 * Manages feature toggles and A/B testing
 */

interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  rollout_percentage?: number;
  user_groups?: string[];
  conditions?: Record<string, any>;
  metadata?: Record<string, any>;
}

interface FeatureFlagConfig {
  flags: FeatureFlag[];
  user_id?: string;
  user_properties?: Record<string, any>;
  environment?: 'development' | 'staging' | 'production';
}

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  private userId: string | null = null;
  private userProperties: Record<string, any> = {};
  private environment: string = 'development';
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize feature flags
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load default feature flags
      await this.loadDefaultFlags();
      
      // Load user-specific flags from server
      await this.loadUserFlags();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize feature flags:', error);
    }
  }

  /**
   * Load default feature flags
   */
  private async loadDefaultFlags(): Promise<void> {
    const defaultFlags: FeatureFlag[] = [
      {
        name: 'enhanced_analytics',
        enabled: true,
        description: 'Enhanced analytics and reporting features',
        rollout_percentage: 100
      },
      {
        name: 'push_notifications',
        enabled: true,
        description: 'Push notification system',
        rollout_percentage: 100
      },
      {
        name: 'offline_mode',
        enabled: true,
        description: 'Offline data synchronization',
        rollout_percentage: 100
      },
      {
        name: 'biometric_auth',
        enabled: false,
        description: 'Biometric authentication',
        rollout_percentage: 0
      },
      {
        name: 'ai_insights',
        enabled: false,
        description: 'AI-powered financial insights',
        rollout_percentage: 0
      },
      {
        name: 'social_features',
        enabled: false,
        description: 'Social sharing and collaboration features',
        rollout_percentage: 0
      },
      {
        name: 'advanced_budgeting',
        enabled: true,
        description: 'Advanced budgeting tools',
        rollout_percentage: 100
      },
      {
        name: 'investment_tracking',
        enabled: false,
        description: 'Investment portfolio tracking',
        rollout_percentage: 0
      },
      {
        name: 'bill_automation',
        enabled: false,
        description: 'Automated bill payment suggestions',
        rollout_percentage: 0
      },
      {
        name: 'export_data',
        enabled: true,
        description: 'Data export functionality',
        rollout_percentage: 100
      },
      {
        name: 'dark_mode',
        enabled: true,
        description: 'Dark mode theme',
        rollout_percentage: 100
      },
      {
        name: 'multi_currency',
        enabled: true,
        description: 'Multi-currency support',
        rollout_percentage: 100
      },
      {
        name: 'custom_categories',
        enabled: true,
        description: 'Custom category creation',
        rollout_percentage: 100
      },
      {
        name: 'goal_tracking',
        enabled: true,
        description: 'Financial goal tracking',
        rollout_percentage: 100
      },
      {
        name: 'liability_management',
        enabled: true,
        description: 'Debt and liability management',
        rollout_percentage: 100
      },
      {
        name: 'recurring_transactions',
        enabled: true,
        description: 'Recurring transaction management',
        rollout_percentage: 100
      },
      {
        name: 'transaction_splitting',
        enabled: true,
        description: 'Split transaction functionality',
        rollout_percentage: 100
      },
      {
        name: 'data_encryption',
        enabled: true,
        description: 'Data encryption at rest',
        rollout_percentage: 100
      },
      {
        name: 'audit_logging',
        enabled: true,
        description: 'Comprehensive audit logging',
        rollout_percentage: 100
      },
      {
        name: 'error_monitoring',
        enabled: true,
        description: 'Error monitoring and reporting',
        rollout_percentage: 100
      }
    ];

    defaultFlags.forEach(flag => {
      this.flags.set(flag.name, flag);
    });
  }

  /**
   * Load user-specific flags from server
   */
  private async loadUserFlags(): Promise<void> {
    if (!this.userId) return;

    try {
      // In a real implementation, this would fetch from your server
      // const response = await fetch(`/api/feature-flags/${this.userId}`);
      // const userFlags = await response.json();
      
      // For now, we'll use local storage
      const storedFlags = localStorage.getItem('feature_flags');
      if (storedFlags) {
        const userFlags: FeatureFlag[] = JSON.parse(storedFlags);
        userFlags.forEach(flag => {
          this.flags.set(flag.name, flag);
        });
      }
    } catch (error) {
      console.error('Failed to load user feature flags:', error);
    }
  }

  /**
   * Set user context
   */
  setUserContext(userId: string, userProperties: Record<string, any> = {}): void {
    this.userId = userId;
    this.userProperties = userProperties;
    this.loadUserFlags();
  }

  /**
   * Set environment
   */
  setEnvironment(environment: string): void {
    this.environment = environment;
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(flagName: string): boolean {
    const flag = this.flags.get(flagName);
    if (!flag) {
      console.warn(`Feature flag '${flagName}' not found`);
      return false;
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check rollout percentage
    if (flag.rollout_percentage !== undefined && flag.rollout_percentage < 100) {
      const userHash = this.hashUserId(this.userId || 'anonymous');
      const userPercentage = userHash % 100;
      if (userPercentage >= flag.rollout_percentage) {
        return false;
      }
    }

    // Check user groups
    if (flag.user_groups && flag.user_groups.length > 0) {
      const userGroup = this.getUserGroup();
      if (!flag.user_groups.includes(userGroup)) {
        return false;
      }
    }

    // Check conditions
    if (flag.conditions) {
      if (!this.evaluateConditions(flag.conditions)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get feature flag value
   */
  getFlag(flagName: string): FeatureFlag | null {
    return this.flags.get(flagName) || null;
  }

  /**
   * Get all enabled flags
   */
  getEnabledFlags(): FeatureFlag[] {
    return Array.from(this.flags.values()).filter(flag => this.isEnabled(flag.name));
  }

  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Set feature flag
   */
  setFlag(flag: FeatureFlag): void {
    this.flags.set(flag.name, flag);
    this.saveUserFlags();
  }

  /**
   * Enable feature flag
   */
  enableFlag(flagName: string): void {
    const flag = this.flags.get(flagName);
    if (flag) {
      flag.enabled = true;
      this.saveUserFlags();
    }
  }

  /**
   * Disable feature flag
   */
  disableFlag(flagName: string): void {
    const flag = this.flags.get(flagName);
    if (flag) {
      flag.enabled = false;
      this.saveUserFlags();
    }
  }

  /**
   * Toggle feature flag
   */
  toggleFlag(flagName: string): boolean {
    const flag = this.flags.get(flagName);
    if (flag) {
      flag.enabled = !flag.enabled;
      this.saveUserFlags();
      return flag.enabled;
    }
    return false;
  }

  /**
   * Hash user ID for consistent rollout
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get user group based on properties
   */
  private getUserGroup(): string {
    if (this.userProperties.is_premium) {
      return 'premium';
    }
    if (this.userProperties.is_beta_tester) {
      return 'beta';
    }
    if (this.userProperties.is_early_adopter) {
      return 'early_adopter';
    }
    return 'default';
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(conditions: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      const userValue = this.userProperties[key];
      
      if (typeof value === 'object' && value.operator) {
        switch (value.operator) {
          case 'equals':
            if (userValue !== value.value) return false;
            break;
          case 'not_equals':
            if (userValue === value.value) return false;
            break;
          case 'greater_than':
            if (userValue <= value.value) return false;
            break;
          case 'less_than':
            if (userValue >= value.value) return false;
            break;
          case 'contains':
            if (!userValue || !userValue.includes(value.value)) return false;
            break;
          case 'not_contains':
            if (userValue && userValue.includes(value.value)) return false;
            break;
          case 'in':
            if (!value.value.includes(userValue)) return false;
            break;
          case 'not_in':
            if (value.value.includes(userValue)) return false;
            break;
        }
      } else {
        if (userValue !== value) return false;
      }
    }
    return true;
  }

  /**
   * Save user flags to local storage
   */
  private saveUserFlags(): void {
    try {
      const userFlags = Array.from(this.flags.values());
      localStorage.setItem('feature_flags', JSON.stringify(userFlags));
    } catch (error) {
      console.error('Failed to save feature flags:', error);
    }
  }

  /**
   * Reset all flags to default
   */
  resetToDefault(): void {
    this.flags.clear();
    this.loadDefaultFlags();
    localStorage.removeItem('feature_flags');
  }

  /**
   * Get feature flag configuration for debugging
   */
  getDebugInfo(): {
    userId: string | null;
    userProperties: Record<string, any>;
    environment: string;
    flags: FeatureFlag[];
    enabledFlags: string[];
  } {
    return {
      userId: this.userId,
      userProperties: this.userProperties,
      environment: this.environment,
      flags: this.getAllFlags(),
      enabledFlags: this.getEnabledFlags().map(flag => flag.name)
    };
  }
}

// Create singleton instance
export const featureFlags = new FeatureFlagService();

// Export convenience functions
export const isFeatureEnabled = (flagName: string) => featureFlags.isEnabled(flagName);
export const getFeatureFlag = (flagName: string) => featureFlags.getFlag(flagName);
export const getEnabledFlags = () => featureFlags.getEnabledFlags();
export const getAllFlags = () => featureFlags.getAllFlags();
export const setFeatureFlag = (flag: FeatureFlag) => featureFlags.setFlag(flag);
export const enableFeature = (flagName: string) => featureFlags.enableFlag(flagName);
export const disableFeature = (flagName: string) => featureFlags.disableFlag(flagName);
export const toggleFeature = (flagName: string) => featureFlags.toggleFlag(flagName);
export const setUserContext = (userId: string, userProperties?: Record<string, any>) => featureFlags.setUserContext(userId, userProperties);
export const setEnvironment = (environment: string) => featureFlags.setEnvironment(environment);
export const resetFeatureFlags = () => featureFlags.resetToDefault();
export const getDebugInfo = () => featureFlags.getDebugInfo();

export default featureFlags;
