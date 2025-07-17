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
} catch {
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
    globalEvents?: boolean
  }
  // Enhanced Profile Capabilities
  skills?: ProfileSkill[]
  offerings?: ProfileOffering[]
  availability?: ProfileAvailability
  languages?: string[]
  accessibility_needs?: string[]
  accessibility_provided?: string[]
  transportation?: {
    methods: string[]
    can_offer_rides: boolean
    needs_rides: boolean
  }
  equipment_shared?: string[]
  certifications?: ProfileCertification[]
  portfolio_items?: ProfilePortfolioItem[]
  hosting_capacity?: {
    max_participants: number
    indoor_space: boolean
    outdoor_space: boolean
    has_parking: boolean
    pet_friendly: boolean
    wheelchair_accessible: boolean
  }
  communication_preferences?: {
    preferred_methods: string[]
    response_time: 'immediate' | 'within_hours' | 'within_day' | 'flexible'
    availability_window: string
  }
  experience_since?: string
  teaching_experience?: number
  mentorship_available?: boolean
  // User type and permissions
  user_type: 'user' | 'admin' | 'moderator'
  // Space sharer fields (legacy - will be removed)
  space_sharer_status: 'none' | 'pending' | 'approved' | 'rejected'
  space_sharer_approved_at?: string
  // Unified holder status
  holder_status: {
    space: 'none' | 'pending' | 'approved' | 'rejected'
    time: 'none' | 'pending' | 'approved' | 'rejected'
  }
  holder_approved_at?: {
    space?: string
    time?: string
  }
  // Facilitator-specific fields
  is_facilitator: boolean
  facilitator_verified: boolean
  facilitator_data: {
    facilitator_since?: string
    specialties?: string[]
    certifications?: ProfileCertification[]
    insurance_info?: {
      provider: string
      policy_number: string
      expiry_date: string
      coverage_amount: string
    }
    portfolio_items?: ProfilePortfolioItem[]
    rating?: number
    completed_sessions?: number
    years_experience?: number
    bio?: string
    teaching_philosophy?: string
    approach?: string
    equipment_provided?: string[]
    languages_taught?: string[]
    accessibility_accommodations?: string[]
  }
}

export interface ProfileSkill {
  skill: string
  category: string
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  can_teach: boolean
  want_to_learn: boolean
  years_experience?: number
  description?: string
}

export interface ProfileOffering {
  id: string
  title: string
  category: string
  description: string
  type: 'service' | 'resource' | 'equipment' | 'space' | 'knowledge'
  availability: 'always' | 'scheduled' | 'on_request'
  cost_type: 'free' | 'donation' | 'barter' | 'paid'
  cost_amount?: string
  location_required?: boolean
}

export interface ProfileAvailability {
  schedule: {
    [key: string]: { // day of week
      available: boolean
      time_slots: { start: string; end: string }[]
    }
  }
  notice_required: 'same_day' | 'day_before' | 'week_before' | 'flexible'
  max_events_per_week?: number
  preferred_duration: 'short' | 'medium' | 'long' | 'any' // <2h, 2-4h, >4h
}

export interface ProfileCertification {
  id: string
  name: string
  issuing_organization: string
  date_earned: string
  expiry_date?: string
  verification_url?: string
  category: string
}

export interface ProfilePortfolioItem {
  id: string
  title: string
  description: string
  category: string
  image_urls: string[]
  created_date: string
  featured: boolean
  skills_demonstrated: string[]
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
  animals_allowed: boolean
  owner_has_pets: boolean
  owner_pet_types?: string[]
  admin_notes?: string
  owner?: Profile
  amenities?: SpaceAmenity[]
  accessibility_features?: SpaceAccessibilityFeature[]
  holistic_categories?: SpaceHolisticCategory[]
  animal_types?: SpaceAnimalType[]
  // Facilitator application fields
  allow_facilitator_applications: boolean
  application_requirements: {
    min_experience_years?: number
    required_certifications?: string[]
    insurance_required?: boolean
    portfolio_required?: boolean
    description?: string
  }
  booking_preferences: {
    min_advance_notice?: number // hours
    max_booking_duration?: number // hours
    available_days?: string[] // ['monday', 'tuesday', etc.]
    available_times?: {
      start: string
      end: string
    }[]
    auto_approve_verified?: boolean
  }
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

export interface SpaceAnimalType {
  space_id: string
  animal_type: string
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

export interface SpaceApplication {
  id: string
  space_id: string
  facilitator_id: string
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn'
  application_data: {
    event_type: string
    practice_description: string
    frequency: 'one_time' | 'weekly' | 'monthly' | 'custom'
    frequency_details?: string
    expected_attendance: number
    equipment_needed?: string[]
    message_to_owner: string
    proposed_dates?: string[]
    insurance_confirmed?: boolean
    portfolio_links?: string[]
    experience_years?: number
    certifications?: string[]
    references?: string[]
    preferred_times?: string[]
    special_requirements?: string
  }
  owner_response: {
    message?: string
    approved_terms?: {
      donation_amount?: string
      schedule_constraints?: string
      house_rules?: string
    }
    rejection_reason?: string
    meeting_requested?: boolean
  }
  created_at: string
  updated_at: string
  space?: Space
  facilitator?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  content?: string
  data: Record<string, any>
  created_at: string
  read: boolean
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

export interface PlatformSetting {
  key: string
  value: any
  description?: string
  updated_at: string
  updated_by?: string
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
      logWarning('Error getting user role:', error)
      return 'user' // Default role
    }

