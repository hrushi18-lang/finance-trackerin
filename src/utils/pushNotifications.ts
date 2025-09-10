/**
 * Push Notifications Service
 * Handles push notifications for mobile and web
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';

interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  sound?: string;
  click_action?: string;
}

interface NotificationPermission {
  granted: boolean;
  canRequest: boolean;
  denied: boolean;
}

class PushNotificationService {
  private isInitialized = false;
  private registrationToken: string | null = null;
  private notificationHandlers: Map<string, (data: any) => void> = new Map();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize push notifications
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if running on native platform
      if (Capacitor.isNativePlatform()) {
        await this.initializeNative();
      } else {
        await this.initializeWeb();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  /**
   * Initialize for native platforms
   */
  private async initializeNative(): Promise<void> {
    // Request permissions
    const permission = await this.requestPermissions();
    if (!permission.granted) {
      console.warn('Push notification permissions not granted');
      return;
    }

    // Register for push notifications
    await PushNotifications.register();

    // Listen for registration
    PushNotifications.addListener('registration', (token) => {
      this.registrationToken = token.value;
      console.log('Push registration success, token: ' + token.value);
      this.saveToken(token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Listen for push notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      this.handleNotification(notification);
    });

    // Listen for notification actions
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed:', notification);
      this.handleNotificationAction(notification);
    });
  }

  /**
   * Initialize for web platform
   */
  private async initializeWeb(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported in this browser');
      return;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      // Get subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY || '')
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
    } catch (error) {
      console.error('Failed to initialize web push notifications:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<NotificationPermission> {
    if (Capacitor.isNativePlatform()) {
      const result = await PushNotifications.requestPermissions();
      return {
        granted: result.receive === 'granted',
        canRequest: true,
        denied: result.receive === 'denied'
      };
    } else {
      if (!('Notification' in window)) {
        return { granted: false, canRequest: false, denied: false };
      }

      const permission = await Notification.requestPermission();
      return {
        granted: permission === 'granted',
        canRequest: permission === 'default',
        denied: permission === 'denied'
      };
    }
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    if (Capacitor.isNativePlatform()) {
      return true;
    }
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Check if notifications are enabled
   */
  async isEnabled(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      const result = await PushNotifications.checkPermissions();
      return result.receive === 'granted';
    } else {
      return Notification.permission === 'granted';
    }
  }

  /**
   * Get registration token
   */
  getRegistrationToken(): string | null {
    return this.registrationToken;
  }

  /**
   * Save token to preferences
   */
  private async saveToken(token: string): Promise<void> {
    try {
      await Preferences.set({
        key: 'push_notification_token',
        value: token
      });
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  }

  /**
   * Get saved token
   */
  async getSavedToken(): Promise<string | null> {
    try {
      const result = await Preferences.get({ key: 'push_notification_token' });
      return result.value;
    } catch (error) {
      console.error('Failed to get saved push token:', error);
      return null;
    }
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          platform: Capacitor.getPlatform()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(notification: NotificationData): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [{
          title: notification.title,
          body: notification.body,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) },
          sound: notification.sound || 'default',
          attachments: notification.icon ? [{ id: 'icon', url: notification.icon }] : undefined,
          actionTypeId: notification.click_action || 'default',
          extra: notification.data
        }]
      });
    } else {
      // Web notifications
      if (Notification.permission === 'granted') {
        const webNotification = new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icon-192x192.png',
          badge: notification.badge || '/badge-72x72.png',
          data: notification.data,
          tag: notification.click_action
        });

        webNotification.onclick = () => {
          this.handleNotificationClick(notification.data);
          webNotification.close();
        };
      }
    }
  }

  /**
   * Schedule notification
   */
  async scheduleNotification(notification: NotificationData, scheduleAt: Date): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [{
          title: notification.title,
          body: notification.body,
          id: Date.now(),
          schedule: { at: scheduleAt },
          sound: notification.sound || 'default',
          attachments: notification.icon ? [{ id: 'icon', url: notification.icon }] : undefined,
          actionTypeId: notification.click_action || 'default',
          extra: notification.data
        }]
      });
    } else {
      // For web, we can't schedule notifications far in advance
      // This would need to be handled by a service worker
      console.warn('Scheduled notifications not fully supported on web');
    }
  }

  /**
   * Cancel notification
   */
  async cancelNotification(notificationId: number): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    } else {
      console.warn('Cancel notification not supported on web');
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.cancelAll();
    } else {
      console.warn('Cancel all notifications not supported on web');
    }
  }

  /**
   * Handle notification received
   */
  private handleNotification(notification: any): void {
    const data = notification.data || {};
    const handler = this.notificationHandlers.get(data.type || 'default');
    
    if (handler) {
      handler(data);
    }
  }

  /**
   * Handle notification action
   */
  private handleNotificationAction(notification: any): void {
    const data = notification.notification.data || {};
    const action = notification.actionId || 'default';
    
    // Handle different actions
    switch (action) {
      case 'view_transaction':
        // Navigate to transaction
        window.location.href = `/transactions/${data.transaction_id}`;
        break;
      case 'view_goal':
        // Navigate to goal
        window.location.href = `/goals/${data.goal_id}`;
        break;
      case 'view_bill':
        // Navigate to bill
        window.location.href = `/bills/${data.bill_id}`;
        break;
      default:
        // Default action - just close notification
        break;
    }
  }

  /**
   * Handle notification click
   */
  private handleNotificationClick(data: any): void {
    if (data.url) {
      window.location.href = data.url;
    }
  }

  /**
   * Register notification handler
   */
  registerHandler(type: string, handler: (data: any) => void): void {
    this.notificationHandlers.set(type, handler);
  }

  /**
   * Unregister notification handler
   */
  unregisterHandler(type: string): void {
    this.notificationHandlers.delete(type);
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<void> {
    await this.sendLocalNotification({
      title: 'FinTrack Test',
      body: 'This is a test notification from FinTrack',
      data: { type: 'test' }
    });
  }
}

// Create singleton instance
export const pushNotificationService = new PushNotificationService();

// Export convenience functions
export const requestPermissions = () => pushNotificationService.requestPermissions();
export const isSupported = () => pushNotificationService.isSupported();
export const isEnabled = () => pushNotificationService.isEnabled();
export const getRegistrationToken = () => pushNotificationService.getRegistrationToken();
export const sendLocalNotification = (notification: NotificationData) => pushNotificationService.sendLocalNotification(notification);
export const scheduleNotification = (notification: NotificationData, scheduleAt: Date) => pushNotificationService.scheduleNotification(notification, scheduleAt);
export const cancelNotification = (notificationId: number) => pushNotificationService.cancelNotification(notificationId);
export const cancelAllNotifications = () => pushNotificationService.cancelAllNotifications();
export const registerHandler = (type: string, handler: (data: any) => void) => pushNotificationService.registerHandler(type, handler);
export const unregisterHandler = (type: string) => pushNotificationService.unregisterHandler(type);
export const sendTestNotification = () => pushNotificationService.sendTestNotification();

export default pushNotificationService;
