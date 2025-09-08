import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
  authStatus: 'idle' | 'loading' | 'success' | 'error';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to store data in Preferences (for mobile) or localStorage (for web)
const storeData = async (key: string, value: string) => {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
};

// Helper function to get data from Preferences (for mobile) or localStorage (for web)
const getData = async (key: string): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    return value;
  } else {
    return localStorage.getItem(key);
  }
};

// Helper function to remove data from Preferences (for mobile) or localStorage (for web)
const removeData = async (key: string) => {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          setLoading(false);
          return;
        }
        
        if (session) {
          console.log('Session found:', session.user.id);
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle(); // Use maybeSingle instead of single to avoid errors if profile doesn't exist
            
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            setLoading(false);
            return;
          }
          
          if (profile) {
            console.log('Profile found:', profile);
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              avatar: profile.avatar_url,
              createdAt: new Date(profile.created_at),
            });
            
            // All users go through onboarding on every login
          } else {
            // If profile doesn't exist but user is authenticated, create profile
            try {
              console.log('Creating profile for user:', session.user.id);
              const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert([
                  {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                  }
                ])
                .select()
                .single();
                
              if (insertError) {
                console.error('Error creating profile:', insertError);
                setLoading(false);
                return;
              }
              
              if (newProfile) {
                console.log('Profile created successfully:', newProfile);
                setUser({
                  id: newProfile.id,
                  email: newProfile.email,
                  name: newProfile.name,
                  avatar: newProfile.avatar_url,
                  createdAt: new Date(newProfile.created_at),
                });
                
              }
            } catch (insertError) {
              console.error('Error creating profile:', insertError);
            }
          }
        } else {
          console.log('No session found');
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session) {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle(); // Use maybeSingle instead of single
            
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            return;
          }
          
          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              avatar: profile.avatar_url,
              createdAt: new Date(profile.created_at),
            });
            
          } else {
            // If profile doesn't exist, create it
            try {
              console.log('Creating profile for user:', session.user.id);
              const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert([
                  {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                  }
                ])
                .select()
                .single();
                
              if (insertError) {
                console.error('Error creating profile on sign in:', insertError);
                return;
              }
              
              if (newProfile) {
                console.log('Profile created successfully:', newProfile);
                setUser({
                  id: newProfile.id,
                  email: newProfile.email,
                  name: newProfile.name,
                  avatar: newProfile.avatar_url,
                  createdAt: new Date(newProfile.created_at),
                });
                
              }
            } catch (insertError) {
              console.error('Error creating profile on sign in:', insertError);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setAuthStatus('loading');
    setAuthError(null);
    try {
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        setAuthError(error.message);
        setAuthStatus('error');
        throw error;
      }

      console.log('Login successful:', data);
      setAuthStatus('success');

        // Get user profile
        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .maybeSingle(); // Use maybeSingle instead of single
          
        if (profileError) {
          console.error('Error fetching profile after login:', profileError);
          // Try to create profile if it doesn't exist
          if (profileError.code === 'PGRST116') {
            try {
              const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert([
                  {
                    id: data.user.id,
                    user_id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                    monthly_income: 0,
                    primary_currency: 'USD',
                    display_currency: 'USD',
                    auto_convert: true,
                    show_original_amounts: true,
                  }
                ])
                .select()
                .single();
                
              if (insertError) {
                console.error('Error creating profile during login:', insertError);
                throw insertError;
              }
              
              if (newProfile) {
                setUser({
                  id: newProfile.id,
                  email: newProfile.email,
                  name: newProfile.name,
                  avatar: newProfile.avatar_url,
                  createdAt: new Date(newProfile.created_at),
                });
                
                // Check onboarding status
                const hasCompletedOnboarding = await getData('onboarding_completed');
                return;
              }
            } catch (insertError) {
              console.error('Error creating profile during login:', insertError);
              throw insertError;
            }
          } else {
            throw profileError;
          }
        }
        
        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            avatar: profile.avatar_url,
            createdAt: new Date(profile.created_at),
          });
          
          // Check onboarding status
          const hasCompletedOnboarding = await getData('onboarding_completed');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Failed to login. Please try again.');
      setAuthStatus('error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setAuthStatus('loading');
    setAuthError(null);
    try {
      console.log('Registering user:', email, name);
      
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name, // Store name in user metadata
          },
        },
      });

      if (authError) {
        console.error('Auth error during registration:', authError);
        setAuthError(authError.message);
        setAuthStatus('error');
        throw authError;
      }
      
      if (!authData.user) {
        const errorMsg = 'Registration failed: No user returned';
        setAuthError(errorMsg);
        setAuthStatus('error');
        throw new Error(errorMsg);
      }

      console.log('User registered successfully:', authData.user.id);
      setAuthStatus('success');

      // Create profile
      try {
        console.log('Creating profile for new user:', authData.user.id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: email,
              name: name,
            },
          ])
          .select();
          
        if (profileError) {
          console.error('Profile creation error:', profileError);
          setAuthError('Profile creation failed: ' + profileError.message);
          setAuthStatus('error');
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
        
        console.log('Profile created successfully:', profileData);
        
        // Set user state
        if (profileData && profileData.length > 0) {
          setUser({
            id: authData.user.id,
            email,
            name,
            createdAt: new Date(),
          });
        }
      } catch (profileError: any) {
        console.error('Profile creation error:', profileError);
        setAuthError(profileError.message || 'Failed to create profile');
        setAuthStatus('error');
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      setAuthError(error.message || 'Registration failed. Please try again.');
      setAuthStatus('error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      setAuthError(error.message || 'Failed to logout');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    authError,
    clearAuthError,
    authStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
