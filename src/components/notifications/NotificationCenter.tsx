import React, { useState } from 'react';
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
    <div className="notification-center">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="notification-bell"
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '50%',
          transition: 'background-color 0.2s'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: highPriorityCount > 0 ? '#ff4757' : '#ffa502',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '60px',
            right: '0',
            width: '400px',
            maxHeight: '500px',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setActiveTab('notifications')}
                style={{
                  background: activeTab === 'notifications' ? '#007bff' : 'transparent',
                  color: activeTab === 'notifications' ? 'white' : '#666',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Notifications ({unreadCount})
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                style={{
                  background: activeTab === 'insights' ? '#007bff' : 'transparent',
                  color: activeTab === 'insights' ? 'white' : '#666',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Insights ({insights.length})
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {activeTab === 'notifications' && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {activeTab === 'notifications' ? (
              <div>
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: '#666'
                    }}
                  >
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        background: notification.read ? 'white' : '#f8f9ff',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ fontSize: '20px' }}>
                          {notification.icon || getTypeIcon(notification.type)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '4px'
                            }}
                          >
                            <h4
                              style={{
                                margin: 0,
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#333'
                              }}
                            >
                              {notification.title}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: getPriorityColor(notification.priority)
                                }}
                              />
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: '#666'
                                }}
                              >
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                            </div>
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '13px',
                              color: '#666',
                              lineHeight: '1.4'
                            }}
                          >
                            {notification.message}
                          </p>
                          {notification.actionText && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                notification.actionCallback?.();
                              }}
                              style={{
                                marginTop: '8px',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
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
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#999',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '4px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div>
                {insights.length === 0 ? (
                  <div
                    style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: '#666'
                    }}
                  >
                    No insights yet
                  </div>
                ) : (
                  insights.map((insight) => (
                    <div
                      key={insight.id}
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid #f0f0f0'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ fontSize: '20px' }}>
                          {insight.type === 'spending_analysis' && '📊'}
                          {insight.type === 'saving_trend' && '📈'}
                          {insight.type === 'budget_health' && '💰'}
                          {insight.type === 'goal_progress' && '🎯'}
                          {insight.type === 'risk_alert' && '⚠️'}
                          {insight.type === 'opportunity' && '💡'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4
                            style={{
                              margin: '0 0 4px 0',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#333'
                            }}
                          >
                            {insight.title}
                          </h4>
                          <p
                            style={{
                              margin: '0 0 8px 0',
                              fontSize: '13px',
                              color: '#666',
                              lineHeight: '1.4'
                            }}
                          >
                            {insight.description}
                          </p>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#999',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}
                            >
                              {insight.category}
                            </span>
                            <button
                              onClick={() => removeInsight(insight.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#999',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '4px'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
