import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { profileManager, UserProfile } from '../lib/profile-manager';
import { offlineStorage } from '../lib/offline-storage';

interface ProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: React.ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const userProfile = await profileManager.getUserProfile(userId);
      setProfile(userProfile);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile?.id) {
      throw new Error('No profile to update');
    }

    try {
      const updatedProfile = await profileManager.updateUserProfile(profile.id, updates);
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  }, [profile?.id]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  }, [user?.id, loadProfile]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadProfile(user.id);
    } else if (!isAuthenticated) {
      setProfile(null);
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, loadProfile]);

  const value = {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
