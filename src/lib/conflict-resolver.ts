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

interface Conflict {
  id: string;
  table: string;
  recordId: string;
  serverVersion: any;
  clientVersion: any;
  conflictType: 'update' | 'delete' | 'insert';
  timestamp: Date;
  resolved: boolean;
  resolution?: 'server' | 'client' | 'merge';
  mergedData?: any;
}

interface ConflictResolutionStrategy {
  strategy: 'server' | 'client' | 'merge' | 'manual';
  rules: {
    [table: string]: {
      strategy: 'server' | 'client' | 'merge' | 'manual';
      mergeFields?: string[];
      priorityFields?: string[];
    };
  };
}

class ConflictResolver {
  private userId: string | null = null;
  private conflicts: Conflict[] = [];
  private resolutionStrategy: ConflictResolutionStrategy = {
    strategy: 'merge',
    rules: {
      financial_accounts: {
        strategy: 'merge',
        mergeFields: ['name', 'institution', 'currency_code'],
        priorityFields: ['balance', 'updated_at']
      },
      transactions: {
        strategy: 'server',
        priorityFields: ['amount', 'date', 'description']
      },
      goals: {
        strategy: 'merge',
        mergeFields: ['name', 'description', 'category'],
        priorityFields: ['target_amount', 'current_amount', 'target_date']
      },
      budgets: {
        strategy: 'merge',
        mergeFields: ['name', 'category'],
        priorityFields: ['amount', 'spent', 'period']
      },
      liabilities: {
        strategy: 'merge',
        mergeFields: ['name', 'description'],
        priorityFields: ['total_amount', 'remaining_amount', 'interest_rate']
      },
      bills: {
        strategy: 'merge',
        mergeFields: ['name', 'description', 'category'],
        priorityFields: ['amount', 'due_date', 'frequency']
      }
    }
  };

  constructor() {
    this.loadConflicts();
  }

  setUserId(userId: string | null) {
    this.userId = userId;
    if (userId) {
      this.loadConflicts();
    }
  }

  // Detect conflicts between server and client data
  async detectConflicts(serverData: any[], clientData: any[], table: string): Promise<Conflict[]> {
    const newConflicts: Conflict[] = [];

    for (const serverRecord of serverData) {
      const clientRecord = clientData.find(c => c.id === serverRecord.id);
      
      if (clientRecord) {
        // Both versions exist, check for conflicts
        if (this.hasConflict(serverRecord, clientRecord)) {
          const conflict: Conflict = {
            id: `${table}_${serverRecord.id}_${Date.now()}`,
            table,
            recordId: serverRecord.id,
            serverVersion: serverRecord,
            clientVersion: clientRecord,
            conflictType: 'update',
            timestamp: new Date(),
            resolved: false
          };
          newConflicts.push(conflict);
        }
      } else {
        // Server has record, client doesn't (server insert)
        const conflict: Conflict = {
          id: `${table}_${serverRecord.id}_${Date.now()}`,
          table,
          recordId: serverRecord.id,
          serverVersion: serverRecord,
          clientVersion: null,
          conflictType: 'insert',
          timestamp: new Date(),
          resolved: false
        };
        newConflicts.push(conflict);
      }
    }

    for (const clientRecord of clientData) {
      const serverRecord = serverData.find(s => s.id === clientRecord.id);
      
      if (!serverRecord) {
        // Client has record, server doesn't (client insert)
        const conflict: Conflict = {
          id: `${table}_${clientRecord.id}_${Date.now()}`,
          table,
          recordId: clientRecord.id,
          serverVersion: null,
          clientVersion: clientRecord,
          conflictType: 'insert',
          timestamp: new Date(),
          resolved: false
        };
        newConflicts.push(conflict);
      }
    }

    this.conflicts = [...this.conflicts, ...newConflicts];
    await this.saveConflicts();
    
    return newConflicts;
  }

  // Check if two records have conflicts
  private hasConflict(serverRecord: any, clientRecord: any): boolean {
    const serverUpdated = new Date(serverRecord.updated_at);
    const clientUpdated = new Date(clientRecord.updated_at);
    
    // If timestamps are different, there's a conflict
    if (serverUpdated.getTime() !== clientUpdated.getTime()) {
      return true;
    }

    // Check for field-level conflicts
    const fieldsToCheck = ['name', 'description', 'amount', 'balance', 'category'];
    
    for (const field of fieldsToCheck) {
      if (serverRecord[field] !== clientRecord[field]) {
        return true;
      }
    }

    return false;
  }

