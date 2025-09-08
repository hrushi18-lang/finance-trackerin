import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContextOffline';
import { syncManager } from '../lib/sync-manager';
import { offlinePersistence } from '../lib/offline-persistence';
import { conflictResolver } from '../lib/conflict-resolver';
import { financeManager } from '../lib/finance-manager';
import { LoadingScreen } from './common/LoadingScreen';
import { analytics } from '../utils/analytics';
import { auditLogger } from '../utils/auditLogger';
import { errorMonitoring } from '../utils/errorMonitoring';

interface AppInitializerProps {
  children: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { accounts, goals, bills, liabilities, userCategories } = useFinance();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (isAuthenticated && user) {
          // Set user ID for all managers
          const userId = user.id;
          syncManager.setUserId(userId);
          offlinePersistence.setUserId(userId);
          conflictResolver.setUserId(userId);
          financeManager.setUserId(userId);

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
          errorMonitoring.setSeverityThreshold('medium'); // Only capture medium+ severity errors

          // Log user login
          auditLogger.logUser(userId, 'login', {
            platform: 'web',
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          });

          // Initialize offline storage
          await offlinePersistence.initialize();

          // Start sync if online
          if (navigator.onLine) {
            await syncManager.startSync();
          }

          // Check for conflicts
          const conflicts = conflictResolver.getUnresolvedConflicts();
          if (conflicts.length > 0) {
            console.log(`Found ${conflicts.length} unresolved conflicts`);
          }

          // Determine if user is new based on existing data
          const hasExistingData = accounts.length > 0 || goals.length > 0 || bills.length > 0 || liabilities.length > 0 || userCategories.length > 0;
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
          syncManager.setUserId(null);
          offlinePersistence.setUserId(null);
          conflictResolver.setUserId(null);
          financeManager.setUserId(null);
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

  if (!isInitialized) {
    return (
      <LoadingScreen 
        message="Initializing your financial app..." 
        submessage="Setting up offline storage and sync..."
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
