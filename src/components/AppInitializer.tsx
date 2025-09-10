import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { LoadingScreen } from './common/LoadingScreen';
import { analytics } from '../utils/analytics';
import { auditLogger } from '../utils/auditLogger';
import { errorMonitoring } from '../utils/errorMonitoring';

interface AppInitializerProps {
  children: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { accounts, goals, bills, liabilities, userCategories, loading } = useFinance();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (isAuthenticated && user) {
          // Set user ID for analytics and monitoring
          const userId = user.id;
          
          // Set up analytics and audit logging
          analytics.setUserId(userId);
          analytics.setUserProperties({
            user_id: userId,
            email: user.email,
            name: user.user_metadata?.name || user.email,
            platform: 'web',
            app_version: '1.0.0'
          });

          // Set up error monitoring
          errorMonitoring.setUserId(userId);
          errorMonitoring.setSeverityThreshold('medium');

          // Log user login
          auditLogger.logUser(userId, 'login', {
            platform: 'web',
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          });

          // Determine if user is new based on existing data
          const hasExistingData = accounts.length > 0 || goals.length > 0 || bills.length > 0 || liabilities.length > 0 || userCategories.length > 0;
          console.log('AppInitializer - Data counts:', {
            accounts: accounts.length,
            goals: goals.length,
            bills: bills.length,
            liabilities: liabilities.length,
            userCategories: userCategories.length,
            hasExistingData
          });
          setIsNewUser(!hasExistingData);

          // Track app initialization
          analytics.trackEngagement('app_initialized', {
            feature: 'app_startup',
            is_new_user: !hasExistingData,
            has_accounts: accounts.length > 0,
            has_goals: goals.length > 0,
            has_bills: bills.length > 0,
            has_liabilities: liabilities.length > 0,
            has_custom_categories: userCategories.length > 0
          });

          setIsInitialized(true);
        } else {
          // Clear user data when not authenticated
          analytics.clearUserData();
          errorMonitoring.setUserId(null);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setInitializationError(error instanceof Error ? error.message : 'Initialization failed');
        setIsInitialized(true); // Still show the app even if initialization fails
      }
    };

    initializeApp();
  }, [isAuthenticated, user, accounts, goals, bills, liabilities, userCategories]);

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

      // Wait for data loading to complete before making routing decisions
      if (loading) {
        console.log('AppInitializer - Data still loading, waiting...');
        return;
      }

      // Check if user has existing data
      const hasExistingData = accounts.length > 0 || goals.length > 0 || bills.length > 0 || liabilities.length > 0 || userCategories.length > 0;
      
      console.log('AppInitializer - Routing decision:', {
        currentPath: location.pathname,
        hasExistingData,
        accounts: accounts.length,
        goals: goals.length,
        bills: bills.length,
        liabilities: liabilities.length,
        userCategories: userCategories.length,
        loading
      });

      // If user is new (no existing data) and not already on onboarding
      if (!hasExistingData && location.pathname !== '/onboarding') {
        console.log('AppInitializer - Redirecting to onboarding (new user)');
        navigate('/onboarding');
        return;
      }

      // If user has existing data and is on onboarding, redirect to dashboard
      if (hasExistingData && location.pathname === '/onboarding') {
        console.log('AppInitializer - Redirecting to dashboard (existing user on onboarding)');
        navigate('/dashboard');
        return;
      }

      // If user is on root path and has data, redirect to dashboard
      if (hasExistingData && location.pathname === '/') {
        console.log('AppInitializer - Redirecting to dashboard (existing user on root)');
        navigate('/dashboard');
        return;
      }
    };

    handleRouting();
  }, [isInitialized, isAuthenticated, user, accounts, goals, bills, liabilities, userCategories, loading, location.pathname, navigate]);

  if (!isInitialized) {
    return (
      <LoadingScreen 
        message="Initializing your financial app..." 
        submessage="Loading your data and setting up the app..."
      />
    );
  }

  // Show loading screen while data is being loaded after authentication
  if (isAuthenticated && user && loading) {
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
