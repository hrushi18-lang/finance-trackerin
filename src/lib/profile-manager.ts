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
    try {
      // Map to database column names
      const dbProfile = {
        user_id: userId,
        email: profileData.email || '',
        name: profileData.name,
        avatar: profileData.avatar || '',
        age: profileData.age,
        country: profileData.country,
        profession: profileData.profession,
        monthly_income: profileData.monthlyIncome,
        primary_currency: profileData.primaryCurrency,
        display_currency: profileData.displayCurrency,
        auto_convert: profileData.autoConvert,
        show_original_amounts: profileData.showOriginalAmounts,
      };

      // Save to Supabase
      const { data, error } = await supabase
        .from('profiles')
        .insert(dbProfile)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Map back to our interface
      const profile: UserProfile = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        age: data.age,
        country: data.country,
        profession: data.profession,
        monthlyIncome: data.monthly_income,
        primaryCurrency: data.primary_currency,
        displayCurrency: data.display_currency,
        autoConvert: data.auto_convert,
        showOriginalAmounts: data.show_original_amounts,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      // Save to offline storage
      await offlineStorage.create('profiles', profile);

      return profile;
    } catch (error) {
      console.error('Failed to create user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(profileId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      // Map updates to database column names
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
      if (updates.age !== undefined) dbUpdates.age = updates.age;
      if (updates.country !== undefined) dbUpdates.country = updates.country;
      if (updates.profession !== undefined) dbUpdates.profession = updates.profession;
      if (updates.monthlyIncome !== undefined) dbUpdates.monthly_income = updates.monthlyIncome;
      if (updates.primaryCurrency !== undefined) dbUpdates.primary_currency = updates.primaryCurrency;
      if (updates.displayCurrency !== undefined) dbUpdates.display_currency = updates.displayCurrency;
      if (updates.autoConvert !== undefined) dbUpdates.auto_convert = updates.autoConvert;
      if (updates.showOriginalAmounts !== undefined) dbUpdates.show_original_amounts = updates.showOriginalAmounts;

      // Update in Supabase
      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', profileId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Map back to our interface
      const profile: UserProfile = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        age: data.age,
        country: data.country,
        profession: data.profession,
        monthlyIncome: data.monthly_income,
        primaryCurrency: data.primary_currency,
        displayCurrency: data.display_currency,
        autoConvert: data.auto_convert,
        showOriginalAmounts: data.show_original_amounts,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      // Update in offline storage
      await offlineStorage.update('profiles', profileId, profile);

      return profile;
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
        .eq('user_id', userId)
        .single();

      if (error) {
        return null;
      }

      // Map database response to our interface
      const profile: UserProfile = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        age: data.age,
        country: data.country,
        profession: data.profession,
        monthlyIncome: data.monthly_income,
        primaryCurrency: data.primary_currency,
        displayCurrency: data.display_currency,
        autoConvert: data.auto_convert,
        showOriginalAmounts: data.show_original_amounts,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return profile;
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