  // Resolve conflicts automatically based on strategy
  async resolveConflicts(): Promise<void> {
    const unresolvedConflicts = this.conflicts.filter(c => !c.resolved);
    
    for (const conflict of unresolvedConflicts) {
      try {
        await this.resolveConflict(conflict);
      } catch (error) {
        console.error(`Error resolving conflict ${conflict.id}:`, error);
      }
    }
  }

  // Resolve a single conflict
  private async resolveConflict(conflict: Conflict): Promise<void> {
    const tableRule = this.resolutionStrategy.rules[conflict.table];
    const strategy = tableRule?.strategy || this.resolutionStrategy.strategy;

    switch (strategy) {
      case 'server':
        await this.resolveWithServerVersion(conflict);
        break;
      case 'client':
        await this.resolveWithClientVersion(conflict);
        break;
      case 'merge':
        await this.resolveWithMerge(conflict);
        break;
      case 'manual':
        // Leave conflict unresolved for manual resolution
        break;
    }
  }

  // Resolve conflict using server version
  private async resolveWithServerVersion(conflict: Conflict): Promise<void> {
    if (conflict.serverVersion) {
      await this.applyResolution(conflict, 'server', conflict.serverVersion);
    }
  }

  // Resolve conflict using client version
  private async resolveWithClientVersion(conflict: Conflict): Promise<void> {
    if (conflict.clientVersion) {
      await this.applyResolution(conflict, 'client', conflict.clientVersion);
    }
  }

  // Resolve conflict by merging both versions
  private async resolveWithMerge(conflict: Conflict): Promise<void> {
    if (!conflict.serverVersion || !conflict.clientVersion) {
      // If one version is missing, use the existing one
      const versionToUse = conflict.serverVersion || conflict.clientVersion;
      const resolution = conflict.serverVersion ? 'server' : 'client';
      await this.applyResolution(conflict, resolution, versionToUse);
      return;
    }

    const tableRule = this.resolutionStrategy.rules[conflict.table];
    const mergedData = this.mergeRecords(
      conflict.serverVersion,
      conflict.clientVersion,
      tableRule?.mergeFields || [],
      tableRule?.priorityFields || []
    );

    await this.applyResolution(conflict, 'merge', mergedData);
  }

  // Merge two records
  private mergeRecords(
    serverRecord: any,
    clientRecord: any,
    mergeFields: string[],
    priorityFields: string[]
  ): any {
    const merged = { ...serverRecord };

    // Merge fields from both versions
    for (const field of mergeFields) {
      if (clientRecord[field] !== undefined && clientRecord[field] !== null) {
        merged[field] = clientRecord[field];
      }
    }

    // Use priority fields (prefer server for these)
    for (const field of priorityFields) {
      if (serverRecord[field] !== undefined && serverRecord[field] !== null) {
        merged[field] = serverRecord[field];
      }
    }

    // Update timestamp to current time
    merged.updated_at = new Date().toISOString();

    return merged;
  }

  // Apply resolution to the conflict
  private async applyResolution(conflict: Conflict, resolution: 'server' | 'client' | 'merge', data: any): Promise<void> {
    try {
      // Update the record in the appropriate table
      switch (conflict.table) {
        case 'financial_accounts':
          if (conflict.conflictType === 'insert') {
            await financeManager.createAccount(data);
          } else {
            await financeManager.updateAccount(conflict.recordId, data);
          }
          break;
        case 'transactions':
          if (conflict.conflictType === 'insert') {
            await financeManager.createTransaction(data);
          } else {
            await financeManager.updateTransaction(conflict.recordId, data);
          }
          break;
        case 'goals':
          if (conflict.conflictType === 'insert') {
            await financeManager.createGoal(data);
          } else {
            await financeManager.updateGoal(conflict.recordId, data);
          }
          break;
        case 'budgets':
          if (conflict.conflictType === 'insert') {
            await financeManager.createBudget(data);
          } else {
            await financeManager.updateBudget(conflict.recordId, data);
          }
          break;
        case 'liabilities':
          if (conflict.conflictType === 'insert') {
            await financeManager.createLiability(data);
          } else {
            await financeManager.updateLiability(conflict.recordId, data);
          }
          break;
        case 'bills':
          if (conflict.conflictType === 'insert') {
            await financeManager.createBill(data);
          } else {
            await financeManager.updateBill(conflict.recordId, data);
          }
          break;
      }

      // Mark conflict as resolved
      conflict.resolved = true;
      conflict.resolution = resolution;
      if (resolution === 'merge') {
        conflict.mergedData = data;
      }

      await this.saveConflicts();
    } catch (error) {
      console.error(`Error applying resolution for conflict ${conflict.id}:`, error);
      throw error;
    }
  }

