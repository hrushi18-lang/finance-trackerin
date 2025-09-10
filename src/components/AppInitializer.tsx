import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { syncManager } from '../lib/sync-manager';
import { offlinePersistence } from '../lib/offline-persistence';
import { conflictResolver } from '../lib/conflict-resolver';
import { financeManager } from '../lib/finance-manager';
import { LoadingScreen } from './common/LoadingScreen';

interface AppInitializerProps {
  children: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

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

          setIsInitialized(true);
        } else {
          // Clear user data when not authenticated
          syncManager.setUserId(null);
          offlinePersistence.setUserId(null);
          conflictResolver.setUserId(null);
          financeManager.setUserId(null);
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
