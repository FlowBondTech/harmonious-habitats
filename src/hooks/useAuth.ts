import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile, getUserRole } from '../lib/supabase'
import { logger, logError, logWarning } from '../lib/logger'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthModalGlobal, setShowAuthModalGlobal] = useState(false)
  const [globalAuthMode, setGlobalAuthMode] = useState<'signin' | 'signup'>('signin')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [needsReauth, setNeedsReauth] = useState(false)

  // Helper to check if error is auth-related
  const isAuthError = (error: any): boolean => {
    if (!error) return false
    const errorMessage = String(error.message || error).toLowerCase()
    return (
      errorMessage.includes('jwt') ||
      errorMessage.includes('token') ||
      errorMessage.includes('expired') ||
      errorMessage.includes('invalid signature') ||
      errorMessage.includes('refresh token not found') ||
      errorMessage.includes('unable to parse or verify')
    )
  }

  // Force clear all auth state
  const clearAuthState = async (showReauthPrompt = false) => {
    logger.log('Clearing authentication state...')
    setUser(null)
    setProfile(null)
    setUserRole(null)

    // Show re-auth prompt if this was due to token expiration
    if (showReauthPrompt) {
      setNeedsReauth(true)
    }

    // Sign out to clear Supabase session
    try {
      await supabase.auth.signOut()
    } catch (e) {
      // Ignore signout errors
    }

    // Clear storage manually as fallback
    try {
      localStorage.removeItem('harmonik-auth')
      // Clear any Supabase auth keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      // localStorage might be blocked
    }
  }

  // Handle re-authentication
  const handleReauth = () => {
    setNeedsReauth(false)
    openAuthModalGlobal('signin')
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        // Handle session fetch errors
        if (error) {
          if (isAuthError(error)) {
            logger.log('Session fetch error detected, clearing auth state:', error.message)
            await clearAuthState(true) // Show re-auth prompt
            setLoading(false)
            return
          }
        }

        setUser(session?.user ?? null)

        if (session?.user) {
          await loadUserProfile(session.user.id)
          const role = await getUserRole(session.user.id)
          setUserRole(role)
        }
      } catch (error) {
        logError(error as Error, 'loadInitialSession')

        // Check if the error is auth-related
        if (isAuthError(error)) {
          logger.log('Authentication error detected, clearing session...')
          await clearAuthState(true) // Show re-auth prompt
        }
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.log('Auth state change event:', event)

        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          logger.log('Token refresh failed, clearing auth state')
          await clearAuthState(true) // Show re-auth prompt
          setLoading(false)
          return
        }

        // Handle sign out (don't show re-auth for manual sign out)
        if (event === 'SIGNED_OUT') {
          await clearAuthState(false)
          setLoading(false)
          return
        }

        setUser(session?.user ?? null)

        if (session?.user) {
          try {
            await loadUserProfile(session.user.id)
            const role = await getUserRole(session.user.id)
            setUserRole(role)
          } catch (error) {
            if (isAuthError(error)) {
              logger.log('Profile load error, clearing auth state')
              await clearAuthState(true) // Show re-auth prompt
            }
          }
        } else {
          setProfile(null)
          setUserRole(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId: string) => {
    // Guard against undefined or invalid user ID
    if (!userId) {
      logWarning('loadUserProfile called with invalid userId:', userId)
      return
    }

    try {
      // First ensure profile exists
      const { error: ensureError } = await supabase
        .rpc('ensure_profile_exists', { user_id: userId })

      if (ensureError) {
        logWarning('Could not ensure profile exists:', ensureError)
      }

      // Then load the profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) {
        setProfile(data)
      } else if (error) {
        logError(error as Error, 'loadProfile')
        // If profile doesn't exist, create a basic one
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (newProfile) {
            setProfile(newProfile)
          } else if (createError) {
            logError(createError as Error, 'createProfile')
          }
        }
      }
    } catch (error) {
      logError(error as Error, 'loadUserProfile')
    }
  }

  // Magic link sign in with OTP
  const signInWithOTP = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      })

      if (error) {
        logError(error, 'signInWithOTP')
      }

      return { data, error }
    } catch (error) {
      logError(error as Error, 'signInWithOTP')
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') }
    }
  }

  // Verify OTP code
  const verifyOTP = async (email: string, token: string) => {
    console.log('verifyOTP called with:', { email, token });

    try {
      console.log('Calling supabase.auth.verifyOtp...');

      // Call verifyOtp directly without Promise.race (which seems to be causing the issue)
      const result = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      console.log('Supabase verifyOtp response:', result);

      if (result.error) {
        console.error('OTP verification error:', result.error);
        logError(result.error, 'verifyOTP')
        return { data: null, error: result.error }
      }

      // If successful and user exists, load their profile
      if (result.data?.user) {
        console.log('User verified, loading profile for user:', result.data.user.id);

        // Set the user immediately
        setUser(result.data.user);

        // Then load profile in the background
        await loadUserProfile(result.data.user.id)
        const role = await getUserRole(result.data.user.id)
        setUserRole(role)
        console.log('Profile loaded, role set to:', role);

        // Also refresh the session to ensure it's properly set
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('Session after verification:', sessionData);
      }

      console.log('Verification complete, returning success');
      return { data: result.data, error: null }
    } catch (error) {
      console.error('Unexpected error in verifyOTP:', error);
      logError(error as Error, 'verifyOTP')
      return { data: null, error: error as any }
    }
  }

  // Sign up with email (creates user and sends OTP)
  const signUp = async (email: string, userData: {
    full_name: string
    username?: string
    neighborhood?: string
  }) => {
    try {
      // Sign up with OTP
      const { data, error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            full_name: userData.full_name,
            username: userData.username,
            neighborhood: userData.neighborhood
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      })

      if (authError) {
        logError(authError, 'signUpWithOTP')
        return { data: null, error: authError }
      }

      // Note: Profile will be created after OTP verification
      // The database trigger will handle profile creation when user confirms email

      return { data, error: null }
    } catch (error) {
      logError(error as Error, 'signUp')
      return { data: null, error: error as any }
    }
  }

  // Legacy password sign in (keeping for backward compatibility)
  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null)
      setProfile(null)
      setUserRole(null)

      // Sign out from Supabase
      const result = await supabase.auth.signOut()

      // Log success
      logger.log('User signed out successfully')

      return result
    } catch (error) {
      logError(error as Error, 'signOut')

      // Even if there's an error, clear local state
      setUser(null)
      setProfile(null)
      setUserRole(null)

      return { error: error as Error }
    }
  }

  const openAuthModalGlobal = (mode: 'signin' | 'signup') => {
    setGlobalAuthMode(mode)
    setShowAuthModalGlobal(true)
  }

  const closeAuthModalGlobal = () => {
    setShowAuthModalGlobal(false)
  }

  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        logError(error as Error, 'updateProfile')
        return { error }
      }

      if (data) {
        setProfile(data)
      }

      return { data, error: null }
    } catch (error) {
      logError(error as Error, 'updateProfile')
      return { error: error as Error }
    }
  }

  const startOnboarding = () => {
    setShowOnboarding(true)
  }

  const closeOnboarding = () => {
    setShowOnboarding(false)
  }

  const completeOnboarding = () => {
    setShowOnboarding(false)
    setShowShareOptions(true)
  }

  const closeShareOptions = () => {
    setShowShareOptions(false)
  }

  // Check if user needs onboarding
  const needsOnboarding = user && profile && (
    !profile.full_name || 
    !profile.neighborhood ||
    !profile.interests ||
    profile.interests.length === 0
  )

  const isAdmin = userRole === 'admin'
  const isModerator = userRole === 'moderator' || isAdmin

  return {
    user,
    profile,
    userRole,
    loading,
    isAdmin,
    isModerator,
    showAuthModalGlobal,
    globalAuthMode,
    showOnboarding,
    showShareOptions,
    needsOnboarding,
    needsReauth,
    signUp,
    signIn,
    signInWithOTP,
    verifyOTP,
    signOut,
    loadUserProfile,
    updateProfile,
    openAuthModalGlobal,
    closeAuthModalGlobal,
    handleReauth,
    startOnboarding,
    closeOnboarding,
    completeOnboarding,
    closeShareOptions
  }
}