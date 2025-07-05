import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile, getUserRole } from '../lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthModalGlobal, setShowAuthModalGlobal] = useState(false)
  const [globalAuthMode, setGlobalAuthMode] = useState<'signin' | 'signup'>('signin')

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user.id)
          const role = await getUserRole(session.user.id)
          setUserRole(role)
        }
      } catch (error) {
        console.error('Error loading initial session:', error)
        
        // Check if the error is related to invalid refresh token
        if (error && typeof error === 'object' && 'message' in error) {
          const errorMessage = String(error.message).toLowerCase()
          if (errorMessage.includes('refresh token not found') || 
              errorMessage.includes('invalid refresh token')) {
            console.log('Invalid refresh token detected, clearing session...')
            // Clear the invalid session data
            await supabase.auth.signOut()
          }
        }
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user.id)
          const role = await getUserRole(session.user.id)
          setUserRole(role)
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
    try {
      // First ensure profile exists
      const { data: ensureData, error: ensureError } = await supabase
        .rpc('ensure_profile_exists', { user_id: userId })

      if (ensureError) {
        console.warn('Could not ensure profile exists:', ensureError)
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
        console.error('Error loading profile:', error)
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
            console.error('Error creating profile:', createError)
          }
        }
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error)
    }
  }

  const signUp = async (email: string, password: string, userData: {
    full_name: string
    username?: string
    neighborhood?: string
  }) => {
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            username: userData.username,
            neighborhood: userData.neighborhood
          }
        }
      })

      if (data.user && !authError) {
        // Create/update profile with retry logic
        let retries = 3
        let profileError = null

        while (retries > 0) {
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              full_name: userData.full_name,
              username: userData.username || null,
              neighborhood: userData.neighborhood || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })

          if (!error) {
            profileError = null
            break
          }

          profileError = error
          retries--
          
          if (retries > 0) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        if (profileError) {
          console.error('Error creating profile after retries:', profileError)
          return { data, error: profileError }
        }

        // Load the created profile
        await new Promise(resolve => setTimeout(resolve, 500)) // Give time for triggers to run
        await loadUserProfile(data.user.id)
      }

      return { data, error: authError }
    } catch (error) {
      console.error('Error in signUp:', error)
      return { data: null, error: error as any }
    }
  }

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = async () => {
    return await supabase.auth.signOut()
  }

  const openAuthModalGlobal = (mode: 'signin' | 'signup') => {
    setGlobalAuthMode(mode)
    setShowAuthModalGlobal(true)
  }

  const closeAuthModalGlobal = () => {
    setShowAuthModalGlobal(false)
  }

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
    signUp,
    signIn,
    signOut,
    loadUserProfile,
    openAuthModalGlobal,
    closeAuthModalGlobal
  }
}