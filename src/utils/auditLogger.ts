/**
 * Audit Logging System
 * Comprehensive logging for financial transactions and user actions
 */

import { supabase } from '../lib/supabase';

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'transaction' | 'account' | 'goal' | 'liability' | 'bill' | 'user' | 'system' | 'security';
}

export interface AuditLogQuery {
  user_id?: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  category?: string;
  severity?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

class AuditLogger {
  private isEnabled = true;
  private batchSize = 50;
  private logQueue: AuditLogEntry[] = [];
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startFlushTimer();
  }

  /**
   * Enable or disable audit logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Log a financial transaction
   */
  async logTransaction(
    userId: string,
    action: 'create' | 'update' | 'delete' | 'view',
    transactionId: string,
    oldValues?: any,
    newValues?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      resource_type: 'transaction',
      resource_id: transactionId,
      old_values: oldValues,
      new_values: newValues,
      metadata,
      timestamp: new Date(),
      severity: this.getSeverityForAction(action),
      category: 'transaction'
    });
  }

  /**
   * Log an account action
   */
  async logAccount(
    userId: string,
    action: 'create' | 'update' | 'delete' | 'view',
    accountId: string,
    oldValues?: any,
    newValues?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      resource_type: 'account',
      resource_id: accountId,
      old_values: oldValues,
      new_values: newValues,
      metadata,
      timestamp: new Date(),
      severity: this.getSeverityForAction(action),
      category: 'account'
    });
  }

  /**
   * Log a goal action
   */
  async logGoal(
    userId: string,
    action: 'create' | 'update' | 'delete' | 'view' | 'contribute' | 'withdraw',
    goalId: string,
    oldValues?: any,
    newValues?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      resource_type: 'goal',
      resource_id: goalId,
      old_values: oldValues,
      new_values: newValues,
      metadata,
      timestamp: new Date(),
      severity: this.getSeverityForAction(action),
      category: 'goal'
    });
  }

  /**
   * Log a liability action
   */
  async logLiability(
    userId: string,
    action: 'create' | 'update' | 'delete' | 'view' | 'pay',
    liabilityId: string,
    oldValues?: any,
    newValues?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      resource_type: 'liability',
      resource_id: liabilityId,
      old_values: oldValues,
      new_values: newValues,
      metadata,
      timestamp: new Date(),
      severity: this.getSeverityForAction(action),
      category: 'liability'
    });
  }

  /**
   * Log a bill action
   */
  async logBill(
    userId: string,
    action: 'create' | 'update' | 'delete' | 'view' | 'pay',
    billId: string,
    oldValues?: any,
    newValues?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      resource_type: 'bill',
      resource_id: billId,
      old_values: oldValues,
      new_values: newValues,
      metadata,
      timestamp: new Date(),
      severity: this.getSeverityForAction(action),
      category: 'bill'
    });
  }

  /**
   * Log a user action
   */
  async logUser(
    userId: string,
    action: 'login' | 'logout' | 'register' | 'update_profile' | 'change_password' | 'delete_account',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      resource_type: 'user',
      resource_id: userId,
      metadata,
      timestamp: new Date(),
      severity: this.getSeverityForAction(action),
      category: 'user'
    });
  }

  /**
   * Log a security event
   */
  async logSecurity(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
      timestamp: new Date(),
      severity: 'high',
      category: 'security'
    });
  }

  /**
   * Log a system event
   */
  async logSystem(
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      user_id: 'system',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
      timestamp: new Date(),
      severity: 'medium',
      category: 'system'
    });
  }

  /**
   * Log a custom event
   */
  async logCustom(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    oldValues?: any,
    newValues?: any,
    metadata?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    category: AuditLogEntry['category'] = 'system'
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: oldValues,
      new_values: newValues,
      metadata,
      timestamp: new Date(),
      severity,
      category
    });
  }

  /**
   * Core logging method
   */
  private async log(entry: Omit<AuditLogEntry, 'ip_address' | 'user_agent'>): Promise<void> {
    if (!this.isEnabled) return;

    const fullEntry: AuditLogEntry = {
      ...entry,
      ip_address: this.getClientIP(),
      user_agent: this.getUserAgent()
    };

    // Add to queue
    this.logQueue.push(fullEntry);

    // Flush if queue is full
    if (this.logQueue.length >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * Get client IP address
   */
  private getClientIP(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Try to get IP from various sources
    try {
      // This would be implemented based on your setup
      // For now, return null to avoid constraint violations
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user agent
   */
  private getUserAgent(): string {
    if (typeof window === 'undefined') return 'unknown';
    return navigator.userAgent;
  }

  /**
   * Get severity for action
   */
  private getSeverityForAction(action: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'view': 'low',
      'create': 'medium',
      'update': 'medium',
      'delete': 'high',
      'login': 'medium',
      'logout': 'low',
      'register': 'medium',
      'change_password': 'high',
      'delete_account': 'critical',
      'pay': 'high',
      'contribute': 'medium',
      'withdraw': 'high'
    };

    return severityMap[action] || 'medium';
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Flush queued logs
   */
  async flush(): Promise<void> {
    if (this.logQueue.length === 0) return;

    try {
      const logs = [...this.logQueue];
      this.logQueue = [];

      // Insert logs into database
      const { error } = await supabase
        .from('audit_logs')
        .insert(logs.map(log => ({
          ...log,
          timestamp: log.timestamp.toISOString()
        })));

      if (error) {
        console.error('Failed to insert audit logs:', error);
        // Re-queue logs if insertion failed
        this.logQueue.unshift(...logs);
      }
    } catch (error) {
      console.error('Error flushing audit logs:', error);
    }
  }

  /**
   * Query audit logs
   */
  async queryLogs(query: AuditLogQuery): Promise<AuditLogEntry[]> {
    try {
      let supabaseQuery = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (query.user_id) {
        supabaseQuery = supabaseQuery.eq('user_id', query.user_id);
      }

      if (query.action) {
        supabaseQuery = supabaseQuery.eq('action', query.action);
      }

      if (query.resource_type) {
        supabaseQuery = supabaseQuery.eq('resource_type', query.resource_type);
      }

      if (query.resource_id) {
        supabaseQuery = supabaseQuery.eq('resource_id', query.resource_id);
      }

      if (query.category) {
        supabaseQuery = supabaseQuery.eq('category', query.category);
      }

      if (query.severity) {
        supabaseQuery = supabaseQuery.eq('severity', query.severity);
      }

      if (query.start_date) {
        supabaseQuery = supabaseQuery.gte('timestamp', query.start_date.toISOString());
      }

      if (query.end_date) {
        supabaseQuery = supabaseQuery.lte('timestamp', query.end_date.toISOString());
      }

      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }

      if (query.offset) {
        supabaseQuery = supabaseQuery.range(query.offset, query.offset + (query.limit || 50) - 1);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('Failed to query audit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error querying audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(userId?: string, startDate?: Date, endDate?: Date): Promise<{
    total_logs: number;
    logs_by_category: Record<string, number>;
    logs_by_severity: Record<string, number>;
    logs_by_action: Record<string, number>;
  }> {
    try {
      let query = supabase.from('audit_logs').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('timestamp', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get audit log statistics:', error);
        return {
          total_logs: 0,
          logs_by_category: {},
          logs_by_severity: {},
          logs_by_action: {}
        };
      }

      const logs = data || [];
      const statistics = {
        total_logs: logs.length,
        logs_by_category: {} as Record<string, number>,
        logs_by_severity: {} as Record<string, number>,
        logs_by_action: {} as Record<string, number>
      };

      logs.forEach(log => {
        statistics.logs_by_category[log.category] = (statistics.logs_by_category[log.category] || 0) + 1;
        statistics.logs_by_severity[log.severity] = (statistics.logs_by_severity[log.severity] || 0) + 1;
        statistics.logs_by_action[log.action] = (statistics.logs_by_action[log.action] || 0) + 1;
      });

      return statistics;
    } catch (error) {
      console.error('Error getting audit log statistics:', error);
      return {
        total_logs: 0,
        logs_by_category: {},
        logs_by_severity: {},
        logs_by_action: {}
      };
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopFlushTimer();
    this.flush();
  }
}

// Create singleton instance
export const auditLogger = new AuditLogger();

// Export convenience functions
export const logTransaction = (userId: string, action: string, transactionId: string, oldValues?: any, newValues?: any, metadata?: Record<string, any>) => 
  auditLogger.logTransaction(userId, action as any, transactionId, oldValues, newValues, metadata);

export const logAccount = (userId: string, action: string, accountId: string, oldValues?: any, newValues?: any, metadata?: Record<string, any>) => 
  auditLogger.logAccount(userId, action as any, accountId, oldValues, newValues, metadata);

export const logGoal = (userId: string, action: string, goalId: string, oldValues?: any, newValues?: any, metadata?: Record<string, any>) => 
  auditLogger.logGoal(userId, action as any, goalId, oldValues, newValues, metadata);

export const logLiability = (userId: string, action: string, liabilityId: string, oldValues?: any, newValues?: any, metadata?: Record<string, any>) => 
  auditLogger.logLiability(userId, action as any, liabilityId, oldValues, newValues, metadata);

export const logBill = (userId: string, action: string, billId: string, oldValues?: any, newValues?: any, metadata?: Record<string, any>) => 
  auditLogger.logBill(userId, action as any, billId, oldValues, newValues, metadata);

export const logUser = (userId: string, action: string, metadata?: Record<string, any>) => 
  auditLogger.logUser(userId, action as any, metadata);

export const logSecurity = (userId: string, action: string, resourceType: string, resourceId?: string, metadata?: Record<string, any>) => 
  auditLogger.logSecurity(userId, action, resourceType, resourceId, metadata);

export const logSystem = (action: string, resourceType: string, resourceId?: string, metadata?: Record<string, any>) => 
  auditLogger.logSystem(action, resourceType, resourceId, metadata);

export const logCustom = (userId: string, action: string, resourceType: string, resourceId?: string, oldValues?: any, newValues?: any, metadata?: Record<string, any>, severity?: 'low' | 'medium' | 'high' | 'critical', category?: AuditLogEntry['category']) => 
  auditLogger.logCustom(userId, action, resourceType, resourceId, oldValues, newValues, metadata, severity, category);

export const queryLogs = (query: AuditLogQuery) => auditLogger.queryLogs(query);
export const getStatistics = (userId?: string, startDate?: Date, endDate?: Date) => auditLogger.getStatistics(userId, startDate, endDate);

export default auditLogger;
