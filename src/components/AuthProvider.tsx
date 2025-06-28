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
  signUp: (email: string, password: string, userData: any) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<any>
  loadUserProfile: (userId: string) => Promise<void>
  openAuthModalGlobal: (mode: 'signin' | 'signup') => void
  closeAuthModalGlobal: () => void
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