  // Manually resolve a conflict
  async manualResolveConflict(conflictId: string, resolution: 'server' | 'client' | 'merge', customData?: any): Promise<void> {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    let dataToApply: any;
    
    switch (resolution) {
      case 'server':
        dataToApply = conflict.serverVersion;
        break;
      case 'client':
        dataToApply = conflict.clientVersion;
        break;
      case 'merge':
        dataToApply = customData || this.mergeRecords(
          conflict.serverVersion,
          conflict.clientVersion,
          this.resolutionStrategy.rules[conflict.table]?.mergeFields || [],
          this.resolutionStrategy.rules[conflict.table]?.priorityFields || []
        );
        break;
    }

    await this.applyResolution(conflict, resolution, dataToApply);
  }

  // Get all conflicts
  getConflicts(): Conflict[] {
    return [...this.conflicts];
  }

  // Get unresolved conflicts
  getUnresolvedConflicts(): Conflict[] {
    return this.conflicts.filter(c => !c.resolved);
  }

  // Get conflicts for a specific table
  getConflictsForTable(table: string): Conflict[] {
    return this.conflicts.filter(c => c.table === table);
  }

  // Set resolution strategy
  setResolutionStrategy(strategy: ConflictResolutionStrategy): void {
    this.resolutionStrategy = strategy;
  }

  // Get resolution strategy
  getResolutionStrategy(): ConflictResolutionStrategy {
    return { ...this.resolutionStrategy };
  }

  // Clear resolved conflicts
  async clearResolvedConflicts(): Promise<void> {
    this.conflicts = this.conflicts.filter(c => !c.resolved);
    await this.saveConflicts();
  }

  // Clear all conflicts
  async clearAllConflicts(): Promise<void> {
    this.conflicts = [];
    await this.saveConflicts();
  }

  // Save conflicts to offline storage
  private async saveConflicts(): Promise<void> {
    if (!this.userId) return;
    await offlineStorage.setItem(`conflicts_${this.userId}`, this.conflicts);
  }

  // Load conflicts from offline storage
  private async loadConflicts(): Promise<void> {
    if (!this.userId) return;
    const conflicts = await offlineStorage.getItem<Conflict[]>(`conflicts_${this.userId}`);
    if (conflicts) {
      this.conflicts = conflicts;
    }
  }

  // Get conflict statistics
  getConflictStats(): {
    totalConflicts: number;
    resolvedConflicts: number;
    unresolvedConflicts: number;
    conflictsByTable: { [table: string]: number };
    conflictsByType: { [type: string]: number };
  } {
    const totalConflicts = this.conflicts.length;
    const resolvedConflicts = this.conflicts.filter(c => c.resolved).length;
    const unresolvedConflicts = totalConflicts - resolvedConflicts;

    const conflictsByTable: { [table: string]: number } = {};
    const conflictsByType: { [type: string]: number } = {};

    for (const conflict of this.conflicts) {
      conflictsByTable[conflict.table] = (conflictsByTable[conflict.table] || 0) + 1;
      conflictsByType[conflict.conflictType] = (conflictsByType[conflict.conflictType] || 0) + 1;
    }

    return {
      totalConflicts,
      resolvedConflicts,
      unresolvedConflicts,
      conflictsByTable,
      conflictsByType
    };
  }
}

export const conflictResolver = new ConflictResolver();
