import React, { createContext, useContext } from 'react'
import { useAuth } from '../hooks/useAuth'
import { User } from '@supabase/supabase-js'
import { Profile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  userRole: string | null
  loading: boolean
  isAdmin: boolean
  isModerator: boolean
  showAuthModalGlobal: boolean
  globalAuthMode: 'signin' | 'signup'
  showOnboarding: boolean
  showShareOptions: boolean
  needsOnboarding: boolean
  signUp: (email: string, password: string, userData: Record<string, unknown>) => Promise<{ user: User | null; error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>
  signInWithOTP: (email: string) => Promise<{ data?: any; error: Error | null }>
  signInWithGoogle: () => Promise<{ data?: any; error: Error | null }>
  verifyOTP: (email: string, token: string) => Promise<any>
  signOut: () => Promise<{ error: Error | null }>
  loadUserProfile: (userId: string) => Promise<void>
  updateProfile: (profileData: Partial<Profile>) => Promise<{ data?: Profile; error: Error | null }>
  openAuthModalGlobal: (mode: 'signin' | 'signup') => void
  closeAuthModalGlobal: () => void
  startOnboarding: () => void
  closeOnboarding: () => void
  completeOnboarding: () => void
  closeShareOptions: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}