/**
 * Production configuration for finance app
 * Centralized configuration management for security and performance
 */

export const PRODUCTION_CONFIG = {
  // Security settings
  security: {
    // Rate limiting
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      skipSuccessfulRequests: false
    },
    
    // Input validation
    inputValidation: {
      maxStringLength: 1000,
      maxDescriptionLength: 200,
      maxNotesLength: 1000,
      maxAmount: 999999999.99,
      minAmount: 0.01
    },
    
    // Session management
    session: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: true,
      httpOnly: true,
      sameSite: 'strict' as const
    },
    
    // CORS settings
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    
    // Content Security Policy
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  
  // Performance settings
  performance: {
    // Caching
    cache: {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 100, // Maximum number of cached items
      enableMemoryCache: true,
      enableLocalStorageCache: true
    },
    
    // Pagination
    pagination: {
      defaultPageSize: 20,
      maxPageSize: 100,
      mobilePageSize: 10
    },
    
    // Virtual scrolling
    virtualScrolling: {
      itemHeight: 60,
      overscan: 5,
      enableMobile: true
    },
    
    // Image optimization
    images: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      quality: 80,
      enableLazyLoading: true
    },
    
    // Bundle optimization
    bundle: {
      enableCodeSplitting: true,
      enableTreeShaking: true,
      enableCompression: true,
      chunkSizeLimit: 250000 // 250KB
    }
  },
  
  // Database settings
  database: {
    // Connection pooling
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    },
    
    // Query optimization
    queries: {
      timeout: 30000, // 30 seconds
      maxRetries: 3,
      enableQueryLogging: process.env.NODE_ENV === 'development'
    },
    
    // Data validation
    validation: {
      enableStrictMode: true,
      enableTypeChecking: true,
      enableConstraintChecking: true
    }
  },
  
  // API settings
  api: {
    // Request/Response
    request: {
      timeout: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 1000 // 1 second
    },
    
    // Pagination
    pagination: {
      defaultLimit: 20,
      maxLimit: 100,
      enableCursorPagination: true
    },
    
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false
    }
  },
  
  // Monitoring and logging
  monitoring: {
    // Error tracking
    errorTracking: {
      enableConsoleLogging: true,
      enableRemoteLogging: process.env.NODE_ENV === 'production',
      enablePerformanceMonitoring: true,
      enableUserFeedback: true
    },
    
    // Analytics
    analytics: {
      enableGoogleAnalytics: process.env.NODE_ENV === 'production',
      enableCustomAnalytics: true,
      enablePerformanceMetrics: true,
      enableUserBehaviorTracking: false // Privacy-first approach
    },
    
    // Logging
    logging: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      enableConsoleLogging: true,
      enableFileLogging: process.env.NODE_ENV === 'production',
      enableRemoteLogging: process.env.NODE_ENV === 'production',
      logRetentionDays: 30
    }
  },
  
  // Feature flags
  features: {
    // Core features
    enableOfflineMode: true,
    enableDataSync: true,
    enableRealTimeUpdates: true,
    enablePushNotifications: true,
    
    // Advanced features
    enableAIInsights: false, // Disabled for privacy
    enableAdvancedAnalytics: true,
    enableExportData: true,
    enableImportData: true,
    enableDataBackup: true,
    
    // Security features
    enableTwoFactorAuth: false, // Future feature
    enableBiometricAuth: false, // Future feature
    enableDataEncryption: true,
    enableAuditLogging: true,
    
    // Performance features
    enableVirtualScrolling: true,
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableCodeSplitting: true
  },
  
  // Environment-specific settings
  environment: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    
    // API endpoints
    apiBaseUrl: process.env.VITE_API_BASE_URL || 'https://api.yourdomain.com',
    supabaseUrl: process.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
    
    // Feature toggles based on environment
    enableDebugMode: process.env.NODE_ENV === 'development',
    enableHotReload: process.env.NODE_ENV === 'development',
    enableSourceMaps: process.env.NODE_ENV === 'development'
  },
  
  // Mobile-specific settings
  mobile: {
    // Touch interactions
    touch: {
      enableSwipeGestures: true,
      enablePullToRefresh: true,
      enableHapticFeedback: true
    },
    
    // Performance
    performance: {
      enableReducedMotion: true,
      enableLowPowerMode: true,
      enableBackgroundSync: true
    },
    
    // UI/UX
    ui: {
      enableStatusBar: true,
      enableSafeArea: true,
      enableKeyboardAvoidance: true,
      enableSplashScreen: true
    }
  },
  
  // Data privacy and compliance
  privacy: {
    // GDPR compliance
    gdpr: {
      enableDataExport: true,
      enableDataDeletion: true,
      enableConsentManagement: true,
      enableDataPortability: true
    },
    
    // Data retention
    dataRetention: {
      transactionData: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      userData: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
      auditLogs: 1 * 365 * 24 * 60 * 60 * 1000, // 1 year
      errorLogs: 30 * 24 * 60 * 60 * 1000 // 30 days
    },
    
    // Data encryption
    encryption: {
      enableAtRest: true,
      enableInTransit: true,
      enableClientSide: true,
      algorithm: 'AES-256-GCM'
    }
  }
};

// Helper functions
export const getConfig = (path: string) => {
  return path.split('.').reduce((obj, key) => obj?.[key], PRODUCTION_CONFIG);
};

export const isFeatureEnabled = (feature: string): boolean => {
  const featurePath = `features.${feature}`;
  return getConfig(featurePath) === true;
};

export const getEnvironmentConfig = () => {
  return PRODUCTION_CONFIG.environment;
};

export const getSecurityConfig = () => {
  return PRODUCTION_CONFIG.security;
};

export const getPerformanceConfig = () => {
  return PRODUCTION_CONFIG.performance;
};

// Validation
export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validate required environment variables
  if (!PRODUCTION_CONFIG.environment.supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!PRODUCTION_CONFIG.environment.supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }
  
  // Validate security settings
  if (PRODUCTION_CONFIG.security.rateLimit.maxRequests < 1) {
    errors.push('Rate limit maxRequests must be at least 1');
  }
  
  if (PRODUCTION_CONFIG.security.rateLimit.windowMs < 1000) {
    errors.push('Rate limit windowMs must be at least 1000ms');
  }
  
  // Validate performance settings
  if (PRODUCTION_CONFIG.performance.pagination.defaultPageSize < 1) {
    errors.push('Default page size must be at least 1');
  }
  
  if (PRODUCTION_CONFIG.performance.pagination.maxPageSize < PRODUCTION_CONFIG.performance.pagination.defaultPageSize) {
    errors.push('Max page size must be greater than or equal to default page size');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export default PRODUCTION_CONFIG;
