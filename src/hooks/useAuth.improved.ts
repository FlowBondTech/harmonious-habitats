import { useState, useEffect, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile, getUserRole } from '../lib/supabase'
import { logger, logError, logWarning } from '../lib/logger'

// Configuration for retry logic and timeouts
const MAX_RETRY_ATTEMPTS = 3
const PROFILE_LOAD_TIMEOUT = 10000 // 10 seconds
const LOADING_TIMEOUT = 15000 // 15 seconds max loading time

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthModalGlobal, setShowAuthModalGlobal] = useState(false)
  const [globalAuthMode, setGlobalAuthMode] = useState<'signin' | 'signup'>('signin')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)

  // Track retry attempts to prevent infinite loops
  const retryCount = useRef(0)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingProfile = useRef(false)

  useEffect(() => {
    // Set a global timeout for loading state
    loadingTimeoutRef.current = setTimeout(() => {
      if (loading) {
        logger.log('Loading timeout reached - clearing auth state')
        handleAuthFailure('Loading timeout')
      }
    }, LOADING_TIMEOUT)

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadUserProfileWithRetry(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        logError(error as Error, 'loadInitialSession')
        handleAuthFailure('Session load failed', error)
      } finally {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.log(`Auth state changed: ${event}`)

        setUser(session?.user ?? null)

        if (session?.user) {
          // Reset retry count on new auth event
          retryCount.current = 0
          await loadUserProfileWithRetry(session.user.id)
        } else {
          setProfile(null)
          setUserRole(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [])

  // Helper to handle auth failures with automatic logout
  const handleAuthFailure = async (reason: string, error?: any) => {
    logError(error || new Error(reason), 'authFailure')

    // Clear state
    setUser(null)
    setProfile(null)
    setUserRole(null)
    setLoading(false)

    // Sign out to clear invalid session
    try {
      await supabase.auth.signOut()
      logger.log(`Signed out due to: ${reason}`)
    } catch (signOutError) {
      logError(signOutError as Error, 'signOutAfterFailure')
    }
  }

  // Load profile with retry logic and timeout
  const loadUserProfileWithRetry = async (userId: string) => {
    // Prevent concurrent profile loads
    if (isLoadingProfile.current) {
      logger.log('Profile load already in progress, skipping')
      return
    }

    if (retryCount.current >= MAX_RETRY_ATTEMPTS) {
      logWarning('Max retry attempts reached for profile load')
      await handleAuthFailure('Max profile load retries exceeded')
      return
    }

    isLoadingProfile.current = true
    retryCount.current += 1

    try {
      // Race between profile load and timeout
      const profilePromise = loadUserProfile(userId)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile load timeout')), PROFILE_LOAD_TIMEOUT)
      )

      await Promise.race([profilePromise, timeoutPromise])

      // Success - reset retry count
      retryCount.current = 0
      setLoading(false)
    } catch (error) {
      logError(error as Error, 'loadUserProfileWithRetry')

      // Check if it's a timeout or persistent error
      const errorMessage = String(error).toLowerCase()
      if (errorMessage.includes('timeout') || retryCount.current >= MAX_RETRY_ATTEMPTS) {
        await handleAuthFailure('Profile load failed after retries', error)
      } else {
        // Exponential backoff before retry
        const delay = Math.min(1000 * Math.pow(2, retryCount.current - 1), 5000)
        logger.log(`Retrying profile load in ${delay}ms (attempt ${retryCount.current})`)
        setTimeout(() => loadUserProfileWithRetry(userId), delay)
      }
    } finally {
      isLoadingProfile.current = false
    }
  }

  const loadUserProfile = async (userId: string) => {
    try {
      // First ensure profile exists
      const { error: ensureError } = await supabase
        .rpc('ensure_profile_exists', { user_id: userId })

      if (ensureError) {
        logWarning('Could not ensure profile exists:', ensureError)
        // Continue anyway - profile might exist
      }

      // Then load the profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) {
        setProfile(data)

        // Load user role separately with error handling
        try {
          const role = await getUserRole(userId)
          setUserRole(role)
        } catch (roleError) {
          logWarning('Failed to load user role, using default', roleError)
          setUserRole('user') // Default role
        }
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
            setUserRole('user') // Default role for new users
          } else if (createError) {
            throw createError
          }
        } else {
          throw error
        }
      }
    } catch (error) {
      logError(error as Error, 'loadUserProfile')
      throw error // Re-throw to be caught by retry logic
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
      return { data: null, error: error as any }
    }
  }

  // Verify OTP code
  const verifyOTP = async (email: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      })

      if (error) {
        logError(error, 'verifyOTP')
        return { data: null, error }
      }

      // Profile will be loaded by onAuthStateChange
      return { data, error: null }
    } catch (error) {
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
      retryCount.current = 0

      // Sign out from Supabase
      const result = await supabase.auth.signOut()

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
    signUp,
    signIn,
    signInWithOTP,
    verifyOTP,
    signOut,
    loadUserProfile,
    updateProfile,
    openAuthModalGlobal,
    closeAuthModalGlobal,
    startOnboarding,
    closeOnboarding,
    completeOnboarding,
    closeShareOptions
  }
}
