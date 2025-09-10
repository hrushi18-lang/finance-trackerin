/**
 * Authentication Manager
 * Handles user authentication and profile management
 */

import { supabase } from './supabase';
import { Database } from '../types/supabase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

class AuthManager {
  private authState: AuthState = {
    user: null,
    loading: true,
    error: null
  };

  private listeners: ((state: AuthState) => void)[] = [];

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Check for existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.updateAuthState({ error: error.message });
        return;
      }

      if (session?.user) {
        await this.loadUserProfile(session.user.id);
      } else {
        this.updateAuthState({ loading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await this.loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          this.updateAuthState({ user: null, loading: false, error: null });
        }
      });
    } catch (error) {
      this.updateAuthState({ 
        error: error instanceof Error ? error.message : 'Authentication failed',
        loading: false 
      });
    }
  }

  private async loadUserProfile(userId: string) {
    try {
      // Get profile from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      let profile;
      if (error) {
        // If profile doesn't exist, create it
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user) {
          profile = await this.createUserProfile(authUser.user);
        }
      } else {
        profile = data;
        // Save to local storage
      }

      this.updateAuthState({ 
        user: profile, 
        loading: false, 
        error: null 
      });
    } catch (error) {
      this.updateAuthState({ 
        error: error instanceof Error ? error.message : 'Failed to load profile',
        loading: false 
      });
    }
  }

  private async createUserProfile(authUser: any): Promise<UserProfile> {
    const profile = {
      id: authUser.id,
      user_id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
      avatar_url: authUser.user_metadata?.avatar_url || null,
      monthly_income: 0,
      primary_currency: 'USD',
      display_currency: 'USD',
      auto_convert: true,
      show_original_amounts: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      // Try to create in Supabase first
      const { error } = await supabase
        .from('profiles')
        .insert(profile);

      if (error) {
        // If profile already exists (409), try to update it instead
        if (error.code === '23505' || error.message.includes('duplicate key')) {
          console.log('Profile already exists, updating instead...');
          const { error: updateError } = await supabase
            .from('profiles')
            .update(profile)
            .eq('id', profile.id);
          
          if (updateError) {
            console.warn('Failed to update profile in Supabase:', updateError);
          }
        } else {
          console.warn('Failed to create profile in Supabase:', error);
        }
      }
    } catch (error) {
      console.warn('Error creating profile in Supabase:', error);
    }

    return profile;
  }

  private updateAuthState(updates: Partial<AuthState>) {
    this.authState = { ...this.authState, ...updates };
    this.listeners.forEach(listener => listener(this.authState));
  }

  // Public methods
  async signUp(email: string, password: string, name?: string) {
    this.updateAuthState({ loading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || email.split('@')[0]
          }
        }
      });

      if (error) {
        this.updateAuthState({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create profile immediately for offline use
        const profile = await this.createUserProfile(data.user);
        this.updateAuthState({ 
          user: profile, 
          loading: false, 
          error: null 
        });
      }

      return { 
        success: true, 
        message: 'Please check your email to confirm your account' 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      this.updateAuthState({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  }

  async signIn(email: string, password: string) {
    this.updateAuthState({ loading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.updateAuthState({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      if (data.user) {
        await this.loadUserProfile(data.user.id);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      this.updateAuthState({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        this.updateAuthState({ error: error.message });
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      this.updateAuthState({ error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async updateProfile(updates: Partial<UserProfile>) {
    if (!this.authState.user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      const updatedProfile = {
        ...this.authState.user,
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Update in Supabase if online
      // Always update in Supabase for online-only mode
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', this.authState.user.id);

        if (error) {
          console.warn('Failed to update profile in Supabase:', error);
        }

      // Update locally
      this.updateAuthState({ user: updatedProfile });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed';
      return { success: false, error: errorMessage };
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        message: 'Password reset email sent' 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Reset failed';
      return { success: false, error: errorMessage };
    }
  }

  async signInWithGoogle() {
    this.updateAuthState({ loading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        this.updateAuthState({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      // The OAuth flow will redirect, so we don't need to handle success here
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      this.updateAuthState({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  }

  async signUpWithGoogle() {
    // For Google OAuth, sign up and sign in are the same
    return this.signInWithGoogle();
  }

  // State management
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    // Call immediately with current state
    listener(this.authState);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.authState.user;
  }

  getCurrentUser(): UserProfile | null {
    return this.authState.user;
  }

  getUserId(): string | null {
    return this.authState.user?.id || null;
  }
}

// Export singleton instance
export const authManager = new AuthManager();
export default authManager;
