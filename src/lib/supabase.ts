import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing Supabase environment variables:
    - VITE_SUPABASE_URL: ${supabaseUrl ? 'Present' : 'Missing'}
    - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Present' : 'Missing'}
    
    Please ensure your .env file contains:
    VITE_SUPABASE_URL=https://your-project-ref.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key`)
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error(`Invalid VITE_SUPABASE_URL format: "${supabaseUrl}"
    
    The URL should be a complete URL starting with https://, for example:
    VITE_SUPABASE_URL=https://your-project-ref.supabase.co
    
    Current value: ${supabaseUrl}`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  created_at: string
  updated_at: string
  username?: string
  full_name?: string
  avatar_url?: string
  bio?: string
  neighborhood?: string
  rating: number
  total_reviews: number
  verified: boolean
  discovery_radius: number
  holistic_interests: string[]
  notification_preferences: {
    newEvents: boolean
    messages: boolean
    reminders: boolean
    community: boolean
  }
}

export interface Event {
  id: string
  created_at: string
  updated_at: string
  organizer_id: string
  title: string
  description?: string
  category: string
  event_type: 'local' | 'virtual' | 'global_physical'
  date: string
  start_time: string
  end_time: string
  location_name?: string
  address?: string
  latitude?: number
  longitude?: number
  capacity: number
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'all'
  donation_suggested?: string
  image_url?: string
  verified: boolean
  is_recurring: boolean
  recurrence_pattern?: string
  materials_needed: string[]
  status: 'active' | 'cancelled' | 'completed' | 'pending_approval'
  distance_description?: string
  admin_notes?: string
  organizer?: Profile
  participants?: EventParticipant[]
}

export interface EventParticipant {
  event_id: string
  user_id: string
  joined_at: string
  status: 'confirmed' | 'waitlist' | 'cancelled'
  user?: Profile
}

export interface Space {
  id: string
  created_at: string
  updated_at: string
  owner_id: string
  name: string
  type: string
  description?: string
  address: string
  latitude?: number
  longitude?: number
  capacity: number
  max_radius?: number
  list_publicly: boolean
  guidelines?: string
  donation_suggested?: string
  image_urls: string[]
  verified: boolean
  status: 'available' | 'unavailable' | 'pending_approval' | 'suspended'
  admin_notes?: string
  owner?: Profile
  amenities?: SpaceAmenity[]
  accessibility_features?: SpaceAccessibilityFeature[]
  holistic_categories?: SpaceHolisticCategory[]
}

export interface SpaceAmenity {
  space_id: string
  amenity: string
}

export interface SpaceAccessibilityFeature {
  space_id: string
  feature: string
}

export interface SpaceHolisticCategory {
  space_id: string
  category: string
}

export interface UserRole {
  user_id: string
  role_id: number
  assigned_at: string
  assigned_by?: string
  role?: Role
}

export interface Role {
  id: number
  name: string
  description?: string
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  target_type: 'event' | 'space' | 'user' | 'message'
  target_id: string
  reason: string
  description?: string
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  created_at: string
  resolved_at?: string
  resolved_by?: string
  admin_notes?: string
  reporter?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  content?: string
  data: Record<string, any>
  created_at: string
  is_read: boolean
  read_at?: string
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  target_table: string
  target_id?: string
  old_value?: Record<string, any>
  new_value?: Record<string, any>
  timestamp: string
  ip_address?: string
  user_agent?: string
  user?: Profile
}

// Helper functions
export const isAdmin = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', userId)
    .eq('roles.name', 'admin')
    .single()

  return !error && !!data
}

export const getUserRole = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_role_safe', { user_id: userId })

    if (error) {
      console.warn('Error getting user role:', error)
      return 'user' // Default role
    }

    return data || 'user'
  } catch (error) {
    console.error('Error in getUserRole:', error)
    return 'user'
  }
}

export const createProfile = async (userId: string, profileData: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      ...profileData
    })
    .select()
    .single()

  return { data, error }
}

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

export const getEvents = async (filters?: {
  category?: string
  event_type?: string
  status?: string
  limit?: number
}) => {
  let query = supabase
    .from('events')
    .select(`
      *,
      organizer:profiles(id, full_name, avatar_url, verified),
      participants:event_participants(
        user_id,
        status,
        user:profiles(id, full_name, avatar_url)
      )
    `)

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.event_type) {
    query = query.eq('event_type', filters.event_type)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  query = query.order('date', { ascending: true })

  return await query
}

export const getSpaces = async (filters?: {
  type?: string
  status?: string
  list_publicly?: boolean
  limit?: number
}) => {
  let query = supabase
    .from('spaces')
    .select(`
      *,
      owner:profiles(id, full_name, avatar_url, verified),
      amenities:space_amenities(amenity),
      accessibility_features:space_accessibility_features(feature),
      holistic_categories:space_holistic_categories(category)
    `)

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.list_publicly !== undefined) {
    query = query.eq('list_publicly', filters.list_publicly)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  query = query.order('created_at', { ascending: false })

  return await query
}

export const getReports = async (status?: string) => {
  let query = supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles(id, full_name, avatar_url)
    `)

  if (status) {
    query = query.eq('status', status)
  }

  query = query.order('created_at', { ascending: false })

  return await query
}

export const getAuditLogs = async (limit = 50) => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      user:profiles(id, full_name, avatar_url)
    `)
    .order('timestamp', { ascending: false })
    .limit(limit)

  return { data, error }
}

// Admin Dashboard specific functions
export const getProfilesCount = async () => {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  return { count: count || 0, error }
}

export const getActiveEventsCount = async () => {
  const { count, error } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  return { count: count || 0, error }
}

export const getAvailableSpacesCount = async () => {
  const { count, error } = await supabase
    .from('spaces')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available')

  return { count: count || 0, error }
}

export const getPendingReportsCount = async () => {
  const { count, error } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return { count: count || 0, error }
}

export const getRecentProfiles = async (limit = 10) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data: data || [], error }
}

export const getRecentEvents = async (limit = 10) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organizer:profiles(id, full_name, avatar_url, verified)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data: data || [], error }
}

export const getRecentSpaces = async (limit = 10) => {
  const { data, error } = await supabase
    .from('spaces')
    .select(`
      *,
      owner:profiles(id, full_name, avatar_url, verified)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data: data || [], error }
}

export const getEventParticipantCount = async (eventId: string) => {
  const { count, error } = await supabase
    .from('event_participants')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'confirmed')

  return { count: count || 0, error }
}

export const getSpaceBookingCount = async (spaceId: string) => {
  const { count, error } = await supabase
    .from('space_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('space_id', spaceId)
    .in('status', ['confirmed', 'completed'])

  return { count: count || 0, error }
}