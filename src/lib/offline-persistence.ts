import { offlineStorage } from './offline-storage';
import { financeManager } from './finance-manager';
import { syncManager } from './sync-manager';

interface OfflineOperation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: Date;
  synced: boolean;
  retryCount: number;
}

interface OfflineQueue {
  operations: OfflineOperation[];
  lastProcessed: Date | null;
}

interface DataIntegrityCheck {
  table: string;
  recordCount: number;
  lastModified: Date | null;
  checksum: string;
  isValid: boolean;
}

class OfflinePersistence {
  private userId: string | null = null;
  private operationQueue: OfflineQueue = {
    operations: [],
    lastProcessed: null
  };
  private dataIntegrityChecks: DataIntegrityCheck[] = [];
  private isProcessingQueue = false;
  private queueProcessors: Array<(queue: OfflineQueue) => void> = [];

  constructor() {
    this.setupQueueProcessor();
    this.setupDataIntegrityChecks();
  }

  setUserId(userId: string | null) {
    this.userId = userId;
    if (userId) {
      this.loadOperationQueue();
      this.startDataIntegrityChecks();
    }
  }

  // Queue operations for offline processing
  async queueOperation(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: Record<string, unknown>,
    recordId?: string
  ): Promise<void> {
    if (!this.userId) return;

    const operationId = `${table}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const offlineOperation: OfflineOperation = {
      id: operationId,
      table,
      operation,
      data: {
        ...data,
        id: recordId || data.id,
        user_id: this.userId,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      timestamp: new Date(),
      synced: false,
      retryCount: 0
    };

    this.operationQueue.operations.push(offlineOperation);
    await this.saveOperationQueue();
    
    // Process queue if online
    if (syncManager.getSyncStatus().isOnline) {
      this.processQueue();
    }
  }

  // Process the operation queue
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.operationQueue.operations.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const unsyncedOperations = this.operationQueue.operations.filter(op => !op.synced);
      
      for (const operation of unsyncedOperations) {
        try {
          await this.executeOperation(operation);
          operation.synced = true;
          operation.retryCount = 0;
        } catch (error) {
          operation.retryCount++;
          console.error(`Error executing operation ${operation.id}:`, error);
          
          // Remove operation if it has failed too many times
          if (operation.retryCount >= 3) {
            console.error(`Operation ${operation.id} failed too many times, removing from queue`);
            this.operationQueue.operations = this.operationQueue.operations.filter(op => op.id !== operation.id);
          }
        }
      }

      this.operationQueue.lastProcessed = new Date();
      await this.saveOperationQueue();
      
      // Notify queue processors
      this.queueProcessors.forEach(processor => processor(this.operationQueue));
      
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Execute a single operation
  private async executeOperation(operation: OfflineOperation): Promise<void> {
    switch (operation.table) {
      case 'financial_accounts':
        await this.executeAccountOperation(operation);
        break;
      case 'transactions':
        await this.executeTransactionOperation(operation);
        break;
      case 'goals':
        await this.executeGoalOperation(operation);
        break;
      case 'budgets':
        await this.executeBudgetOperation(operation);
        break;
      case 'liabilities':
        await this.executeLiabilityOperation(operation);
        break;
      case 'bills':
        await this.executeBillOperation(operation);
        break;
      default:
        throw new Error(`Unknown table: ${operation.table}`);
    }
  }

  private async executeAccountOperation(operation: OfflineOperation): Promise<void> {
    switch (operation.operation) {
      case 'insert':
        await financeManager.createAccount(operation.data);
        break;
      case 'update':
        await financeManager.updateAccount(operation.data.id, operation.data);
        break;
      case 'delete':
        await financeManager.deleteAccount(operation.data.id);
        break;
    }
  }

  private async executeTransactionOperation(operation: OfflineOperation): Promise<void> {
    switch (operation.operation) {
      case 'insert':
        await financeManager.createTransaction(operation.data);
        break;
      case 'update':
        await financeManager.updateTransaction(operation.data.id, operation.data);
        break;
      case 'delete':
        await financeManager.deleteTransaction(operation.data.id);
        break;
    }
  }

  private async executeGoalOperation(operation: OfflineOperation): Promise<void> {
    switch (operation.operation) {
      case 'insert':
        await financeManager.createGoal(operation.data);
        break;
      case 'update':
        await financeManager.updateGoal(operation.data.id, operation.data);
        break;
      case 'delete':
        await financeManager.deleteGoal(operation.data.id);
        break;
    }
  }

  private async executeBudgetOperation(operation: OfflineOperation): Promise<void> {
    switch (operation.operation) {
      case 'insert':
        await financeManager.createBudget(operation.data);
        break;
      case 'update':
        await financeManager.updateBudget(operation.data.id, operation.data);
        break;
      case 'delete':
        await financeManager.deleteBudget(operation.data.id);
        break;
    }
  }

  private async executeLiabilityOperation(operation: OfflineOperation): Promise<void> {
    switch (operation.operation) {
      case 'insert':
        await financeManager.createLiability(operation.data);
        break;
      case 'update':
        await financeManager.updateLiability(operation.data.id, operation.data);
        break;
      case 'delete':
        await financeManager.deleteLiability(operation.data.id);
        break;
    }
  }

  private async executeBillOperation(operation: OfflineOperation): Promise<void> {
    switch (operation.operation) {
      case 'insert':
        await financeManager.createBill(operation.data);
        break;
      case 'update':
        await financeManager.updateBill(operation.data.id, operation.data);
        break;
      case 'delete':
        await financeManager.deleteBill(operation.data.id);
        break;
    }
  }

  // Save operation queue to offline storage
  private async saveOperationQueue(): Promise<void> {
    if (!this.userId) return;
    await offlineStorage.setItem(`operation_queue_${this.userId}`, this.operationQueue);
  }

  // Load operation queue from offline storage
  private async loadOperationQueue(): Promise<void> {
    if (!this.userId) return;
    const queue = await offlineStorage.getItem<OfflineQueue>(`operation_queue_${this.userId}`);
    if (queue) {
      this.operationQueue = queue;
    }
  }

  // Setup queue processor
  private setupQueueProcessor(): void {
    // Process queue every 30 seconds
    setInterval(() => {
      if (syncManager.getSyncStatus().isOnline && this.operationQueue.operations.length > 0) {
        this.processQueue();
      }
    }, 30 * 1000);
  }

  // Setup data integrity checks
  private setupDataIntegrityChecks(): void {
    // Run integrity checks every hour
    setInterval(() => {
      this.runDataIntegrityChecks();
    }, 60 * 60 * 1000);
  }

  // Start data integrity checks
  private async startDataIntegrityChecks(): Promise<void> {
    await this.runDataIntegrityChecks();
  }

  // Run data integrity checks
  private async runDataIntegrityChecks(): Promise<void> {
    if (!this.userId) return;

    const tables = ['financial_accounts', 'transactions', 'goals', 'budgets', 'liabilities', 'bills'];
    
    for (const table of tables) {
      try {
        const data = await offlineStorage.getItem<any[]>(`${table}_${this.userId}`) || [];
        const checksum = this.calculateChecksum(data);
        const lastModified = data.length > 0 ? new Date(Math.max(...data.map(item => new Date(item.updated_at).getTime()))) : null;
        
        const integrityCheck: DataIntegrityCheck = {
          table,
          recordCount: data.length,
          lastModified,
          checksum,
          isValid: true // For now, assume all data is valid
        };

        this.dataIntegrityChecks = this.dataIntegrityChecks.filter(check => check.table !== table);
        this.dataIntegrityChecks.push(integrityCheck);
        
      } catch (error) {
        console.error(`Error running integrity check for ${table}:`, error);
      }
    }
  }

  // Calculate checksum for data
  private calculateChecksum(data: Record<string, unknown>[]): string {
    const dataString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Get operation queue status
  getQueueStatus(): {
    totalOperations: number;
    pendingOperations: number;
    syncedOperations: number;
    lastProcessed: Date | null;
  } {
    const totalOperations = this.operationQueue.operations.length;
    const syncedOperations = this.operationQueue.operations.filter(op => op.synced).length;
    const pendingOperations = totalOperations - syncedOperations;

    return {
      totalOperations,
      pendingOperations,
      syncedOperations,
      lastProcessed: this.operationQueue.lastProcessed
    };
  }

  // Get data integrity status
  getDataIntegrityStatus(): DataIntegrityCheck[] {
    return [...this.dataIntegrityChecks];
  }

  // Add queue processor listener
  addQueueProcessor(listener: (queue: OfflineQueue) => void): () => void {
    this.queueProcessors.push(listener);
    return () => {
      this.queueProcessors = this.queueProcessors.filter(p => p !== listener);
    };
  }

  // Clear operation queue
  async clearOperationQueue(): Promise<void> {
    this.operationQueue = {
      operations: [],
      lastProcessed: null
    };
    await this.saveOperationQueue();
  }

  // Force process queue
  async forceProcessQueue(): Promise<void> {
    await this.processQueue();
  }

  // Get offline data statistics
  getOfflineStats(): {
    totalRecords: number;
    lastModified: Date | null;
    storageUsed: number;
    queueSize: number;
  } {
    const totalRecords = this.dataIntegrityChecks.reduce((sum, check) => sum + check.recordCount, 0);
    const lastModified = this.dataIntegrityChecks.reduce((latest, check) => {
      if (!check.lastModified) return latest;
      if (!latest) return check.lastModified;
      return check.lastModified > latest ? check.lastModified : latest;
    }, null as Date | null);
    
    return {
      totalRecords,
      lastModified,
      storageUsed: 0, // Would need to calculate actual storage usage
      queueSize: this.operationQueue.operations.length
    };
  }
}

export const offlinePersistence = new OfflinePersistence();
