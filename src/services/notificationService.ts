/**
 * Notification Service
 * Handles all notifications for bills and budgets
 * Ensures accurate tracking and prevents duplicate notifications
 */

import { Bill, Budget } from '../types';
import { 
  isBillOverdue, 
  getDaysUntilDue, 
  needsReminder,
  getBillUrgency 
} from '../utils/billHelpers';
import {
  calculateBudgetProgress,
  getBudgetStatus,
  shouldTriggerAlert,
  isBudgetActive
} from '../utils/budgetHelpers';

export interface NotificationRecord {
  id: string;
  type: 'bill_reminder' | 'bill_overdue' | 'budget_alert' | 'budget_exceeded';
  entityId: string; // Bill ID or Budget ID
  entityType: 'bill' | 'budget';
  message: string;
  sentAt: Date;
  threshold?: number; // For budget alerts
  daysBeforeDue?: number; // For bill reminders
  amount?: number; // Amount at time of notification
  status: string; // Status at time of notification
}

class NotificationService {
  private sentNotifications: Map<string, NotificationRecord[]> = new Map();
  private readonly NOTIFICATION_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Initialize notification service with existing notifications
   */
  initialize(existingNotifications?: NotificationRecord[]) {
    if (existingNotifications) {
      existingNotifications.forEach(notification => {
        const key = this.getNotificationKey(notification.entityId, notification.type);
        const existing = this.sentNotifications.get(key) || [];
        existing.push(notification);
        this.sentNotifications.set(key, existing);
      });
    }
  }

  /**
   * Generate unique key for notification tracking
   */
  private getNotificationKey(entityId: string, type: string): string {
    return `${type}:${entityId}`;
  }

  /**
   * Check if notification was recently sent
   */
  private wasRecentlySent(
    entityId: string, 
    type: NotificationRecord['type'],
    cooldownMs: number = this.NOTIFICATION_COOLDOWN_MS
  ): boolean {
    const key = this.getNotificationKey(entityId, type);
    const notifications = this.sentNotifications.get(key) || [];
    
    if (notifications.length === 0) return false;

    const lastNotification = notifications[notifications.length - 1];
    const timeSinceLastNotification = Date.now() - lastNotification.sentAt.getTime();
    
    return timeSinceLastNotification < cooldownMs;
  }

  /**
   * Record a sent notification
   */
  private recordNotification(notification: NotificationRecord) {
    const key = this.getNotificationKey(notification.entityId, notification.type);
    const existing = this.sentNotifications.get(key) || [];
    existing.push(notification);
    this.sentNotifications.set(key, existing);

    // Persist to localStorage
    this.persistNotifications();
  }

  /**
   * Persist notifications to localStorage
   */
  private persistNotifications() {
    const allNotifications: NotificationRecord[] = [];
    this.sentNotifications.forEach(notifications => {
      allNotifications.push(...notifications);
    });

    // Keep only last 100 notifications
    const recent = allNotifications
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(0, 100);

    localStorage.setItem('finspire_notifications', JSON.stringify(recent));
  }

