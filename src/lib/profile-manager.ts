import { supabase } from './supabase';
import { offlineStorage } from './offline-storage';

export interface UserProfile {
  id?: string;
  userId: string;
  name: string;
  age: number;
  country: string;
  profession: string;
  monthlyIncome: number;
  primaryCurrency: string;
  displayCurrency: string;
  autoConvert: boolean;
  showOriginalAmounts: boolean;
  email?: string;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OnboardingData {
  userProfile: UserProfile;
  customCategories: CustomCategory[];
  basicActivities: BasicActivity[];
  accounts: AccountSetup[];
}

export interface CustomCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  userId: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BasicActivity {
  id: string;
  type: 'goal' | 'bill' | 'liability' | 'budget';
  name: string;
  amount: number;
  currency: string;
  description: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AccountSetup {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  isVisible: boolean;
  institution?: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class ProfileManager {
  private static instance: ProfileManager;

  public static getInstance(): ProfileManager {
    if (!ProfileManager.instance) {
      ProfileManager.instance = new ProfileManager();
    }
    return ProfileManager.instance;
  }

  async createUserProfile(profileData: Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<UserProfile> {
    const profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
      ...profileData,
      userId,
    };

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Save to offline storage
      await offlineStorage.create('profiles', data);

      return data;
    } catch (error) {
      console.error('Failed to create user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(profileId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      // Update in Supabase
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update in offline storage
      await offlineStorage.update('profiles', profileId, data);

      return data;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Try offline storage first
      const offlineProfile = await offlineStorage.getById('profiles', userId, 'userId');
      if (offlineProfile) {
        return offlineProfile;
      }

      // Fallback to Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('userId', userId)
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  async createCustomCategory(categoryData: Omit<CustomCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<CustomCategory> {
    const category: Omit<CustomCategory, 'id' | 'createdAt' | 'updatedAt'> = {
      ...categoryData,
      userId,
      isActive: true,
    };

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('user_categories')
        .insert(category)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Save to offline storage
      await offlineStorage.create('user_categories', data);

      return data;
    } catch (error) {
      console.error('Failed to create custom category:', error);
      throw error;
    }
  }

  async createAccount(accountData: Omit<AccountSetup, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<AccountSetup> {
    const account: Omit<AccountSetup, 'id' | 'createdAt' | 'updatedAt'> = {
      ...accountData,
      userId,
    };

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('financial_accounts')
        .insert(account)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Save to offline storage
      await offlineStorage.create('financial_accounts', data);

      return data;
    } catch (error) {
      console.error('Failed to create account:', error);
      throw error;
    }
  }

  async saveOnboardingData(onboardingData: OnboardingData, userId: string): Promise<void> {
    try {
      // Create user profile
      await this.createUserProfile(onboardingData.userProfile, userId);

      // Create custom categories
      for (const category of onboardingData.customCategories) {
        await this.createCustomCategory(category, userId);
      }

      // Create accounts
      for (const account of onboardingData.accounts) {
        await this.createAccount(account, userId);
      }

      // Activities will be handled by the existing FinanceContext methods
      console.log('Onboarding data saved successfully');
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      throw error;
    }
  }
}

export const profileManager = ProfileManager.getInstance();
