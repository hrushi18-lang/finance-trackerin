import { supabase } from './supabase';
import { offlineStorage } from './offline-storage';
import { financeManager } from './finance-manager';
import { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type FinancialAccount = Database['public']['Tables']['financial_accounts']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type Goal = Database['public']['Tables']['goals']['Row'];
type Budget = Database['public']['Tables']['budgets']['Row'];
type Liability = Database['public']['Tables']['liabilities']['Row'];
type Bill = Database['public']['Tables']['bills']['Row'];

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  isSyncing: boolean;
  syncError: string | null;
  pendingChanges: number;
}

interface ConflictResolution {
  strategy: 'server' | 'client' | 'manual';
  conflicts: Array<{
    table: string;
    recordId: string;
    serverVersion: any;
    clientVersion: any;
  }>;
}

class SyncManager {
  private userId: string | null = null;
  private syncStatus: SyncStatus = {
    isOnline: false,
    lastSync: null,
    isSyncing: false,
    syncError: null,
    pendingChanges: 0
  };
  private syncListeners: Array<(status: SyncStatus) => void> = [];
  private conflictResolution: ConflictResolution = {
    strategy: 'server',
    conflicts: []
  };

  constructor() {
    this.setupNetworkListener();
    this.setupPeriodicSync();
  }