  /**
   * Load notifications from localStorage
   */
  loadNotifications(): NotificationRecord[] {
    try {
      const stored = localStorage.getItem('finspire_notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        // Convert date strings back to Date objects
        return notifications.map((n: any) => ({
          ...n,
          sentAt: new Date(n.sentAt)
        }));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
    return [];
  }

  /**
   * Check and generate bill notifications
   * Returns array of notifications that should be sent
   */
  checkBillNotifications(bill: Bill): NotificationRecord[] {
    const notifications: NotificationRecord[] = [];

    // Skip if bill is not active or already paid/cancelled
    if (!bill.isActive || bill.status === 'paid' || bill.status === 'cancelled') {
      return notifications;
    }

    // Check for overdue bills
    if (isBillOverdue(bill) && !this.wasRecentlySent(bill.id, 'bill_overdue')) {
      const daysOverdue = Math.abs(getDaysUntilDue(bill));
      const notification: NotificationRecord = {
        id: `${bill.id}-overdue-${Date.now()}`,
        type: 'bill_overdue',
        entityId: bill.id,
        entityType: 'bill',
        message: `⚠️ Bill "${bill.title}" is overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}!`,
        sentAt: new Date(),
        daysBeforeDue: -daysOverdue,
        amount: bill.amount,
        status: bill.status
      };
      notifications.push(notification);
      this.recordNotification(notification);
    }

    // Check for upcoming bill reminders
    if (needsReminder(bill) && !this.wasRecentlySent(bill.id, 'bill_reminder')) {
      const daysUntilDue = getDaysUntilDue(bill);
      const urgency = getBillUrgency(bill);
      
      const notification: NotificationRecord = {
        id: `${bill.id}-reminder-${Date.now()}`,
        type: 'bill_reminder',
        entityId: bill.id,
        entityType: 'bill',
        message: `${urgency.level === 'critical' ? '🔴' : '⏰'} Bill "${bill.title}" is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}. Amount: ${bill.currency || 'USD'} ${bill.amount.toFixed(2)}`,
        sentAt: new Date(),
        daysBeforeDue: daysUntilDue,
        amount: bill.amount,
        status: bill.status
      };
      notifications.push(notification);
      this.recordNotification(notification);
    }

    return notifications;
  }

  /**
   * Check and generate budget notifications
   * Returns array of notifications that should be sent
   */
  checkBudgetNotifications(budget: Budget): NotificationRecord[] {
    const notifications: NotificationRecord[] = [];

    // Skip if budget is not active or alerts are disabled
    if (!isBudgetActive(budget) || !budget.alertEnabled) {
      return notifications;
    }

    const progress = calculateBudgetProgress(budget.spent || 0, budget.amount);
    const status = getBudgetStatus(budget.spent || 0, budget.amount, budget.alertThreshold || 80);
    const threshold = budget.alertThreshold || 80;

    // Check if budget exceeded (100% or more)
    if (progress >= 100 && !this.wasRecentlySent(budget.id, 'budget_exceeded')) {
      const overspent = (budget.spent || 0) - budget.amount;
      const notification: NotificationRecord = {
        id: `${budget.id}-exceeded-${Date.now()}`,
        type: 'budget_exceeded',
        entityId: budget.id,
        entityType: 'budget',
        message: `🚨 Budget "${budget.name || budget.category}" exceeded! You've spent ${progress}% (${budget.currency || 'USD'} ${overspent.toFixed(2)} over budget)`,
        sentAt: new Date(),
        threshold: 100,
        amount: budget.spent || 0,
        status: 'exceeded'
      };
      notifications.push(notification);
      this.recordNotification(notification);
    }
    // Check if budget threshold reached
    else if (progress >= threshold && progress < 100 && !this.wasRecentlySent(budget.id, 'budget_alert')) {
      const remaining = budget.amount - (budget.spent || 0);
      const notification: NotificationRecord = {
        id: `${budget.id}-alert-${Date.now()}`,
        type: 'budget_alert',
        entityId: budget.id,
        entityType: 'budget',
        message: `⚠️ Budget "${budget.name || budget.category}" is at ${progress}%! You have ${budget.currency || 'USD'} ${remaining.toFixed(2)} remaining.`,
        sentAt: new Date(),
        threshold: threshold,
        amount: budget.spent || 0,
        status: status.status
      };
      notifications.push(notification);
      this.recordNotification(notification);
    }

    return notifications;
  }

  /**
   * Check all bills and budgets for notifications
   */
  checkAllNotifications(bills: Bill[], budgets: Budget[]): {
    billNotifications: NotificationRecord[];
    budgetNotifications: NotificationRecord[];
  } {
    const billNotifications: NotificationRecord[] = [];
    const budgetNotifications: NotificationRecord[] = [];

    // Check all bills
    bills.forEach(bill => {
      const notifications = this.checkBillNotifications(bill);
      billNotifications.push(...notifications);
    });

    // Check all budgets
    budgets.forEach(budget => {
      const notifications = this.checkBudgetNotifications(budget);
      budgetNotifications.push(...notifications);
    });

    return { billNotifications, budgetNotifications };
  }

  /**
   * Clear notifications for a specific entity (e.g., when bill is paid)
   */
  clearNotifications(entityId: string) {
    // Remove from active tracking
    const keysToRemove: string[] = [];
    this.sentNotifications.forEach((_, key) => {
      if (key.includes(entityId)) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach(key => this.sentNotifications.delete(key));
    
    this.persistNotifications();
  }

  /**
   * Get notification history for an entity
   */
  getNotificationHistory(entityId: string): NotificationRecord[] {
    const history: NotificationRecord[] = [];
    this.sentNotifications.forEach(notifications => {
      notifications.forEach(notification => {
        if (notification.entityId === entityId) {
          history.push(notification);
        }
      });
    });
    return history.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  /**
   * Get all recent notifications
   */
  getAllRecentNotifications(limit: number = 50): NotificationRecord[] {
    const allNotifications: NotificationRecord[] = [];
    this.sentNotifications.forEach(notifications => {
      allNotifications.push(...notifications);
    });
    return allNotifications
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(): {
    totalNotifications: number;
    billReminders: number;
    billOverdue: number;
    budgetAlerts: number;
    budgetExceeded: number;
    last24Hours: number;
  } {
    const allNotifications = this.getAllRecentNotifications(1000);
    const last24Hours = allNotifications.filter(
      n => Date.now() - n.sentAt.getTime() < 24 * 60 * 60 * 1000
    );

    return {
      totalNotifications: allNotifications.length,
      billReminders: allNotifications.filter(n => n.type === 'bill_reminder').length,
      billOverdue: allNotifications.filter(n => n.type === 'bill_overdue').length,
      budgetAlerts: allNotifications.filter(n => n.type === 'budget_alert').length,
      budgetExceeded: allNotifications.filter(n => n.type === 'budget_exceeded').length,
      last24Hours: last24Hours.length
    };
  }

  /**
   * Reset all notifications (use with caution)
   */
  resetAllNotifications() {
    this.sentNotifications.clear();
    localStorage.removeItem('finspire_notifications');
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Initialize on import
const storedNotifications = notificationService.loadNotifications();
notificationService.initialize(storedNotifications);

/**
 * Legacy Functions for Backward Compatibility
 * These functions maintain compatibility with existing code
 */

/**
 * Send goal progress update notification
 */
export function sendGoalProgressUpdate(goalName: string, currentAmount: number, targetAmount: number) {
  const progress = Math.round((currentAmount / targetAmount) * 100);
  console.log(`🎯 Goal Progress: "${goalName}" is ${progress}% complete (${currentAmount}/${targetAmount})`);
  
  // You can integrate this with the notification service if needed
  // For now, it just logs to console
}

/**
 * Send spending alert notification
 */
export function sendSpendingAlert(category: string, amount: number, threshold: number) {
  console.log(`⚠️ Spending Alert: You've spent ${amount} in ${category}, which exceeds the threshold of ${threshold}`);
  
  // You can integrate this with the notification service if needed
  // For now, it just logs to console
}

/**
 * Send budget warning notification
 */
export function sendBudgetWarning(category: string, spent: number, budgetAmount: number) {
  const percentage = Math.round((spent / budgetAmount) * 100);
  console.log(`⚠️ Budget Warning: "${category}" budget is at ${percentage}% (${spent}/${budgetAmount})`);
  
  // You can integrate this with the notification service if needed
  // For now, it just logs to console
  
  // Optionally show browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Budget Alert', {
      body: `Your ${category} budget is at ${percentage}%. You've spent ${spent} out of ${budgetAmount}.`,
      icon: '/favicon.svg'
    });
  }
}

/**
 * Set notification context (for NotificationContext compatibility)
 */
let notificationContextCallback: ((notification: any) => void) | null = null;

export function setNotificationContext(callback: (notification: any) => void) {
  notificationContextCallback = callback;
}

/**
 * Trigger notification through context
 */
export function triggerContextNotification(notification: any) {
  if (notificationContextCallback) {
    notificationContextCallback(notification);
  }
}
