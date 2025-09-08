/**
 * Offline Storage Manager
 * Handles local data persistence and synchronization
 */

import { Database } from '../types/supabase';
import { supabase } from './supabase';

export type LocalStorageKey = 
  | 'user_profile'
  | 'financial_accounts'
  | 'transactions'
  | 'goals'
  | 'budgets'
  | 'liabilities'
  | 'bills'
  | 'recurring_transactions'
  | 'sync_status'
  | 'offline_queue';

export interface SyncStatus {
  lastSync: string | null;
  isOnline: boolean;
  pendingChanges: number;
  lastError: string | null;
}

export interface OfflineQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: string;
  retryCount: number;
}

class OfflineStorage {
  private isOnline: boolean = navigator.onLine;
  private syncStatus: SyncStatus = {
    lastSync: null,
    isOnline: this.isOnline,
    pendingChanges: 0,
    lastError: null
  };

  constructor() {
    this.setupEventListeners();
    this.initializeStorage();
  }

  async initialize(): Promise<void> {
    await this.initializeStorage();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncStatus.isOnline = true;
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.syncStatus.isOnline = false;
    });
  }

  private async initializeStorage() {
    // Initialize IndexedDB for offline storage
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported, falling back to localStorage');
      return;
    }

    try {
      const request = indexedDB.open('FinTrackDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for each table
        const tables = [
          'profiles', 'financial_accounts', 'transactions', 'goals', 
          'budgets', 'liabilities', 'bills', 'recurring_transactions',
          'enhanced_liabilities', 'assets', 'bill_instances', 
          'liability_payments', 'notifications', 'user_categories',
          'bill_account_links', 'bill_staging_history', 'bill_completion_tracking',
          'income_sources', 'account_transfers', 'bill_reminders',
          'debt_payments', 'transaction_splits', 'financial_insights'
        ];

        tables.forEach(table => {
          if (!db.objectStoreNames.contains(table)) {
            const store = db.createObjectStore(table, { keyPath: 'id' });
            store.createIndex('user_id', 'user_id', { unique: false });
            store.createIndex('created_at', 'created_at', { unique: false });
            store.createIndex('updated_at', 'updated_at', { unique: false });
          }
        });

        // Create sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('table', 'table', { unique: false });
        }
      };

      request.onsuccess = () => {
        console.log('IndexedDB initialized successfully');
      };

      request.onerror = () => {
        console.error('Failed to initialize IndexedDB');
      };
    } catch (error) {
      console.error('Error initializing offline storage:', error);
    }
  }

  // Generic CRUD operations
  async create<T>(table: string, data: T): Promise<T> {
    const item = {
      ...data,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _local: true
    };

    if (this.isOnline) {
      try {
        // Try to sync immediately if online
        const syncedItem = await this.syncCreate(table, item);
        await this.saveToLocal(table, syncedItem);
        return syncedItem;
      } catch (error) {
        // If sync fails, save locally and queue for later
        await this.saveToLocal(table, item);
        await this.addToSyncQueue('create', table, item);
        return item;
      }
    } else {
      // Offline: save locally and queue for sync
      await this.saveToLocal(table, item);
      await this.addToSyncQueue('create', table, item);
      return item;
    }
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const existingItem = await this.getById(table, id);
    if (!existingItem) {
      throw new Error(`Item with id ${id} not found in ${table}`);
    }

    const updatedItem = {
      ...existingItem,
      ...data,
      updated_at: new Date().toISOString(),
      _local: true
    };

    if (this.isOnline) {
      try {
        const syncedItem = await this.syncUpdate(table, id, updatedItem);
        await this.saveToLocal(table, syncedItem);
        return syncedItem;
      } catch (error) {
        await this.saveToLocal(table, updatedItem);
        await this.addToSyncQueue('update', table, updatedItem);
        return updatedItem;
      }
    } else {
      await this.saveToLocal(table, updatedItem);
      await this.addToSyncQueue('update', table, updatedItem);
      return updatedItem;
    }
  }

  async delete(table: string, id: string): Promise<void> {
    if (this.isOnline) {
      try {
        await this.syncDelete(table, id);
        await this.removeFromLocal(table, id);
      } catch (error) {
        await this.addToSyncQueue('delete', table, { id });
      }
    } else {
      await this.addToSyncQueue('delete', table, { id });
      // Mark as deleted locally
      const item = await this.getById(table, id);
      if (item) {
        await this.saveToLocal(table, { ...item, _deleted: true });
      }
    }
  }

  async getAll<T>(table: string, userId?: string): Promise<T[]> {
    try {
      const items = await this.getFromLocal(table, userId);
      return items.filter(item => !item._deleted);
    } catch (error) {
      console.error(`Error getting ${table}:`, error);
      return [];
    }
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    try {
      return await this.getFromLocalById(table, id);
    } catch (error) {
      console.error(`Error getting ${table} by id:`, error);
      return null;
    }
  }

  // Local storage operations
  private async saveToLocal(table: string, data: any): Promise<void> {
    if (window.indexedDB) {
      return this.saveToIndexedDB(table, data);
    } else {
      return this.saveToLocalStorage(table, data);
    }
  }

  private async getFromLocal(table: string, userId?: string): Promise<any[]> {
    if (window.indexedDB) {
      return this.getFromIndexedDB(table, userId);
    } else {
      return this.getFromLocalStorage(table, userId);
    }
  }

  private async getFromLocalById(table: string, id: string): Promise<any> {
    if (window.indexedDB) {
      return this.getFromIndexedDBById(table, id);
    } else {
      return this.getFromLocalStorageById(table, id);
    }
  }

  private async removeFromLocal(table: string, id: string): Promise<void> {
    if (window.indexedDB) {
      return this.removeFromIndexedDB(table, id);
    } else {
      return this.removeFromLocalStorage(table, id);
    }
  }

  // IndexedDB operations
  private async saveToIndexedDB(table: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FinTrackDB', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([table], 'readwrite');
        const store = transaction.objectStore(table);
        store.put(data);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private async getFromIndexedDB(table: string, userId?: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FinTrackDB', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([table], 'readonly');
        const store = transaction.objectStore(table);
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          let items = getAllRequest.result;
          if (userId) {
            items = items.filter(item => item.user_id === userId);
          }
          resolve(items);
        };
        
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private async getFromIndexedDBById(table: string, id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FinTrackDB', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([table], 'readonly');
        const store = transaction.objectStore(table);
        const getRequest = store.get(id);
        
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private async removeFromIndexedDB(table: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FinTrackDB', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([table], 'readwrite');
        const store = transaction.objectStore(table);
        store.delete(id);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // LocalStorage fallback operations
  private async saveToLocalStorage(table: string, data: any): Promise<void> {
    const key = `fintrack_${table}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const index = existing.findIndex((item: any) => item.id === data.id);
    
    if (index >= 0) {
      existing[index] = data;
    } else {
      existing.push(data);
    }
    
    localStorage.setItem(key, JSON.stringify(existing));
  }

  private async getFromLocalStorage(table: string, userId?: string): Promise<any[]> {
    const key = `fintrack_${table}`;
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    
    if (userId) {
      return items.filter((item: any) => item.user_id === userId);
    }
    
    return items;
  }

  private async getFromLocalStorageById(table: string, id: string): Promise<any> {
    const items = await this.getFromLocalStorage(table);
    return items.find((item: any) => item.id === id) || null;
  }

  private async removeFromLocalStorage(table: string, id: string): Promise<void> {
    const key = `fintrack_${table}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = existing.filter((item: any) => item.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  // Sync operations
  private async syncCreate(table: string, data: any): Promise<any> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    } catch (error) {
      console.error(`Failed to sync create ${table}:`, error);
      throw error;
    }
  }

  private async syncUpdate(table: string, id: string, data: any): Promise<any> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    } catch (error) {
      console.error(`Failed to sync update ${table}:`, error);
      throw error;
    }
  }

  private async syncDelete(table: string, id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(`Failed to sync delete ${table}:`, error);
      throw error;
    }
  }

  // Sync queue management
  private async addToSyncQueue(action: 'create' | 'update' | 'delete', table: string, data: any): Promise<void> {
    const queueItem: OfflineQueueItem = {
      id: this.generateId(),
      action,
      table,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    if (window.indexedDB) {
      const request = indexedDB.open('FinTrackDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['sync_queue'], 'readwrite');
        const store = transaction.objectStore('sync_queue');
        store.add(queueItem);
      };
    } else {
      const key = 'fintrack_sync_queue';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(queueItem);
      localStorage.setItem(key, JSON.stringify(existing));
    }

    this.syncStatus.pendingChanges++;
  }

  private async syncPendingChanges(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const queueItems = await this.getSyncQueue();
      
      for (const item of queueItems) {
        try {
          switch (item.action) {
            case 'create':
              await this.syncCreate(item.table, item.data);
              break;
            case 'update':
              await this.syncUpdate(item.table, item.data.id, item.data);
              break;
            case 'delete':
              await this.syncDelete(item.table, item.data.id);
              break;
          }
          
          await this.removeFromSyncQueue(item.id);
          this.syncStatus.pendingChanges--;
        } catch (error) {
          item.retryCount++;
          if (item.retryCount >= 3) {
            await this.removeFromSyncQueue(item.id);
            this.syncStatus.pendingChanges--;
          }
        }
      }

      this.syncStatus.lastSync = new Date().toISOString();
      this.syncStatus.lastError = null;
    } catch (error) {
      this.syncStatus.lastError = error.message;
    }
  }

  private async getSyncQueue(): Promise<OfflineQueueItem[]> {
    if (window.indexedDB) {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('FinTrackDB', 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync_queue'], 'readonly');
          const store = transaction.objectStore('sync_queue');
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => resolve(getAllRequest.result);
          getAllRequest.onerror = () => reject(getAllRequest.error);
        };
        request.onerror = () => reject(request.error);
      });
    } else {
      const key = 'fintrack_sync_queue';
      return JSON.parse(localStorage.getItem(key) || '[]');
    }
  }

  private async removeFromSyncQueue(id: string): Promise<void> {
    if (window.indexedDB) {
      const request = indexedDB.open('FinTrackDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['sync_queue'], 'readwrite');
        const store = transaction.objectStore('sync_queue');
        store.delete(id);
      };
    } else {
      const key = 'fintrack_sync_queue';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = existing.filter((item: any) => item.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  }

  // Utility methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Additional methods for compatibility
  async getItem(key: string): Promise<any> {
    try {
      const data = await this.getFromLocal(key);
      return data;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  async setItem(key: string, value: any): Promise<void> {
    try {
      await this.saveToLocal(key, value);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      // This is a simplified version - in practice you'd need to know the ID
      console.warn('removeItem called but ID not specified');
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  }

  // Public API
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  isOnlineMode(): boolean {
    return this.isOnline;
  }

  async forceSync(): Promise<void> {
    await this.syncPendingChanges();
  }

  async clearLocalData(): Promise<void> {
    if (window.indexedDB) {
      const request = indexedDB.deleteDatabase('FinTrackDB');
      request.onsuccess = () => {
        this.initializeStorage();
      };
    } else {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('fintrack_'));
      keys.forEach(key => localStorage.removeItem(key));
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();
export default offlineStorage;