  setUserId(userId: string | null) {
    this.userId = userId;
    if (userId) {
      this.startSync();
    }
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  addSyncListener(listener: (status: SyncStatus) => void) {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.syncListeners.forEach(listener => listener(this.syncStatus));
  }

  private setupNetworkListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.syncStatus.isOnline = true;
        this.notifyListeners();
        this.startSync();
      });

      window.addEventListener('offline', () => {
        this.syncStatus.isOnline = false;
        this.notifyListeners();
      });

      // Check initial network status
      this.syncStatus.isOnline = navigator.onLine;
    }
  }

  private setupPeriodicSync() {
    // Sync every 5 minutes when online
    setInterval(() => {
      if (this.syncStatus.isOnline && this.userId && !this.syncStatus.isSyncing) {
        this.startSync();
      }
    }, 5 * 60 * 1000);
  }

  async startSync(): Promise<void> {
    if (!this.userId || this.syncStatus.isSyncing) {
      return;
    }

    this.syncStatus.isSyncing = true;
    this.syncStatus.syncError = null;
    this.notifyListeners();

    try {
      await this.performSync();
      this.syncStatus.lastSync = new Date();
      this.syncStatus.pendingChanges = 0;
    } catch (error) {
      this.syncStatus.syncError = error instanceof Error ? error.message : 'Sync failed';
      console.error('Sync error:', error);
    } finally {
      this.syncStatus.isSyncing = false;
      this.notifyListeners();
    }
  }

  private async performSync(): Promise<void> {
    if (!this.userId) return;

    // 1. Upload local changes to server
    await this.uploadLocalChanges();

    // 2. Download server changes
    await this.downloadServerChanges();

    // 3. Resolve conflicts
    await this.resolveConflicts();

    // 4. Update local storage
    await this.updateLocalStorage();
  }

  private async uploadLocalChanges(): Promise<void> {
    if (!this.userId) return;

    const localChanges = await this.getLocalChanges();
    
    for (const change of localChanges) {
      try {
        switch (change.table) {
          case 'financial_accounts':
            if (change.operation === 'insert') {
              await supabase.from('financial_accounts').insert(change.data);
            } else if (change.operation === 'update') {
              await supabase.from('financial_accounts').update(change.data).eq('id', change.id);
            } else if (change.operation === 'delete') {
              await supabase.from('financial_accounts').delete().eq('id', change.id);
            }
            break;
          case 'transactions':
            if (change.operation === 'insert') {
              await supabase.from('transactions').insert(change.data);
            } else if (change.operation === 'update') {
              await supabase.from('transactions').update(change.data).eq('id', change.id);
            } else if (change.operation === 'delete') {
              await supabase.from('transactions').delete().eq('id', change.id);
            }
            break;
          case 'goals':
            if (change.operation === 'insert') {
              await supabase.from('goals').insert(change.data);
            } else if (change.operation === 'update') {
              await supabase.from('goals').update(change.data).eq('id', change.id);
            } else if (change.operation === 'delete') {
              await supabase.from('goals').delete().eq('id', change.id);
            }
            break;
          case 'budgets':
            if (change.operation === 'insert') {
              await supabase.from('budgets').insert(change.data);
            } else if (change.operation === 'update') {
              await supabase.from('budgets').update(change.data).eq('id', change.id);
            } else if (change.operation === 'delete') {
              await supabase.from('budgets').delete().eq('id', change.id);
            }
            break;
          case 'liabilities':
            if (change.operation === 'insert') {
              await supabase.from('liabilities').insert(change.data);
            } else if (change.operation === 'update') {
              await supabase.from('liabilities').update(change.data).eq('id', change.id);
            } else if (change.operation === 'delete') {
              await supabase.from('liabilities').delete().eq('id', change.id);
            }
            break;
          case 'bills':
            if (change.operation === 'insert') {
              await supabase.from('bills').insert(change.data);
            } else if (change.operation === 'update') {
              await supabase.from('bills').update(change.data).eq('id', change.id);
            } else if (change.operation === 'delete') {
              await supabase.from('bills').delete().eq('id', change.id);
            }
            break;
        }
        
        // Mark change as synced
        await this.markChangeAsSynced(change.id);
      } catch (error) {
        console.error(`Error syncing ${change.table} change:`, error);
        // Handle conflict or error
        await this.handleSyncError(change, error);
      }
    }
  }

  private async downloadServerChanges(): Promise<void> {
    if (!this.userId) return;

    const lastSync = this.syncStatus.lastSync;
    const timestamp = lastSync ? lastSync.toISOString() : new Date(0).toISOString();

    // Download changes from each table
    const tables = ['financial_accounts', 'transactions', 'goals', 'budgets', 'liabilities', 'bills'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', this.userId)
          .gte('updated_at', timestamp);

        if (error) throw error;

        if (data && data.length > 0) {
          await this.storeServerChanges(table, data);
        }
      } catch (error) {
        console.error(`Error downloading ${table} changes:`, error);
      }
    }
  }

  private async resolveConflicts(): Promise<void> {
    if (this.conflictResolution.conflicts.length === 0) return;

    for (const conflict of this.conflictResolution.conflicts) {
      try {
        switch (this.conflictResolution.strategy) {
          case 'server':
            // Use server version
            await this.applyServerVersion(conflict);
            break;
          case 'client':
            // Use client version
            await this.applyClientVersion(conflict);
            break;
          case 'manual':
            // Let user decide (implement UI for this)
            await this.promptUserResolution(conflict);
            break;
        }
      } catch (error) {
        console.error('Error resolving conflict:', error);
      }
    }

    this.conflictResolution.conflicts = [];
  }

  private async getLocalChanges(): Promise<any[]> {
    const changes = await offlineStorage.getItem<any[]>('pending_changes') || [];
    return changes.filter(change => !change.synced);
  }

  private async markChangeAsSynced(changeId: string): Promise<void> {
    const changes = await offlineStorage.getItem<any[]>('pending_changes') || [];
    const updatedChanges = changes.map(change => 
      change.id === changeId ? { ...change, synced: true } : change
    );
    await offlineStorage.setItem('pending_changes', updatedChanges);
  }

  private async storeServerChanges(table: string, data: any[]): Promise<void> {
    const key = `${table}_${this.userId}`;
    const existingData = await offlineStorage.getItem<any[]>(key) || [];
    
    // Merge with existing data
    const mergedData = this.mergeData(existingData, data);
    await offlineStorage.setItem(key, mergedData);
  }

  private mergeData(existing: any[], incoming: any[]): any[] {
    const merged = [...existing];
    
    for (const item of incoming) {
      const existingIndex = merged.findIndex(existing => existing.id === item.id);
      if (existingIndex >= 0) {
        // Update existing item
        merged[existingIndex] = item;
      } else {
        // Add new item
        merged.push(item);
      }
    }
    
    return merged;
  }

  private async applyServerVersion(conflict: any): Promise<void> {
    // Implement server version application
    console.log('Applying server version for conflict:', conflict);
  }

  private async applyClientVersion(conflict: any): Promise<void> {
    // Implement client version application
    console.log('Applying client version for conflict:', conflict);
  }

  private async promptUserResolution(conflict: any): Promise<void> {
    // Implement user resolution UI
    console.log('Prompting user for conflict resolution:', conflict);
  }

  private async handleSyncError(change: any, error: any): Promise<void> {
    // Handle sync errors (conflicts, network issues, etc.)
    console.error('Sync error for change:', change, error);
  }

  private async updateLocalStorage(): Promise<void> {
    // Update local storage with synced data
    console.log('Updating local storage with synced data');
  }

  // Public methods for conflict resolution
  setConflictResolutionStrategy(strategy: 'server' | 'client' | 'manual') {
    this.conflictResolution.strategy = strategy;
  }

  getConflicts(): ConflictResolution['conflicts'] {
    return this.conflictResolution.conflicts;
  }

  resolveConflict(conflictId: string, resolution: 'server' | 'client'): void {
    const conflict = this.conflictResolution.conflicts.find(c => c.recordId === conflictId);
    if (conflict) {
      if (resolution === 'server') {
        this.applyServerVersion(conflict);
      } else {
        this.applyClientVersion(conflict);
      }
      this.conflictResolution.conflicts = this.conflictResolution.conflicts.filter(c => c.recordId !== conflictId);
    }
  }

  // Force sync method
  async forceSync(): Promise<void> {
    if (this.syncStatus.isSyncing) return;
    await this.startSync();
  }

  // Get sync statistics
  getSyncStats(): {
    lastSync: Date | null;
    pendingChanges: number;
    isOnline: boolean;
    isSyncing: boolean;
  } {
    return {
      lastSync: this.syncStatus.lastSync,
      pendingChanges: this.syncStatus.pendingChanges,
      isOnline: this.syncStatus.isOnline,
      isSyncing: this.syncStatus.isSyncing
    };
  }
}

export const syncManager = new SyncManager();
