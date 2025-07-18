import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface VibeSessionState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

interface UseVibeSessionReturn extends VibeSessionState {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

/**
 * A smooth, clean hook that gracefully manages Supabase authentication vibes
 * Handles session validation, persistence, and smooth transitions
 */
export const useVibeSession = (): UseVibeSessionReturn => {
  const navigate = useNavigate();
  const [state, setState] = useState<VibeSessionState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Smooth state updater to keep vibes clean
  const updateState = useCallback((updates: Partial<VibeSessionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Gracefully validate and set session
  const validateSession = useCallback(async (session: Session | null) => {
    if (!session) {
      updateState({ user: null, session: null, loading: false });
      return false;
    }

    try {
      // Verify the session is still valid with Supabase
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        updateState({ user: null, session: null, loading: false, error });
        return false;
      }

      updateState({ user, session, loading: false, error: null });
      return true;
    } catch (error) {
      updateState({ 
        user: null, 
        session: null, 
        loading: false, 
        error: error as Error 
      });
      return false;
    }
  }, [updateState]);

  // Smooth session refresh
  const refreshSession = useCallback(async () => {
    try {
      updateState({ loading: true });
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      await validateSession(session);
    } catch (error) {
      updateState({ 
        error: error as Error,
        loading: false 
      });
    }
  }, [validateSession, updateState]);

  // Graceful sign out with smooth transition
  const signOut = useCallback(async () => {
    try {
      updateState({ loading: true });
      
      // Clear any app-specific localStorage items
      const keysToKeep = ['theme', 'preferences']; // Keep non-auth data
      Object.keys(localStorage).forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Smooth transition to login
      updateState({ user: null, session: null, loading: false });
      
      // Small delay for smooth UX transition
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 100);
    } catch (error) {
      updateState({ 
        error: error as Error,
        loading: false 
      });
    }
  }, [navigate, updateState]);

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        const isValid = await validateSession(session);
        
        // Redirect to login if no valid session
        if (!isValid && window.location.pathname !== '/login') {
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 100);
        }
      } catch (error) {
        if (!mounted) return;
        
        updateState({ 
          error: error as Error,
          loading: false 
        });
      }
    };

    initializeSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        switch (event) {
          case 'SIGNED_IN':
            await validateSession(session);
            break;
          
          case 'SIGNED_OUT':
            updateState({ user: null, session: null, loading: false });
            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 100);
            break;
          
          case 'TOKEN_REFRESHED':
            await validateSession(session);
            break;
          
          case 'USER_UPDATED':
            if (session) {
              await validateSession(session);
            }
            break;
        }
      }
    );

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, validateSession, updateState]);

  // Handle visibility change for session refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.session) {
        // Refresh session when tab becomes visible
        refreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.session, refreshSession]);

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    error: state.error,
    signOut,
    refreshSession,
  };
};