import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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

          // For now, assume user is not new (onboarding will handle this)
          setIsNewUser(false);

          // Track app initialization
          analytics.trackEngagement('app_initialized', {
            feature: 'app_startup',
            is_new_user: false
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
  }, [isAuthenticated, user]);

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

      // Redirect to dashboard if on root path
      if (location.pathname === '/') {
        navigate('/dashboard');
        return;
      }
      
      console.log('AppInitializer - Routing decision:', {
        currentPath: location.pathname,
        isAuthenticated,
        hasUser: !!user
      });
    };

    handleRouting();
  }, [isInitialized, isAuthenticated, user, location.pathname, navigate]);

  if (!isInitialized) {
    return (
      <LoadingScreen 
        message="Initializing your financial app..." 
        submessage="Loading your data and setting up the app..."
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
