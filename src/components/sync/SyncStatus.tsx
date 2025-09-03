import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ConflictResolutionModal } from './ConflictResolutionModal';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Database,
  Upload,
  Download,
  AlertCircle
} from 'lucide-react';
import { syncManager } from '../../lib/sync-manager';
import { offlinePersistence } from '../../lib/offline-persistence';
import { conflictResolver } from '../../lib/conflict-resolver';
import { format } from 'date-fns';

interface SyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [syncStatus, setSyncStatus] = useState(syncManager.getSyncStatus());
  const [queueStatus, setQueueStatus] = useState(offlinePersistence.getQueueStatus());
  const [conflictStats, setConflictStats] = useState(conflictResolver.getConflictStats());
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = syncManager.addSyncListener((status) => {
      setSyncStatus(status);
    });

    const interval = setInterval(() => {
      setQueueStatus(offlinePersistence.getQueueStatus());
      setConflictStats(conflictResolver.getConflictStats());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    setIsRefreshing(true);
    try {
      await syncManager.forceSync();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResolveConflicts = () => {
    setShowConflictModal(true);
  };

  const getStatusIcon = () => {
    if (syncStatus.isSyncing) {
      return <RefreshCw size={16} className="animate-spin text-blue-600" />;
    }
    
    if (syncStatus.syncError) {
      return <AlertCircle size={16} className="text-red-600" />;
    }
    
    if (conflictStats.unresolvedConflicts > 0) {
      return <AlertTriangle size={16} className="text-orange-600" />;
    }
    
    if (syncStatus.isOnline) {
      return <Wifi size={16} className="text-green-600" />;
    }
    
    return <WifiOff size={16} className="text-gray-600" />;
  };

  const getStatusText = () => {
    if (syncStatus.isSyncing) {
      return 'Syncing...';
    }
    
    if (syncStatus.syncError) {
      return 'Sync Error';
    }
    
    if (conflictStats.unresolvedConflicts > 0) {
      return `${conflictStats.unresolvedConflicts} conflicts`;
    }
    
    if (queueStatus.pendingOperations > 0) {
      return `${queueStatus.pendingOperations} pending`;
    }
    
    if (syncStatus.isOnline) {
      return 'Online';
    }
    
    return 'Offline';
  };

  const getStatusColor = () => {
    if (syncStatus.isSyncing) {
      return 'text-blue-600';
    }
    
    if (syncStatus.syncError) {
      return 'text-red-600';
    }
    
    if (conflictStats.unresolvedConflicts > 0) {
      return 'text-orange-600';
    }
    
    if (queueStatus.pendingOperations > 0) {
      return 'text-yellow-600';
    }
    
    if (syncStatus.isOnline) {
      return 'text-green-600';
    }
    
    return 'text-gray-600';
  };

  if (showDetails) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Sync Status Card */}
        <div
          className="p-4 rounded-2xl"
          style={{
            backgroundColor: 'var(--background-secondary)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
              Sync Status
            </h3>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className={`text-sm font-body ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                Last Sync
              </p>
              <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                {syncStatus.lastSync 
                  ? format(syncStatus.lastSync, 'MMM dd, HH:mm')
                  : 'Never'
                }
              </p>
            </div>
            <div>
              <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                Pending Changes
              </p>
              <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                {queueStatus.pendingOperations}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSync}
              loading={isRefreshing}
              icon={<RefreshCw size={14} />}
              className="flex-1"
            >
              Sync Now
            </Button>
            {conflictStats.unresolvedConflicts > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleResolveConflicts}
                icon={<AlertTriangle size={14} />}
                className="flex-1"
              >
                Resolve
              </Button>
            )}
          </div>
        </div>

        {/* Queue Status */}
        {queueStatus.pendingOperations > 0 && (
          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <h3 className="font-heading text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
              Pending Operations
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  Total Operations
                </span>
                <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                  {queueStatus.totalOperations}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  Pending
                </span>
                <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                  {queueStatus.pendingOperations}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  Synced
                </span>
                <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                  {queueStatus.syncedOperations}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Conflict Status */}
        {conflictStats.unresolvedConflicts > 0 && (
          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <h3 className="font-heading text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
              Data Conflicts
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  Unresolved
                </span>
                <span className="text-sm font-body text-orange-600">
                  {conflictStats.unresolvedConflicts}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  Resolved
                </span>
                <span className="text-sm font-body text-green-600">
                  {conflictStats.resolvedConflicts}
                </span>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleResolveConflicts}
              icon={<AlertTriangle size={14} />}
              fullWidth
              className="mt-3"
            >
              Resolve Conflicts
            </Button>
          </div>
        )}

        {/* Sync Error */}
        {syncStatus.syncError && (
          <div
            className="p-4 rounded-2xl border border-red-200 bg-red-50"
          >
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle size={16} className="text-red-600" />
              <h3 className="font-heading text-sm text-red-600">
                Sync Error
              </h3>
            </div>
            <p className="text-sm font-body text-red-600 mb-3">
              {syncStatus.syncError}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSync}
              loading={isRefreshing}
              icon={<RefreshCw size={14} />}
              fullWidth
            >
              Retry Sync
            </Button>
          </div>
        )}

        {/* Modals */}
        <ConflictResolutionModal
          isOpen={showConflictModal}
          onClose={() => setShowConflictModal(false)}
          onResolve={() => {
            setConflictStats(conflictResolver.getConflictStats());
            setShowConflictModal(false);
          }}
        />
      </div>
    );
  }

  // Compact view
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getStatusIcon()}
      <span className={`text-sm font-body ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {conflictStats.unresolvedConflicts > 0 && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleResolveConflicts}
          icon={<AlertTriangle size={14} />}
        >
          Resolve
        </Button>
      )}
    </div>
  );
};
