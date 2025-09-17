import React, { useState } from 'react';
import { X, Bell, Eye, EyeOff, Trash2, CheckCircle } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Notification, FinancialInsight } from '../../contexts/NotificationContext';

const NotificationCenter: React.FC = () => {
  const { 
    notifications, 
    insights, 
    markAsRead, 
    markAllAsRead, 
    clearAllNotifications,
    removeNotification,
    removeInsight 
  } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<'notifications' | 'insights'>('notifications');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => !n.read && (n.priority === 'high' || n.priority === 'urgent')).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ff4757';
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffa502';
      case 'low': return '#2ed573';
      default: return '#57606f';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'error': return '❌';
      case 'tip': return '💡';
      case 'achievement': return '🏆';
      case 'alert': return '🚨';
      default: return '📢';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="notification-center relative">
      {/* Notification Bell */}
      <button
        onClick={() => {
          if (isMinimized) {
            setIsMinimized(false);
            setIsOpen(true);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="mobile-touch-target p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell size={24} className="text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 rounded-full text-white text-xs font-bold flex items-center justify-center min-w-[20px] h-5 px-1 ${
              highPriorityCount > 0 ? 'bg-red-500' : 'bg-orange-500'
            }`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Minimized State */}
      {isMinimized && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => {
              setIsMinimized(false);
              setIsOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
            aria-label="Restore notifications"
          >
            <Bell size={20} />
          </button>
        </div>
      )}

      {/* Notification Panel */}
      {isOpen && !isMinimized && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="fixed top-4 right-4 z-50 w-full max-w-sm sm:max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mobile-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'insights'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>Insights</span>
                    {insights.length > 0 && (
                      <span className="bg-gray-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                        {insights.length}
                      </span>
                    )}
                  </div>
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                {activeTab === 'notifications' && unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    aria-label="Mark all as read"
                  >
                    <CheckCircle size={18} />
                  </button>
                )}
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  aria-label="Minimize notifications"
                >
                  <EyeOff size={18} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close notifications"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto scrollbar-hide">
              {activeTab === 'notifications' ? (
                <div>
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <Bell size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-lg font-medium mb-2">No notifications yet</p>
                      <p className="text-sm">We'll notify you about important updates</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 text-2xl">
                              {notification.icon || getTypeIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {notification.title}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: getPriorityColor(notification.priority) }}
                                  />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatTimeAgo(notification.timestamp)}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {notification.message}
                              </p>
                              {notification.actionText && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    notification.actionCallback?.();
                                  }}
                                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  {notification.actionText}
                                </button>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              aria-label="Remove notification"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {insights.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-4">📊</div>
                      <p className="text-lg font-medium mb-2">No insights yet</p>
                      <p className="text-sm">We'll analyze your data and provide insights</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {insights.map((insight) => (
                        <div
                          key={insight.id}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 text-2xl">
                              {insight.type === 'spending_analysis' && '📊'}
                              {insight.type === 'saving_trend' && '📈'}
                              {insight.type === 'budget_health' && '💰'}
                              {insight.type === 'goal_progress' && '🎯'}
                              {insight.type === 'risk_alert' && '⚠️'}
                              {insight.type === 'opportunity' && '💡'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                {insight.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                                {insight.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  {insight.category}
                                </span>
                                <button
                                  onClick={() => removeInsight(insight.id)}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  aria-label="Remove insight"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
