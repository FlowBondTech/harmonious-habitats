import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  bio: string | null;
  expertise: string[] | null;
  is_admin: boolean | null;
  invite_code_used: string | null;
  profile_setup_completed: boolean;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, inviteCode: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  validateInviteCode: (code: string) => Promise<{ valid: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Helper function to clear all authentication data
  const clearAuthData = async () => {
    console.log('Clearing all authentication data...');
    
    // Clear Supabase session
    await supabase.auth.signOut();
    
    // Explicitly clear localStorage items that Supabase might use
    const keysToRemove = [
      'supabase.auth.token',
      'sb-nvcmlxemxqxwaunqnyhx-auth-token', // Replace with your actual project ref
      'sb-auth-token'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key} from localStorage:`, error);
      }
    });
    
    // Also try to clear any keys that start with 'sb-' (Supabase pattern)
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Failed to clear Supabase localStorage keys:', error);
    }
    
    // Clear state
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        
        // Add timeout protection
        const timeoutId = setTimeout(() => {
          if (mounted && !initialized) {
            console.warn('Auth initialization timed out, setting loading to false');
            setLoading(false);
            setInitialized(true);
          }
        }, 10000); // 10 second timeout

        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          
          // Check if it's a refresh token error and clear all auth data if so
          if (sessionError.message?.includes('Refresh Token Not Found') || 
              sessionError.message?.includes('invalid_grant') ||
              sessionError.message?.includes('Invalid Refresh Token')) {
            console.log('Invalid refresh token detected, clearing all authentication data...');
            await clearAuthData();
          }
          
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          clearTimeout(timeoutId);
          return;
        }

        console.log('Session retrieved:', session ? 'Found session' : 'No session');

        if (session?.user && mounted) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else if (mounted) {
          // Defensively clear any stale tokens when no valid session is found
          await clearAuthData();
          setLoading(false);
        }

        setInitialized(true);
        clearTimeout(timeoutId);
      } catch (error) {
        console.error('Auth initialization error:', error);
        
        // If there's any error during initialization, clear auth data
        if (mounted) {
          await clearAuthData();
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'with session' : 'no session');
      
      if (!mounted) return;

      try {
        if (event === 'TOKEN_REFRESHED' && !session) {
          // Token refresh failed, clear everything
          console.log('Token refresh failed, clearing authentication data');
          await clearAuthData();
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        
        // On any error during auth state change, clear auth data
        await clearAuthData();
        setLoading(false);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('[fetchProfile]', { userId });
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('[fetchProfile result]', { data, error });

      if (error) {
        console.error('Error fetching profile:', error);
        
        // FIXED: Don't force logout on profile fetch errors
        // Instead, just set profile to null and continue with authenticated state
        setProfile(null);
        setLoading(false);
        return;
      }
      
      if (data) {
        console.log('Profile fetched successfully');
        setProfile(data);
      } else {
        console.log('No profile found for user');
        setProfile(null);
      }
    } catch (error) {
      console.error('Profile fetch exception:', error);
      
      // FIXED: Don't force logout on exceptions
      // Just set profile to null and continue
      setProfile(null);
    } finally {
      // CRITICAL: Always set loading to false regardless of success or failure
      setLoading(false);
    }
  };

  const validateInviteCode = async (code: string): Promise<{ valid: boolean; error?: string }> => {
    try {
      console.log('Validating invite code:', code);
      
      const { data, error } = await supabase
        .from('invite_codes')
        .select('id, is_used, expires_at')
        .eq('code', code.toUpperCase())
        .eq('is_used', false)
        .maybeSingle();

      if (error) {
        console.error('Invite code validation error:', error);
        return { valid: false, error: 'Error validating invite code' };
      }

      if (!data) {
        return { valid: false, error: 'Invalid invite code' };
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { valid: false, error: 'Invite code has expired' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Invite code validation exception:', error);
      return { valid: false, error: 'Error validating invite code' };
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    inviteCode: string, 
    fullName: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Starting sign up process...');
      
      // First validate the invite code
      const codeValidation = await validateInviteCode(inviteCode);
      if (!codeValidation.valid) {
        return { success: false, error: codeValidation.error };
      }

      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error('Auth sign up error:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      console.log('User account created, using invite code...');

      // Use the invite code
      const { data: useCodeData, error: useCodeError } = await supabase.rpc('use_invite_code', {
        invite_code: inviteCode.toUpperCase(),
        user_id: authData.user.id
      });

      if (useCodeError || !useCodeData) {
        console.error('Invite code usage error:', useCodeError);
        // If invite code usage fails, we should clean up the auth user
        await supabase.auth.signOut();
        return { success: false, error: 'Failed to use invite code' };
      }

      // Get the invite code ID for the profile
      const { data: inviteData } = await supabase
        .from('invite_codes')
        .select('id')
        .eq('code', inviteCode.toUpperCase())
        .maybeSingle();

      console.log('Creating user profile...');

      // Create the user profile with setup completed as true by default
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          invite_code_used: inviteData?.id || null,
          profile_setup_completed: true // Set to true by default since we removed initial setup
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return { success: false, error: 'Failed to create user profile' };
      }

      console.log('Sign up completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Sign up exception:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Signing in user...');
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
      }

      console.log('Sign in successful');
      return { success: true };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Signing out...');
      
      // Use our helper function to clear all auth data
      await clearAuthData();
      
      console.log('Successfully signed out');
      return { success: true };
    } catch (error) {
      console.error('Sign out exception:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      console.log('Updating profile...');
      
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        return { success: false, error: error.message };
      }

      // Immediately update the local profile state instead of refetching
      if (profile) {
        const updatedProfile = { ...profile, ...updates };
        setProfile(updatedProfile);
        console.log('Profile updated successfully in local state');
      }

      return { success: true };
    } catch (error) {
      console.error('Profile update exception:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    validateInviteCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};