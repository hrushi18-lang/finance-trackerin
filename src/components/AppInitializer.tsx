import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { useFinanceSafe } from '../contexts/FinanceContext';
import { LoadingScreen } from './common/LoadingScreen';
import { analytics } from '../utils/analytics';
import { auditLogger } from '../utils/auditLogger';
import { errorMonitoring } from '../utils/errorMonitoring';
import { simpleCurrencyService } from '../services/simpleCurrencyService';

interface AppInitializerProps {
  children: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const financeContext = useFinanceSafe();
  
  // Return loading screen if finance context is not available yet
  if (!financeContext) {
    return <LoadingScreen message="Initializing finance system..." />;
  }
  
  const { accounts, goals, bills, liabilities, userCategories, loading: financeLoading } = financeContext;
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    // Set a maximum loading timeout for mobile
    const timeoutId = setTimeout(() => {
      if (!isInitialized) {
        console.warn('App initialization timeout - forcing initialization');
        setLoadingTimeout(true);
        setIsInitialized(true);
      }
    }, 10000); // 10 second timeout

    const initializeApp = async () => {
      try {
        // Mobile-optimized initialization with timeout protection
        const initPromise = new Promise<void>(async (resolve) => {
          if (isAuthenticated && user) {
            // Lightweight initialization for mobile
            const userId = user.id;
            
            // Non-blocking analytics setup
            try {
              analytics.setUserId(userId);
              analytics.setUserProperties({
                user_id: userId,
                email: user.email,
                name: user.user_metadata?.name || user.email,
                platform: 'mobile',
                app_version: '1.0.0'
              });
            } catch (analyticsError) {
              console.warn('Analytics setup failed:', analyticsError);
            }

            // Non-blocking error monitoring
            try {
              errorMonitoring.setUserId(userId);
              errorMonitoring.setSeverityThreshold('medium');
            } catch (monitoringError) {
              console.warn('Error monitoring setup failed:', monitoringError);
            }

            // Non-blocking audit logging
            try {
              auditLogger.logUser(userId, 'login', {
                platform: 'mobile',
                user_agent: navigator.userAgent,
                timestamp: new Date().toISOString()
              });
            } catch (auditError) {
              console.warn('Audit logging failed:', auditError);
            }

            // Initialize simple currency service
            try {
              const primaryCurrency = profile?.currency || 'USD';
              console.log(`🔄 Initializing currency service for ${primaryCurrency}...`);
              // Simple currency service doesn't need initialization
              console.log(`✅ Currency service initialized for ${primaryCurrency}`);
            } catch (rateError) {
              console.warn('Currency service initialization failed:', rateError);
            }

            resolve();
          } else {
            // Clear user data when not authenticated
            try {
              analytics.clearUserData();
              errorMonitoring.setUserId(null);
            } catch (error) {
              console.warn('Error clearing user data:', error);
            }
            resolve();
          }
        });

        // Race between initialization and timeout
        await Promise.race([
          initPromise,
          new Promise(resolve => setTimeout(resolve, 5000)) // 5 second max
        ]);

        setIsInitialized(true);
        clearTimeout(timeoutId);
      } catch (error) {
        console.error('Error initializing app:', error);
        setInitializationError(error instanceof Error ? error.message : 'Initialization failed');
        setIsInitialized(true); // Always show the app even if initialization fails
        clearTimeout(timeoutId);
      }
    };

    initializeApp();

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, user, isInitialized]);

  // Check for new users after data is loaded
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !user) return;

    // Wait for profile and finance data to load
    if (profileLoading || financeLoading) {
      return;
    }

    // Check if user has a profile (primary indicator of setup completion)
    const hasProfile = !!profile;
    
    // Also check if user has existing financial data
    const hasExistingData = 
      accounts.length > 0 || 
      goals.length > 0 || 
      bills.length > 0 || 
      liabilities.length > 0 || 
      userCategories.length > 0;

    // User is new if they don't have a profile OR no financial data
    const isNew = !hasProfile || !hasExistingData;
    setIsNewUser(isNew);

    // Track onboarding check
    analytics.trackEngagement('onboarding_check', {
      feature: 'onboarding_flow',
      is_new_user: isNew,
      has_profile: hasProfile,
      has_accounts: accounts.length > 0,
      has_goals: goals.length > 0,
      has_bills: bills.length > 0,
      has_liabilities: liabilities.length > 0,
      has_custom_categories: userCategories.length > 0
    });
  }, [isInitialized, isAuthenticated, user, profile, profileLoading, accounts, goals, bills, liabilities, userCategories, financeLoading]);

  // Handle routing after initialization
  useEffect(() => {
    if (!isInitialized) return;

    const handleRouting = () => {
      // Don't redirect if already on auth page
      if (location.pathname === '/auth') {
        return;
      }

      // If not authenticated, redirect to auth
      if (!isAuthenticated || !user) {
        navigate('/auth');
        return;
      }

      // If user is new and not already on onboarding, redirect to onboarding
      if (isNewUser === true && location.pathname !== '/onboarding') {
        console.log('AppInitializer - Redirecting new user to onboarding');
        navigate('/onboarding');
        return;
      }

      // If user is not new and on onboarding, redirect to home
      if (isNewUser === false && location.pathname === '/onboarding') {
        console.log('AppInitializer - Redirecting existing user to home');
        navigate('/');
        return;
      }

      // Redirect to home if on root path
      if (location.pathname === '/') {
        navigate('/');
        return;
      }
      
      console.log('AppInitializer - Routing decision:', {
        currentPath: location.pathname,
        isAuthenticated,
        hasUser: !!user,
        isNewUser,
        profileLoading,
        financeLoading
      });
    };

    handleRouting();
  }, [isInitialized, isAuthenticated, user, isNewUser, location.pathname, navigate, profileLoading, financeLoading]);

  if (!isInitialized || (isAuthenticated && user && isNewUser === null)) {
    return (
      <LoadingScreen 
        message={loadingTimeout ? "Taking longer than expected..." : "Initializing your financial app..."} 
        submessage={loadingTimeout ? "Please wait, we're almost ready..." : "Loading your data and setting up the app..."}
        showRetry={loadingTimeout}
        onRetry={() => {
          setLoadingTimeout(false);
          setIsInitialized(false);
          window.location.reload();
        }}
      />
    );
  }

  // Show loading screen while data is being loaded after authentication
  if (isAuthenticated && user && !isInitialized) {
    return (
      <LoadingScreen 
        message="Welcome back!" 
        submessage="Loading your financial data..."
      />
    );
  }

  if (initializationError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
            Initialization Error
          </h2>
          <p className="text-sm font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
            {initializationError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl text-white font-medium"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
