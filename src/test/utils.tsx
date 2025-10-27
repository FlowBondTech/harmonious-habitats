import React, { ReactElement } from 'react'
import { render, RenderOptions, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../components/AuthProvider'
import { vi } from 'vitest'

// Custom render function that wraps components with common providers
interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock Supabase client for testing
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOtp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  })),
  rpc: vi.fn(),
}

// Helper to create mock events
export const createMockEvent = (overrides = {}) => ({
  id: 'test-event-id',
  title: 'Test Event',
  description: 'This is a test event',
  date: new Date().toISOString(),
  start_time: '10:00',
  end_time: '12:00',
  category: 'yoga',
  event_type: 'local' as const,
  is_free: true,
  capacity: 20,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Helper to create mock profiles
export const createMockProfile = (overrides = {}) => ({
  id: 'test-user-id',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  full_name: 'Test User',
  email: 'test@example.com',
  avatar_url: null,
  bio: 'Test bio',
  neighborhood: 'Test Neighborhood',
  rating: 5,
  total_reviews: 0,
  verified: false,
  discovery_radius: 5,
  holistic_interests: ['yoga', 'meditation'],
  notification_preferences: {
    newEvents: true,
    messages: true,
    reminders: true,
    community: true,
  },
  ...overrides,
})

// Helper to create mock spaces
export const createMockSpace = (overrides = {}) => ({
  id: 'test-space-id',
  name: 'Test Space',
  description: 'This is a test space',
  type: 'indoor',
  address: '123 Test St',
  latitude: 0,
  longitude: 0,
  capacity: 10,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Wait for element helpers
export const waitForLoadingToFinish = () =>
  screen.findByText(/loading/i, {}, { timeout: 3000 })
    .then(() => {})
    .catch(() => {}) // Ignore if loading text not found
