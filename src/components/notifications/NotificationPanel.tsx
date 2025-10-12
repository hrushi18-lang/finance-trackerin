/**
 * NotificationPanel Component
 * Displays all notifications for bills and budgets
 */

import React, { useState } from 'react';
import { Bell, X, Check, AlertCircle, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationRecord } from '../../services/notificationService';
import { Button } from '../common/Button';

export const NotificationPanel: React.FC = () => {
  const {
    allNotifications,
    billNotifications,
    budgetNotifications,
    clearNotifications,
    clearAllNotifications,
    notificationStats,
    hasUnreadNotifications,
    unreadCount
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'bills' | 'budgets'>('all');

  const getFilteredNotifications = (): NotificationRecord[] => {
    switch (filter) {
      case 'bills':
        return billNotifications;
      case 'budgets':
        return budgetNotifications;
      default:
        return allNotifications;
    }
  };

  const getNotificationIcon = (type: NotificationRecord['type']) => {
    switch (type) {
      case 'bill_reminder':
        return <Calendar size={20} className="text-blue-400" />;
      case 'bill_overdue':
        return <AlertCircle size={20} className="text-red-400" />;
      case 'budget_alert':
        return <TrendingUp size={20} className="text-yellow-400" />;
      case 'budget_exceeded':
        return <DollarSign size={20} className="text-red-400" />;
    }
  };

  const getNotificationColor = (type: NotificationRecord['type']) => {
    switch (type) {
      case 'bill_reminder':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'bill_overdue':
        return 'border-red-500/30 bg-red-500/10';
      case 'budget_alert':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'budget_exceeded':
        return 'border-red-500/30 bg-red-500/10';
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={24} className="text-white" />
        {hasUnreadNotifications && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-12 z-50 w-96 max-h-[600px] rounded-xl border border-white/20 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Bell size={20} className="mr-2 text-blue-400" />
                  Notifications
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  All ({allNotifications.length})
                </button>
                <button
                  onClick={() => setFilter('bills')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'bills'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  Bills ({billNotifications.length})
                </button>
                <button
                  onClick={() => setFilter('budgets')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'budgets'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  Budgets ({budgetNotifications.length})
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[400px]">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={48} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400 text-sm">No notifications</p>
                  <p className="text-gray-500 text-xs mt-1">
                    You're all caught up! 🎉
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${getNotificationColor(notification.type)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTimeAgo(notification.sentAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => clearNotifications(notification.entityId)}
                          className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                          aria-label="Dismiss"
                        >
                          <X size={16} className="text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="p-3 border-t border-white/10">
                <Button
                  onClick={clearAllNotifications}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 text-sm"
                >
                  <Check size={16} className="mr-2" />
                  Clear All Notifications
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="p-3 border-t border-white/10 bg-black/20">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center p-2 rounded bg-white/5">
                  <p className="text-gray-400">Bill Reminders</p>
                  <p className="text-white font-semibold">{notificationStats.billReminders}</p>
                </div>
                <div className="text-center p-2 rounded bg-white/5">
                  <p className="text-gray-400">Budget Alerts</p>
                  <p className="text-white font-semibold">{notificationStats.budgetAlerts}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