    return data || 'user'
  } catch (error) {
    logError(error as Error, 'getUserRole')
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
  status?: string | string[]
  limit?: number
}) => {
  let query = supabase
    .from('events')
    .select(`
      *,
      organizer:profiles!events_organizer_id_fkey(id, full_name, avatar_url, verified),
      participants:event_participants(
        user_id,
        status,
        user:profiles!event_participants_user_id_fkey(id, full_name, avatar_url)
      )
    `)

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.event_type) {
    query = query.eq('event_type', filters.event_type)
  }
  if (filters?.status && typeof filters.status === 'string') {
    query = query.eq('status', filters.status)
  } else if (filters?.status && Array.isArray(filters.status)) {
    query = query.in('status', filters.status)
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  query = query.order('date', { ascending: true })

  const result = await query;
  
  if (result.error) {
    logError(result.error as Error, 'getEvents');
  }
  
  return result;
}

// Get events a user is attending
export const getUserAttendingEvents = async (userId: string) => {
  try {
    // First get the event_ids the user is participating in
    const { data: participations, error: participationsError } = await supabase
      .from('event_participants')
      .select('event_id')
      .eq('user_id', userId)
      .eq('status', 'confirmed');
      
    if (participationsError) throw participationsError;
    if (!participations || participations.length === 0) return { data: [] };
    
    // Get the full event details
    const eventIds = participations.map(p => p.event_id);
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        organizer:profiles!events_organizer_id_fkey(id, full_name, avatar_url, verified),
        participants:event_participants(
          user_id,
          status,
          user:profiles!event_participants_user_id_fkey(id, full_name, avatar_url)
        )
      `)
      .in('id', eventIds)
      .order('date', { ascending: true });
      
    if (eventsError) throw eventsError;
    return { data: events || [] };
  } catch (error) {
    logError(error as Error, 'getUserAttendingEvents');
    return { data: [], error };
  }
};

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
      owner:profiles!spaces_owner_id_fkey(id, full_name, avatar_url, verified),
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
      reporter:profiles!reports_reporter_id_fkey(id, full_name, avatar_url)
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
      user:profiles!audit_logs_user_id_fkey(id, full_name, avatar_url)
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
      organizer:profiles!events_organizer_id_fkey(id, full_name, avatar_url, verified)
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
      owner:profiles!spaces_owner_id_fkey(id, full_name, avatar_url, verified)
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

// Platform settings functions
export const getPlatformSettings = async () => {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .order('key')

  return { data: data || [], error }
}

export const updatePlatformSetting = async (key: string, value: any, userId?: string) => {
  const { data, error } = await supabase
    .from('platform_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: userId
    })
    .select()
    .single()

  return { data, error }
}

// User management functions
export const updateUserRole = async (userId: string, roleId: number, assignedBy?: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      role_id: roleId,
      assigned_by: assignedBy,
      assigned_at: new Date().toISOString()
    })
    .select()

  return { data, error }
}

export const removeUserRole = async (userId: string, roleId: number) => {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId)

  return { error }
}

// Content moderation functions
export const updateEventStatus = async (eventId: string, status: string, adminNotes?: string, userId?: string) => {
  const updates: any = { 
    status, 
    updated_at: new Date().toISOString() 
  }
  
  if (adminNotes) updates.admin_notes = adminNotes
  
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single()

  return { data, error }
}

export const updateSpaceStatus = async (spaceId: string, status: string, adminNotes?: string, userId?: string) => {
  const updates: any = { 
    status, 
    updated_at: new Date().toISOString() 
  }
  
  if (adminNotes) updates.admin_notes = adminNotes
  
  const { data, error } = await supabase
    .from('spaces')
    .update(updates)
    .eq('id', spaceId)
    .select()
    .single()

  return { data, error }
}

export const updateReportStatus = async (reportId: string, status: string, adminNotes?: string, userId?: string) => {
  const updates: any = { 
    status, 
    admin_notes: adminNotes,
    resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    resolved_by: status === 'resolved' ? userId : null
  }
  
  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', reportId)
    .select()
    .single()

  return { data, error }
}

// Analytics functions
export const getDashboardAnalytics = async () => {
  try {
    const [
      profilesResult,
      eventsResult,
      spacesResult,
      reportsResult,
      recentProfilesResult,
      recentEventsResult,
      recentSpacesResult
    ] = await Promise.all([
      getProfilesCount(),
      getActiveEventsCount(),
      getAvailableSpacesCount(),
      getPendingReportsCount(),
      getRecentProfiles(5),
      getRecentEvents(5),
      getRecentSpaces(5)
    ])

    return {
      stats: {
        totalUsers: profilesResult.count,
        activeEvents: eventsResult.count,
        availableSpaces: spacesResult.count,
        pendingReports: reportsResult.count
      },
      recent: {
        profiles: recentProfilesResult.data,
        events: recentEventsResult.data,
        spaces: recentSpacesResult.data
      },
      error: null
    }
  } catch (error) {
    return {
      stats: { totalUsers: 0, activeEvents: 0, availableSpaces: 0, pendingReports: 0 },
      recent: { profiles: [], events: [], spaces: [] },
      error: error as Error
    }
  }
}

// Notification functions
export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'is_read' | 'read_at'>) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single()

  return { data, error }
}

export const markNotificationAsRead = async (notificationId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('id', notificationId)
    .select()
    .single()

  return { data, error }
}

export const getUserNotifications = async (userId: string, limit = 20) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data: data || [], error }
}

// Dashboard analytics with percentage changes
export const getProfilesCountWithChange = async () => {
  const now = new Date()
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [currentResult, lastWeekResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', lastWeek.toISOString())
  ])

  const currentCount = currentResult.count || 0
  const lastWeekCount = lastWeekResult.count || 0
  const change = lastWeekCount > 0 
    ? ((currentCount - lastWeekCount) / lastWeekCount * 100).toFixed(1)
    : '0'

  return { 
    count: currentCount, 
    change: `${change > 0 ? '+' : ''}${change}%`, 
    error: currentResult.error || lastWeekResult.error 
  }
}

export const getActiveEventsCountWithChange = async () => {
  const now = new Date()
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [currentResult, lastWeekResult] = await Promise.all([
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lt('created_at', lastWeek.toISOString())
  ])

  const currentCount = currentResult.count || 0
  const lastWeekCount = lastWeekResult.count || 0
  const change = lastWeekCount > 0 
    ? ((currentCount - lastWeekCount) / lastWeekCount * 100).toFixed(1)
    : currentCount > 0 ? '100' : '0'

  return { 
    count: currentCount, 
    change: `${change > 0 ? '+' : ''}${change}%`, 
    error: currentResult.error || lastWeekResult.error 
  }
}

export const getAvailableSpacesCountWithChange = async () => {
  const now = new Date()
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [currentResult, lastWeekResult] = await Promise.all([
    supabase
      .from('spaces')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available'),
    supabase
      .from('spaces')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available')
      .lt('created_at', lastWeek.toISOString())
  ])

  const currentCount = currentResult.count || 0
  const lastWeekCount = lastWeekResult.count || 0
  const change = lastWeekCount > 0 
    ? ((currentCount - lastWeekCount) / lastWeekCount * 100).toFixed(1)
    : currentCount > 0 ? '100' : '0'

  return { 
    count: currentCount, 
    change: `${change > 0 ? '+' : ''}${change}%`, 
    error: currentResult.error || lastWeekResult.error 
  }
}

export const getPendingReportsCountWithChange = async () => {
  const now = new Date()
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [currentResult, lastWeekResult] = await Promise.all([
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('created_at', lastWeek.toISOString())
  ])

  const currentCount = currentResult.count || 0
  const lastWeekCount = lastWeekResult.count || 0
  const change = lastWeekCount > 0 
    ? ((currentCount - lastWeekCount) / lastWeekCount * 100).toFixed(1)
    : currentCount > 0 ? '100' : '0'

  return { 
    count: currentCount, 
    change: `${change > 0 ? '+' : ''}${change}%`, 
    error: currentResult.error || lastWeekResult.error 
  }
}

// Space Application functions
export const createSpaceApplication = async (application: Omit<SpaceApplication, 'id' | 'created_at' | 'updated_at' | 'space' | 'facilitator'>) => {
  const { data, error } = await supabase
    .from('space_applications')
    .insert(application)
    .select(`
      *,
      space:spaces(*),
      facilitator:profiles(*)
    `)
    .single()

  return { data, error }
}

export const getSpaceApplications = async (filters?: {
  space_id?: string
  facilitator_id?: string
  status?: string
  limit?: number
}) => {
  let query = supabase
    .from('space_applications')
    .select(`
      *,
      space:spaces(*),
      facilitator:profiles(*)
    `)

  if (filters?.space_id) {
    query = query.eq('space_id', filters.space_id)
  }
  if (filters?.facilitator_id) {
    query = query.eq('facilitator_id', filters.facilitator_id)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  query = query.order('created_at', { ascending: false })

  return await query
}

export const updateSpaceApplication = async (
  applicationId: string, 
  updates: Partial<Pick<SpaceApplication, 'status' | 'owner_response'>>
) => {
  const { data, error } = await supabase
    .from('space_applications')
    .update(updates)
    .eq('id', applicationId)
    .select(`
      *,
      space:spaces(*),
      facilitator:profiles(*)
    `)
    .single()

  return { data, error }
}

export const getSpaceApplication = async (applicationId: string) => {
  const { data, error } = await supabase
    .from('space_applications')
    .select(`
      *,
      space:spaces(*),
      facilitator:profiles(*)
    `)
    .eq('id', applicationId)
    .single()

  return { data, error }
}

export const withdrawSpaceApplication = async (applicationId: string) => {
  const { data, error } = await supabase
    .from('space_applications')
    .update({ status: 'withdrawn' })
    .eq('id', applicationId)
    .select()
    .single()

  return { data, error }
}

export const getSpaceApplicationsForOwner = async (ownerId: string, status?: string) => {
  let query = supabase
    .from('space_applications')
    .select(`
      *,
      space:spaces!inner(*),
      facilitator:profiles(*)
    `)
    .eq('spaces.owner_id', ownerId)

  if (status) {
    query = query.eq('status', status)
  }

  query = query.order('created_at', { ascending: false })

  return await query
}

export const getSpaceApplicationsForFacilitator = async (facilitatorId: string, status?: string) => {
  let query = supabase
    .from('space_applications')
    .select(`
      *,
      space:spaces(*),
      facilitator:profiles(*)
    `)
    .eq('facilitator_id', facilitatorId)

  if (status) {
    query = query.eq('status', status)
  }

  query = query.order('created_at', { ascending: false })

  return await query
}

// Facilitator profile functions
export const updateFacilitatorProfile = async (userId: string, facilitatorData: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      is_facilitator: true,
      facilitator_data: facilitatorData 
    })
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

export const getFacilitatorProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .eq('is_facilitator', true)
    .single()

  return { data, error }
}

export const getSpacesAcceptingApplications = async (filters?: {
  type?: string
  limit?: number
}) => {
  let query = supabase
    .from('spaces')
    .select(`
      *,
      owner:profiles!spaces_owner_id_fkey(id, full_name, avatar_url, verified),
      amenities:space_amenities(amenity),
      accessibility_features:space_accessibility_features(feature),
      holistic_categories:space_holistic_categories(category)
    `)
    .eq('status', 'available')
    .eq('allow_facilitator_applications', true)

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  query = query.order('created_at', { ascending: false })

  return await query
}

// Booking System Interfaces and Functions

export interface SpaceBooking {
  id: string
  space_id: string
  user_id: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected'
  notes: {
    eventTitle?: string
    eventDescription?: string
    attendees?: number
    specialRequests?: string
    contactInfo?: {
      phone?: string
      email?: string
    }
    donationAmount?: string
  }
  created_at: string
  updated_at: string
  space?: Space
  user?: Profile
}

export interface SpaceAvailability {
  id: string
  space_id: string
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  is_available: boolean
  available_times: {
    start: string
    end: string
  }[]
  created_at: string
  updated_at: string
}

// Booking functions
export const createSpaceBooking = async (booking: Omit<SpaceBooking, 'id' | 'created_at' | 'updated_at' | 'space' | 'user'>) => {
  const { data, error } = await supabase
    .from('space_bookings')
    .insert(booking)
    .select(`
      *,
      space:spaces(*),
      user:profiles(*)
    `)
    .single()

  return { data, error }
}

export const getSpaceBookings = async (filters?: {
  space_id?: string
  user_id?: string
  status?: string
  limit?: number
}) => {
  let query = supabase
    .from('space_bookings')
    .select(`
      *,
      space:spaces(*),
      user:profiles(*)
    `)

  if (filters?.space_id) {
    query = query.eq('space_id', filters.space_id)
  }
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  query = query.order('created_at', { ascending: false })

  return await query
}

export const updateSpaceBooking = async (
  bookingId: string, 
  updates: Partial<Pick<SpaceBooking, 'status' | 'notes'>>
) => {
  const { data, error } = await supabase
    .from('space_bookings')
    .update(updates)
    .eq('id', bookingId)
    .select(`
      *,
      space:spaces(*),
      user:profiles(*)
    `)
    .single()

  return { data, error }
}

export const getSpaceAvailability = async (spaceId: string) => {
  const { data, error } = await supabase
    .from('space_availability')
    .select('*')
    .eq('space_id', spaceId)
    .order('day_of_week')

  return { data, error }
}

export const updateSpaceAvailability = async (
  spaceId: string,
  dayOfWeek: string,
  availability: Partial<Pick<SpaceAvailability, 'is_available' | 'available_times'>>
) => {
  const { data, error } = await supabase
    .from('space_availability')
    .upsert({
      space_id: spaceId,
      day_of_week: dayOfWeek,
      ...availability
    })
    .select()
    .single()

  return { data, error }
}

export const checkBookingConflicts = async (
  spaceId: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
) => {
  const { data, error } = await supabase
    .rpc('check_booking_conflicts', {
      p_space_id: spaceId,
      p_start_time: startTime,
      p_end_time: endTime,
      p_exclude_booking_id: excludeBookingId || null
    })

  return { data, error }
}

export const getBookingsForOwner = async (ownerId: string, status?: string) => {
  let query = supabase
    .from('space_bookings')
    .select(`
      *,
      space:spaces!inner(*),
      user:profiles(*)
    `)
    .eq('spaces.owner_id', ownerId)

  if (status) {
    query = query.eq('status', status)
  }

  query = query.order('created_at', { ascending: false })

  return await query
}

// Legacy interface - kept for compatibility
export interface SpaceSharerApplication {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected' | 'under_review'
  application_data: {
    motivation: string
    space_description: string
    hosting_experience: string
    community_involvement: string
    safety_measures: string
    availability: string
    references?: string
    additional_info?: string
  }
  admin_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
  user?: Profile
}

// Unified holder application
export interface HolderApplication {
  id: string
  user_id: string
  holder_type: ('space' | 'time')[]
  status: 'pending' | 'approved' | 'rejected' | 'under_review'
  application_data: {
    // Common fields
    motivation: string
    availability: string
    references?: string
    additional_info?: string
    
    // Space-specific fields
    space_description?: string
    hosting_experience?: string
    safety_measures?: string
    
    // Time-specific fields
    skills_offered?: string[]
    experience_summary?: string
    certifications?: string[]
    offering_types?: string[]
  }
  admin_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  submission_metadata?: any
  created_at: string
  updated_at: string
  user?: Profile
}

// Time offering interface
export interface TimeOffering {
  id: string
  holder_id: string
  title: string
  description?: string
  category: 'workshop' | 'healing' | 'class' | 'consultation' | 'ceremony' | 'other'
  duration_minutes: number
  min_participants: number
  max_participants: number
  availability_type: 'recurring' | 'on_demand' | 'scheduled'
  availability_data: any
  location_type: 'holder_space' | 'participant_space' | 'virtual' | 'flexible'
  location_radius: number
  suggested_donation?: string
  exchange_type: 'donation' | 'fixed' | 'sliding_scale' | 'barter' | 'free'
  status: 'draft' | 'active' | 'paused' | 'archived'
  verified: boolean
  requirements?: any
  image_urls: string[]
  submission_metadata?: any
  created_at: string
  updated_at: string
  holder?: Profile
  categories?: string[]
  skills?: string[]
}

// Unified contribution view
export interface UserContribution {
  contribution_type: 'space' | 'time'
  id: string
  contributor_id: string
  title: string
  description?: string
  status: string
  created_at: string
  image_urls: string[]
  details: {
    // Space details
    type?: string
    capacity?: number
    address?: string
    
    // Time details
    category?: string
    duration?: number
    participants?: {
      min: number
      max: number
    }
  }
}

export const getBookingsForUser = async (userId: string, status?: string) => {
  let query = supabase
    .from('space_bookings')
    .select(`
      *,
      space:spaces(*),
      user:profiles(*)
    `)
    .eq('user_id', userId)

  if (status) {
    query = query.eq('status', status)
  }

  query = query.order('created_at', { ascending: false })

  return await query
}