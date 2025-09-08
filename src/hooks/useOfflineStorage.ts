import { useState, useEffect, useCallback } from 'react';

interface OfflineData {
  userProfile?: any;
  customCategories?: any[];
  basicActivities?: any[];
  accounts?: any[];
  currentStep?: number;
  completedSteps?: string[];
}

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData>({});

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('onboarding-data');
    if (savedData) {
      try {
        setOfflineData(JSON.parse(savedData));
      } catch (error) {
        console.error('Failed to load offline data:', error);
      }
    }
  }, []);

  // Save data to localStorage
  const saveOfflineData = useCallback((data: Partial<OfflineData>) => {
    const newData = { ...offlineData, ...data };
    setOfflineData(newData);
    localStorage.setItem('onboarding-data', JSON.stringify(newData));
  }, [offlineData]);

  // Clear offline data
  const clearOfflineData = useCallback(() => {
    setOfflineData({});
    localStorage.removeItem('onboarding-data');
  }, []);

  // Sync data when online
  const syncData = useCallback(async () => {
    if (!isOnline || Object.keys(offlineData).length === 0) return;

    try {
      // Here you would sync with your backend
      console.log('Syncing offline data:', offlineData);
      // await syncWithBackend(offlineData);
      clearOfflineData();
    } catch (error) {
      console.error('Failed to sync data:', error);
    }
  }, [isOnline, offlineData, clearOfflineData]);

  return {
    isOnline,
    offlineData,
    saveOfflineData,
    clearOfflineData,
    syncData
  };
};
