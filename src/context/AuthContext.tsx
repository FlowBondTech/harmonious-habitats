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
    console.log('Clearing authentication data...');
    
    // Clear Supabase session
    await supabase.auth.signOut();
    
    // Only clear our specific storage key
    try {
      localStorage.removeItem('hspaces-auth');
    } catch (error) {
      console.warn('Failed to remove auth data from localStorage:', error);
    }
    
    // Clear state
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    // Force Supabase to pick up session from localStorage
    const storedSession = localStorage.getItem('hspaces-auth');
    console.log('[Debug] Stored session from localStorage:', storedSession);
    if (storedSession) {
      try {
        const sessionObj = JSON.parse(storedSession);
        console.log('[Debug] Parsed session object:', sessionObj);
        if (sessionObj && sessionObj.currentSession) {
          console.log('[Debug] Setting session in Supabase:', sessionObj.currentSession);
          supabase.auth.setSession(sessionObj.currentSession);
        }
      } catch (e) {
        console.warn('Failed to parse stored session:', e);
      }
    } else {
      console.log('[Debug] No session found in localStorage');
    }

    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[Debug] Initializing authentication...');
        
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[Debug] Initial session retrieval:', { session, sessionError });
        
        if (sessionError) {
          console.error('[Debug] Session error:', sessionError);
          await clearAuthData();
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('[Debug] Setting user and fetching profile for user:', session.user.id);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else if (mounted) {
          console.log('[Debug] No session found, clearing auth data');
          await clearAuthData();
          setLoading(false);
        }

        setInitialized(true);
      } catch (error) {
        console.error('[Debug] Auth initialization error:', error);
        await clearAuthData();
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Debug] Auth state change:', { 
        event, 
        hasSession: !!session,
        userId: session?.user?.id,
        timestamp: new Date().toISOString()
      });
      
      if (!mounted) return;

      try {
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('[Debug] Token refresh failed, clearing authentication data');
          await clearAuthData();
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('[Debug] Setting user and fetching profile for user:', session.user.id);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log('[Debug] No session, clearing user and profile');
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('[Debug] State change error:', error);
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
      setProfile(null);
    } finally {
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