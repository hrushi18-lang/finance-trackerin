/**
 * useNotifications Hook
 * React hook for managing notifications in the app
 */

import { useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationRecord } from '../services/notificationService';
import { useFinance } from '../contexts/FinanceContext';

export interface UseNotificationsResult {
  // Notification lists
  billNotifications: NotificationRecord[];
  budgetNotifications: NotificationRecord[];
  allNotifications: NotificationRecord[];
  
  // Actions
  checkNotifications: () => void;
  clearNotifications: (entityId: string) => void;
  clearAllNotifications: () => void;
  
  // Stats
  notificationStats: {
    totalNotifications: number;
    billReminders: number;
    billOverdue: number;
    budgetAlerts: number;
    budgetExceeded: number;
    last24Hours: number;
  };
  
  // Status
  hasUnreadNotifications: boolean;
  unreadCount: number;
}

export function useNotifications(): UseNotificationsResult {
  const { bills, budgets } = useFinance();
  const [billNotifications, setBillNotifications] = useState<NotificationRecord[]>([]);
  const [budgetNotifications, setBudgetNotifications] = useState<NotificationRecord[]>([]);
  const [notificationStats, setNotificationStats] = useState(notificationService.getNotificationStats());

  /**
   * Check for new notifications
   */
  const checkNotifications = useCallback(() => {
    if (!bills || !budgets) return;

    const { billNotifications: newBillNotifications, budgetNotifications: newBudgetNotifications } = 
      notificationService.checkAllNotifications(bills, budgets);

    // Update state if there are new notifications
    if (newBillNotifications.length > 0 || newBudgetNotifications.length > 0) {
      setBillNotifications(prev => [...prev, ...newBillNotifications]);
      setBudgetNotifications(prev => [...prev, ...newBudgetNotifications]);
      setNotificationStats(notificationService.getNotificationStats());

      // Show browser notifications if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        newBillNotifications.forEach(notification => {
          new Notification('Bill Reminder', {
            body: notification.message,
            icon: '/favicon.svg',
            tag: notification.id
          });
        });

        newBudgetNotifications.forEach(notification => {
          new Notification('Budget Alert', {
            body: notification.message,
            icon: '/favicon.svg',
            tag: notification.id
          });
        });
      }
    }
  }, [bills, budgets]);

  /**
   * Clear notifications for a specific entity
   */
  const clearNotifications = useCallback((entityId: string) => {
    notificationService.clearNotifications(entityId);
    
    // Update state
    setBillNotifications(prev => prev.filter(n => n.entityId !== entityId));
    setBudgetNotifications(prev => prev.filter(n => n.entityId !== entityId));
    setNotificationStats(notificationService.getNotificationStats());
  }, []);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(() => {
    notificationService.resetAllNotifications();
    setBillNotifications([]);
    setBudgetNotifications([]);
    setNotificationStats({
      totalNotifications: 0,
      billReminders: 0,
      billOverdue: 0,
      budgetAlerts: 0,
      budgetExceeded: 0,
      last24Hours: 0
    });
  }, []);

  /**
   * Load existing notifications on mount
   */
  useEffect(() => {
    const allNotifications = notificationService.getAllRecentNotifications(100);
    const bills = allNotifications.filter(n => n.entityType === 'bill');
    const budgets = allNotifications.filter(n => n.entityType === 'budget');
    
    setBillNotifications(bills);
    setBudgetNotifications(budgets);
    setNotificationStats(notificationService.getNotificationStats());
  }, []);

  /**
   * Check notifications periodically
   */
  useEffect(() => {
    // Check immediately
    checkNotifications();

    // Check every 5 minutes
    const interval = setInterval(() => {
      checkNotifications();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkNotifications]);

  /**
   * Request notification permission
   */
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Combine all notifications
  const allNotifications = [...billNotifications, ...budgetNotifications]
    .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());

  // Calculate unread count (notifications from last 24 hours)
  const now = Date.now();
  const unreadCount = allNotifications.filter(
    n => now - n.sentAt.getTime() < 24 * 60 * 60 * 1000
  ).length;

  return {
    billNotifications,
    budgetNotifications,
    allNotifications,
    checkNotifications,
    clearNotifications,
    clearAllNotifications,
    notificationStats,
    hasUnreadNotifications: unreadCount > 0,
    unreadCount
  };
}

