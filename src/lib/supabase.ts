import { createClient } from '@supabase/supabase-js'
import { logError, logWarning } from './logger'
import { DEMO_MODE, DEMO_EVENTS, DEMO_SPACES, DEMO_NEIGHBORHOODS, DEMO_PEOPLE, DEMO_MESSAGES, DEMO_NOTIFICATIONS } from './demo-mode'

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

// Log configuration (remove after debugging)
console.log('Supabase configured with URL:', supabaseUrl.replace(/https:\/\/([^.]+).*/, 'https://$1.supabase.co'));

// Create a storage adapter that gracefully handles localStorage being blocked
const createStorageAdapter = () => {
  // Test if localStorage is available
  try {
    const testKey = '__localStorage_test__'
    window.localStorage.setItem(testKey, 'test')
    window.localStorage.removeItem(testKey)
    return window.localStorage
  } catch (e) {
    // localStorage is blocked, use in-memory storage as fallback
    console.warn('localStorage is blocked, using in-memory session storage. Sessions will not persist across page reloads.')
    const memoryStorage: Record<string, string> = {}
    return {
      getItem: (key: string) => memoryStorage[key] || null,
      setItem: (key: string, value: string) => { memoryStorage[key] = value },
      removeItem: (key: string) => { delete memoryStorage[key] },
      clear: () => { Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]) },
      key: (index: number) => Object.keys(memoryStorage)[index] || null,
      get length() { return Object.keys(memoryStorage).length }
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageAdapter(),
    storageKey: 'harmonik-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // Use PKCE flow for better security
  }
})

// Global error handler for JWT/auth errors
supabase.auth.onAuthStateChange((event, session) => {
  // Log auth state changes for debugging
  console.log('🔐 Auth state change:', event, session ? 'Session exists' : 'No session')

  // Clear everything on sign out or if no session after token refresh
  if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
    console.log('🧹 Clearing stale auth data')
    try {
      localStorage.removeItem('harmonik-auth')
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      // localStorage might be blocked
    }
  }
})

// Database types
export interface Activity {
  type: 'event_attended' | 'space_shared' | 'message_sent' | 'profile_updated' | 'review_given'
  timestamp: string
  description: string
  related_id?: string
}

// Community Features Types
export type SpaceMemberStatus = 'pending' | 'approved' | 'rejected' | 'removed'
export type SpaceMemberRole = 'member' | 'moderator' | 'admin'
export type CommunityRequestCategory = 'help_needed' | 'resource_request' | 'skill_sharing' | 'event_idea'
export type CommunityRequestStatus = 'open' | 'in_progress' | 'fulfilled' | 'declined' | 'cancelled'
export type CommunityRequestPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface SpaceMember {
  id: string
  created_at: string
  updated_at: string
  space_id: string
  user_id: string
  status: SpaceMemberStatus
  role: SpaceMemberRole
  application_message?: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  last_active_at?: string
  contributions_count: number
  requests_count: number
  // Relations
  user?: Profile
  space?: Space
  approved_by_user?: Profile
}

export interface CommunityRequest {
  id: string
  created_at: string
  updated_at: string
  space_id: string
  requester_id: string
  assigned_to?: string
  title: string
  description: string
  category: CommunityRequestCategory
  status: CommunityRequestStatus
  priority: CommunityRequestPriority
  is_private: boolean
  fulfilled_by?: string
  fulfilled_at?: string
  fulfillment_notes?: string
  views_count: number
  responses_count: number
  upvotes_count: number
  ai_assisted: boolean
  ai_suggestions: any[]
  // Relations
  space?: Space
  requester?: Profile
  assigned_to_user?: Profile
  fulfilled_by_user?: Profile
  responses?: CommunityRequestResponse[]
  has_upvoted?: boolean
}

export interface CommunityRequestResponse {
  id: string
  created_at: string
  updated_at: string
  request_id: string
  user_id: string
  message: string
  is_offer_to_help: boolean
  ai_assisted: boolean
  // Relations
  user?: Profile
}

export interface CommunityRequestUpvote {
  id: string
  created_at: string
  request_id: string
  user_id: string
}

// Custom Page Settings for white-label pages
export type CustomPageTemplate = 'minimal' | 'professional' | 'bold' | 'modern'

export type CustomBlockType = 'text' | 'gallery' | 'testimonials' | 'services'

export interface CustomBlock {
  id: string
  type: CustomBlockType
  title: string
  content: string | object
  order: number
}

export interface CustomPageBranding {
  primaryColor: string
  accentColor: string
  logoUrl: string | null
  bannerUrl: string | null
}

export interface CustomPageSEO {
  metaTitle: string
  metaDescription: string
}

export interface CustomPageSocialLinks {
  website?: string
  instagram?: string
  facebook?: string
  twitter?: string
  linkedin?: string
}

export interface CustomPageSettings {
  enabled: boolean
  template: CustomPageTemplate
  branding: CustomPageBranding
  customBlocks: CustomBlock[]
  seo: CustomPageSEO
  socialLinks: CustomPageSocialLinks
}

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
  // Personal Information
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  phone_number?: string
  address?: string
  city?: string
  zip_code?: string
  // Email Preferences
  email_preferences?: {
    weekly_digest: boolean
    event_reminders: boolean
    new_member_spotlights: boolean
    space_availability: boolean
    tips_resources: boolean
    email_frequency: 'realtime' | 'daily' | 'weekly' | 'monthly'
  }
  // Social Media
  social_media?: {
    instagram?: string | null
    facebook?: string | null
    linkedin?: string | null
    twitter?: string | null
    sharing_preferences: {
      auto_share_events: boolean
      share_achievements: boolean
      allow_friend_discovery: boolean
    }
  }
  // Interests
  holistic_interests: string[]
  additional_interests?: string[]
  involvement_level?: 'curious' | 'active' | 'dedicated'
  other_interests?: string
  // Mobile Notifications
  mobile_notifications?: {
    push_notifications: {
      event_reminders: boolean
      new_messages: boolean
      event_updates: boolean
      community_announcements: boolean
    }
    quiet_hours: {
      enabled: boolean
      start_time: string
      end_time: string
    }
    notification_sound: string
  }
  // Profile Statistics
  events_attended_count?: number
  hours_contributed?: number
  neighbors_met_count?: number
  // Activity & Achievements
  recent_activities?: Activity[]
  achievements?: {
    first_event: boolean
    host_event: boolean
    share_space: boolean
    connector: boolean
    regular: boolean
    verified: boolean
  }
  // Privacy Settings
  profile_visibility?: 'public' | 'community' | 'private'
  share_activity_data?: boolean
  analytics_enabled?: boolean
  // Notification preferences (legacy - to be migrated)
  notification_preferences: {
    newEvents: boolean
    messages: boolean
    reminders: boolean
    community: boolean
    globalEvents?: boolean
  }
  // Neighborhood features
  primary_neighborhood_id?: string
  verified_address?: string
  address_verified_at?: string
  neighborhood_premium: boolean
  primary_neighborhood?: Neighborhood
  // Facilitator features
  is_available_facilitator: boolean
  facilitator_bio?: string
  facilitator_experience_years?: number
  facilitator_certifications?: string[]
  facilitator_rating?: number
  facilitator_total_sessions?: number
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
  // Custom page settings for white-label facilitator pages
  custom_page_settings?: CustomPageSettings
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

// Liability Agreement Types
export type AgreementType = 'day' | 'overnight'

export interface AgreementTemplate {
  id: string
  created_at: string
  updated_at: string
  name: string
  type: AgreementType
  description?: string
  content: string
  is_default: boolean
  is_active: boolean
}

export interface SpaceLiabilityAgreement {
  id: string
  created_at: string
  updated_at: string
  space_id: string
  creator_id: string
  agreement_type: AgreementType
  template_id?: string
  title: string
  content: string
  requires_signature: boolean
  is_active: boolean
  // Relations
  space?: Space
  creator?: Profile
  template?: AgreementTemplate
}

export interface EventLiabilityAgreement {
  id: string
  created_at: string
  event_id: string
  agreement_id: string
  is_required: boolean
  // Relations
  event?: Event
  agreement?: SpaceLiabilityAgreement
}

export interface ParticipantAgreementSignature {
  id: string
  created_at: string
  event_id: string
  agreement_id: string
  participant_id: string
  signed_at: string
  signature_data?: Record<string, unknown>
  agreed_to_terms: boolean
  // Relations
  event?: Event
  agreement?: SpaceLiabilityAgreement
  participant?: Profile
}

export interface Event {
  id: string
  created_at: string
  updated_at: string

  // Ownership
  organizer_id: string
  space_id?: string
  time_offering_id?: string

  // Basic info
  title: string
  description?: string
  category: string
  event_type: 'local' | 'virtual' | 'global_physical'

  // Retreat-specific fields
  is_retreat?: boolean
  retreat_type?: 'day' | 'overnight' | 'multi-day'
  retreat_start_date?: string
  retreat_end_date?: string
  accommodation_provided?: boolean
  meals_included?: string[] // ['breakfast', 'lunch', 'dinner']
  retreat_itinerary?: Record<string, unknown>
  
  // Timing
  date: string
  start_time: string
  end_time: string
  timezone?: string
  
  // Location
  location_name?: string
  address?: string
  latitude?: number
  longitude?: number
  location_details?: string
  
  // Neighborhood
  neighborhood_id?: string
  neighborhood_only: boolean
  neighborhood?: Neighborhood
  
  // Virtual
  virtual_meeting_url?: string
  virtual_meeting_password?: string
  virtual_platform?: string
  
  // Capacity
  capacity: number
  registration_required?: boolean
  registration_deadline?: string
  waitlist_enabled?: boolean
  
  // Requirements
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'all'
  prerequisites?: string
  what_to_bring?: string
  
  // Pricing
  is_free?: boolean
  suggested_donation?: string
  minimum_donation?: number
  maximum_donation?: number
  exchange_type?: 'donation' | 'fixed' | 'sliding_scale' | 'barter' | 'free'
  
  // Media
  image_url?: string
  image_urls?: string[]
  
  // Status
  status: 'draft' | 'published' | 'cancelled' | 'completed' | 'postponed'
  visibility?: 'public' | 'private' | 'unlisted'
  verified?: boolean
  featured?: boolean
  
  // Recurring
  is_recurring?: boolean
  recurrence_rule?: string
  recurring_event_id?: string
  
  // Registry settings
  venue_provides_equipment?: boolean
  registry_visibility?: 'public' | 'organizer_only'
  registry_enabled?: boolean

  // Metadata
  tags?: string[]
  holistic_categories?: string[]
  submission_metadata?: Record<string, unknown>
  cancellation_reason?: string
  cancellation_date?: string
  completion_notes?: string
  admin_notes?: string
  distance_description?: string

  // Relations
  organizer?: Profile
  space?: Space
  time_offering?: TimeOffering
  participants?: EventParticipant[]
  participant_count?: number
  average_rating?: number
}

export interface EventParticipant {
  id: string
  event_id: string
  user_id: string
  
  // Registration
  registered_at: string
  status: 'registered' | 'waitlisted' | 'cancelled' | 'attended' | 'no_show' | 'rejected'
  
  // Attendance
  checked_in_at?: string
  checked_out_at?: string
  attendance_confirmed?: boolean
  
  // Additional info
  guest_count?: number
  special_requirements?: string
  emergency_contact?: string
  
  // Payment
  donation_amount?: number
  payment_status?: 'pending' | 'completed' | 'refunded' | 'waived'
  payment_date?: string
  
  // Communication
  reminder_sent_at?: string
  feedback_requested_at?: string
  
  // Rejection/Reinstatement
  rejected_at?: string
  rejected_by?: string
  rejection_reason?: string
  reinstated_at?: string
  reinstated_by?: string
  
  // Relations
  event?: Event
  user?: Profile
}

export interface UserLocation {
  id: string
  user_id: string
  name: string
  type: 'manual' | 'tracked'
  latitude: number
  longitude: number
  address?: string
  visit_count: number
  total_time_spent: string // interval stored as string
  last_visited: string
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface UserLocationVisit {
  id: string
  user_id: string
  location_id: string
  arrived_at: string
  departed_at?: string
  duration?: string // interval stored as string
  created_at: string
  
  // Relations
  location?: UserLocation
}

export interface UserLocationPreferences {
  user_id: string
  track_gps_enabled: boolean
  tracking_frequency: string // interval stored as string
  auto_detect_hotspots: boolean
  hotspot_threshold: number
  class_suggestion_radius: number
  last_gps_update?: string
  created_at: string
  updated_at: string
}

export interface SuggestedClass {
  id: string
  user_id: string
  event_id: string
  location_id?: string
  distance: number
  relevance_score: number
  reason: string
  dismissed: boolean
  created_at: string
  
  // Relations
  event?: Event
  location?: UserLocation
}

export interface EventReview {
  id: string
  event_id: string
  user_id: string
  
  // Review
  rating: number
  review_text?: string
  
  // Detailed ratings
  content_rating?: number
  facilitator_rating?: number
  venue_rating?: number
  value_rating?: number
  
  // Metadata
  created_at: string
  updated_at: string
  verified_attendance?: boolean
  
  // Relations
  event?: Event
  user?: Profile
}

export interface EventAnnouncement {
  id: string
  event_id: string
  author_id: string
  
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  
  created_at: string
  updated_at: string
  
  read_by?: string[]
  pinned?: boolean
  
  // Relations
  event?: Event
  author?: Profile
}

export interface EventCategory {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  parent_category_id?: string
  display_order?: number
  active?: boolean
}

export interface EventMaterial {
  id: string
  event_id: string
  item: string
  quantity?: string
  is_required?: boolean
  provider?: 'participant' | 'organizer' | 'either'
  notes?: string

  // Registry fields
  registry_type?: 'required' | 'lending'
  max_quantity?: number
  current_claims?: number
  visibility?: 'public' | 'organizer_only'
  is_template_item?: boolean
}

export interface EventMaterialClaim {
  id: string
  material_id: string
  user_id: string
  claim_type: 'personal' | 'lending'
  quantity: number
  notes?: string
  status: 'claimed' | 'cancelled'
  created_at: string
  updated_at: string

  // Relations
  material?: EventMaterial
  user?: Profile
}

// Facilitator role types for events
export type FacilitatorRole =
  | 'activity_lead'      // Main facilitator running the activity
  | 'co_facilitator'     // Co-facilitator assisting with the activity
  | 'preparer'           // Sets up materials, space preparation
  | 'setup'              // Sets up the venue/space before event
  | 'cleaner'            // Cleans during/after event
  | 'breakdown'          // Breaks down and packs up after event
  | 'post_event_cleanup' // Post-event cleanup crew
  | 'helper'             // General helper/assistant

export type FacilitatorStatus = 'invited' | 'confirmed' | 'declined' | 'removed'

export interface EventFacilitator {
  id: string
  created_at: string
  updated_at: string

  // Relationships
  event_id: string
  user_id: string

  // Role and status
  role: FacilitatorRole
  status: FacilitatorStatus

  // Additional details
  notes?: string
  invited_by?: string
  invited_at: string
  confirmed_at?: string
  declined_at?: string

  // Relations
  event?: Event
  user?: Profile
  user_full_name?: string
  user_avatar_url?: string
  user_bio?: string
}

export type PractitionerRole =
  | 'activity_lead'      // Main facilitator running the activity
  | 'preparer'           // Sets up materials, space preparation
  | 'cleaner'            // Cleans during/after event
  | 'post_event_cleanup' // Post-event cleanup crew
  | 'greeter'            // Welcomes participants
  | 'food_service'       // Handles food/beverages
  | 'materials_manager'  // Manages supplies and materials
  | 'tech_support'       // Handles technical aspects (A/V, virtual, etc.)
  | 'assistant'          // General assistant
  | 'coordinator';       // Coordinates between different roles

export interface EventPractitioner {
  id: string
  event_id: string
  practitioner_id: string
  role: PractitionerRole
  responsibilities?: string
  is_confirmed: boolean
  confirmed_at?: string
  preparation_tasks?: string[]
  cleanup_tasks?: string[]
  notes?: string
  created_at: string
  updated_at: string

  // Relations
  event?: Event
  practitioner?: Profile
}

export interface Notification {
  id: string
  created_at: string
  updated_at: string
  
  // Recipient
  user_id: string
  
  // Notification details
  type: 'event_reminder_24h' | 'event_reminder_1h' | 'event_starting_soon' |
        'event_cancelled' | 'event_updated' | 'feedback_request' |
        'registration_confirmed' | 'waitlist_promoted' | 'space_booking_request' |
        'space_booking_approved' | 'space_booking_rejected' | 'new_message' |
        'facilitator_invitation' | 'facilitator_response'
  title: string
  message: string

  // Additional context for specific notification types
  conversation_id?: string  // For message notifications
  
  // Related entities
  event_id?: string
  space_id?: string
  related_user_id?: string
  
  // Notification state
  read_at?: string
  sent_at?: string
  email_sent_at?: string
  
  // Metadata
  metadata?: any
  
  // Scheduling
  scheduled_for?: string
  expires_at?: string
  
  // Relations
  event?: Event
  space?: Space
  related_user?: Profile
}

export interface EventFeedback {
  id: string
  created_at: string
  updated_at: string
  
  // Feedback details
  event_id: string
  user_id: string
  
  // Basic feedback
  overall_rating: number
  would_recommend?: boolean
  
  // Detailed ratings
  content_rating?: number
  facilitator_rating?: number
  venue_rating?: number
  value_rating?: number
  
  // Written feedback
  what_went_well?: string
  what_could_improve?: string
  additional_comments?: string
  
  // Follow-up questions
  learned_something_new?: boolean
  felt_welcomed?: boolean
  clear_instructions?: boolean
  appropriate_skill_level?: boolean
  
  // Moderation
  is_public?: boolean
  moderated_at?: string
  moderated_by?: string
  moderation_notes?: string
  
  // Metadata
  feedback_metadata?: any
  
  // Relations
  event?: Event
  user?: Profile
  moderator?: Profile
}

export interface NotificationPreferences {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  
  // In-app notifications
  event_reminders?: boolean
  feedback_requests?: boolean
  registration_updates?: boolean
  space_updates?: boolean
  
  // Future email notifications
  email_notifications_enabled?: boolean
  email_daily_digest?: boolean
  email_weekly_summary?: boolean
  email_event_reminders?: boolean
  email_feedback_requests?: boolean
  
  // Timing preferences
  reminder_24h?: boolean
  reminder_1h?: boolean
  reminder_starting_soon?: boolean
  
  // Metadata
  preferences_metadata?: any
}

export interface Space {
  id: string
  created_at: string
  updated_at: string
  owner_id: string
  name: string
  slug: string
  type: string
  description?: string
  address: string
  latitude?: number
  longitude?: number
  capacity: number
  max_radius?: number
  list_publicly: boolean
  guidelines?: string
  // Neighborhood
  neighborhood_id?: string
  neighborhood_only: boolean
  neighborhood?: Neighborhood
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
  // Custom page settings for white-label space pages
  custom_page_settings?: CustomPageSettings
  // Community features
  community_features_enabled: boolean
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

// Neighborhood interfaces
export interface Neighborhood {
  id: string
  created_at: string
  updated_at: string
  name: string
  slug: string
  description?: string
  center_point?: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  radius_miles?: number
  created_by?: string
  member_count: number
  is_active: boolean
  is_premium: boolean
  settings: {
    require_verification: boolean
    allow_invites: boolean
    max_invites_per_member: number
    show_in_directory: boolean
  }
  creator?: Profile
}

export interface NeighborhoodMember {
  id: string
  created_at: string
  updated_at: string
  neighborhood_id: string
  user_id: string
  status: 'pending' | 'verified' | 'invited' | 'rejected'
  verified_at?: string
  verified_address?: string
  verification_method?: string
  invited_by?: string
  invited_at?: string
  invite_message?: string
  is_gate_holder: boolean
  last_active_at: string
  neighborhood?: Neighborhood
  user?: Profile
  inviter?: Profile
}

export interface NeighborhoodBoundary {
  id: string
  neighborhood_id: string
  boundary: {
    type: 'Polygon'
    coordinates: number[][][] // [[[lng, lat], [lng, lat], ...]]
  }
  created_at: string
}

// Facilitator Availability interfaces
export interface FacilitatorAvailability {
  id: string
  created_at: string
  updated_at: string
  facilitator_id: string
  is_active: boolean
  timezone: string
  weekly_schedule: {
    [key: string]: Array<{
      start: string
      end: string
    }>
  }
  min_advance_notice_hours: number
  max_advance_booking_days: number
  buffer_time_minutes: number
  preferred_session_lengths: number[]
  max_sessions_per_day: number
  available_for_online: boolean
  available_for_in_person: boolean
  travel_radius_miles: number
  suggested_donation?: string
  availability_notes?: string
  facilitator?: Profile
}

export interface FacilitatorAvailabilityOverride {
  id: string
  created_at: string
  facilitator_id: string
  override_date: string
  override_type: 'unavailable' | 'available' | 'modified'
  time_slots: Array<{
    start: string
    end: string
  }>
  reason?: string
}

export interface FacilitatorBookingRequest {
  id: string
  created_at: string
  updated_at: string
  facilitator_id: string
  space_holder_id: string
  space_id: string
  requested_date: string
  requested_start_time: string
  requested_end_time: string
  event_type: string
  event_description?: string
  expected_attendance?: number
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'
  initial_message?: string
  facilitator_response?: string
  confirmed_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  completed_at?: string
  facilitator?: Profile
  space_holder?: Profile
  space?: Space
}

export interface FacilitatorSpecialty {
  id: string
  facilitator_id: string
  specialty: string
  category: string
  experience_years: number
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

export type ConversationType = 'direct' | 'event' | 'space' | 'group';
export type ConversationRole = 'admin' | 'member';

export interface Conversation {
  id: string
  created_at: string
  updated_at: string
  name?: string
  type: ConversationType
  event_id?: string
  space_id?: string
  metadata?: any
  // Extended properties from RPC
  last_message?: string
  last_message_at?: string
  unread_count?: number
  participants?: ConversationParticipant[]
}

export interface ConversationParticipant {
  id: string
  created_at: string
  conversation_id: string
  user_id: string
  role: ConversationRole
  joined_at: string
  left_at?: string
  last_read_at?: string
  // Extended properties from joins
  user?: Profile
}

export interface Message {
  id: string
  created_at: string
  updated_at: string
  sender_id: string
  recipient_id: string
  content: string
  read_at?: string
  conversation_id?: string
  delivered_at?: string
  context_type?: 'space' | 'event' | 'general'
  context_id?: string
  // Extended properties from joins
  sender?: Profile
  recipient?: Profile
  sender_name?: string
  sender_avatar?: string
  recipient_name?: string
  recipient_avatar?: string
}

export interface ConversationThread extends Message {
  other_user_id: string
  other_user_name: string
  other_user_avatar?: string
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
  // First check if we have a valid session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    return { data: null, error: sessionError };
  }
  
  if (!session?.user) {
    return { data: null, error: new Error('No authenticated user') };
  }
  
  if (session.user.id !== userId) {
    return { data: null, error: new Error('User ID mismatch') };
  }
  
  // Add updated_at timestamp
  const updatesWithTimestamp = {
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updatesWithTimestamp)
    .eq('id', userId)
    .select()
    .single()
  
  // If we get a permission error, it might be an RLS issue
  if (error && error.message?.includes('policy')) {
    console.warn('Potential RLS policy issue detected:', error);
    return { 
      data: null, 
      error: new Error('Profile update failed. Please ensure you are signed in and try again. If the problem persists, contact support.') 
    };
  }
  
  return { data, error }
}

export const getEvents = async (filters?: {
  category?: string
  event_type?: string
  status?: string | string[]
  limit?: number
  is_recurring?: boolean
}) => {
  // Demo mode - return mock events
  if (DEMO_MODE) {
    let events = [...DEMO_EVENTS]

    // Apply filters
    if (filters?.category) {
      events = events.filter(e => e.category === filters.category)
    }
    if (filters?.event_type) {
      events = events.filter(e => e.event_type === filters.event_type)
    }
    if (filters?.status) {
      const statusFilter = Array.isArray(filters.status) ? filters.status : [filters.status]
      events = events.filter(e => statusFilter.includes(e.status))
    }
    if (filters?.is_recurring !== undefined) {
      events = events.filter(e => e.is_recurring === filters.is_recurring)
    }
    if (filters?.limit) {
      events = events.slice(0, filters.limit)
    }

    // Sort by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return { data: events, error: null }
  }

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
  if (filters?.is_recurring !== undefined) {
    query = query.eq('is_recurring', filters.is_recurring)
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
  // Demo mode - return some mock events
  if (DEMO_MODE) {
    const attendingEvents = DEMO_EVENTS.slice(0, 3) // User is attending first 3 events
    return { data: attendingEvents, error: null }
  }

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
  // Demo mode - return mock spaces
  if (DEMO_MODE) {
    let spaces = [...DEMO_SPACES]

    // Apply filters
    if (filters?.type) {
      spaces = spaces.filter(s => s.type === filters.type)
    }
    if (filters?.status) {
      spaces = spaces.filter(s => s.status === filters.status)
    }
    if (filters?.list_publicly !== undefined) {
      spaces = spaces.filter(s => s.list_publicly === filters.list_publicly)
    }
    if (filters?.limit) {
      spaces = spaces.slice(0, filters.limit)
    }

    return { data: spaces, error: null }
  }

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

export const getSpaceById = async (id: string) => {
  // Demo mode - find space by id
  if (DEMO_MODE) {
    const space = DEMO_SPACES.find(s => s.id === id)
    return { data: space || null, error: space ? null : new Error('Space not found') }
  }

  const { data, error } = await supabase
    .from('spaces')
    .select(`
      *,
      owner:profiles!spaces_owner_id_fkey(id, full_name, avatar_url, verified),
      amenities:space_amenities(amenity),
      accessibility_features:space_accessibility_features(feature),
      holistic_categories:space_holistic_categories(category)
    `)
    .eq('id', id)
    .single()
  
  return { data, error }
}

export const getSpaceBySlug = async (slug: string) => {
  // Demo mode - find space by slug
  if (DEMO_MODE) {
    const space = DEMO_SPACES.find(s => s.slug === slug)
    return { data: space || null, error: space ? null : new Error('Space not found') }
  }

  const { data, error } = await supabase
    .from('spaces')
    .select(`
      *,
      owner:profiles!spaces_owner_id_fkey(id, full_name, avatar_url, verified),
      amenities:space_amenities(amenity),
      accessibility_features:space_accessibility_features(feature),
      holistic_categories:space_holistic_categories(category)
    `)
    .eq('slug', slug)
    .single()
  
  return { data, error }
}

// Neighborhood functions
export const getNeighborhoods = async (filters?: {
  is_active?: boolean
  limit?: number
}) => {
  // Demo mode - return mock neighborhoods
  if (DEMO_MODE) {
    let neighborhoods = [...DEMO_NEIGHBORHOODS]

    // Apply filters
    if (filters?.is_active !== undefined) {
      neighborhoods = neighborhoods.filter(n => n.is_active === filters.is_active)
    }
    if (filters?.limit) {
      neighborhoods = neighborhoods.slice(0, filters.limit)
    }

    // Sort by member count
    neighborhoods.sort((a, b) => (b.member_count || 0) - (a.member_count || 0))

    return { data: neighborhoods, error: null }
  }

  let query = supabase
    .from('neighborhoods')
    .select(`
      *,
      creator:created_by(id, full_name, avatar_url, verified)
    `)
  
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  
  query = query.order('member_count', { ascending: false })
  
  return await query
}

export const getNeighborhoodBySlug = async (slug: string) => {
  // Demo mode - find neighborhood by slug
  if (DEMO_MODE) {
    const neighborhood = DEMO_NEIGHBORHOODS.find(n => n.slug === slug)
    return { data: neighborhood || null, error: neighborhood ? null : new Error('Neighborhood not found') }
  }

  const { data, error } = await supabase
    .from('neighborhoods')
    .select(`
      *,
      creator:created_by(id, full_name, avatar_url, verified)
    `)
    .eq('slug', slug)
    .single()
  
  return { data, error }
}

export const getNeighborhoodMembers = async (neighborhoodId: string) => {
  // Demo mode - return demo people as members
  if (DEMO_MODE) {
    const members = DEMO_PEOPLE.map(person => ({
      id: `member-${person.id}`,
      neighborhood_id: neighborhoodId,
      user_id: person.id,
      user: person,
      status: 'verified',
      joined_at: new Date().toISOString(),
      role: 'member'
    }))
    return { data: members, error: null }
  }

  const { data, error } = await supabase
    .from('neighborhood_members')
    .select(`
      *,
      user:profiles!neighborhood_members_user_id_fkey(id, full_name, avatar_url, verified, bio),
      inviter:profiles!neighborhood_members_invited_by_fkey(id, full_name, avatar_url)
    `)
    .eq('neighborhood_id', neighborhoodId)
    .in('status', ['verified', 'invited'])
    .order('is_gate_holder', { ascending: false })
    .order('created_at', { ascending: true })
  
  return { data, error }
}

export const getUserNeighborhoods = async (userId: string) => {
  const { data, error } = await supabase
    .from('neighborhood_members')
    .select(`
      *,
      neighborhood:neighborhoods(*)
    `)
    .eq('user_id', userId)
    .in('status', ['verified', 'invited'])
  
  return { data, error }
}

export const requestNeighborhoodMembership = async (
  neighborhoodId: string,
  userId: string,
  verifiedAddress?: string
) => {
  const { data, error } = await supabase
    .from('neighborhood_members')
    .insert({
      neighborhood_id: neighborhoodId,
      user_id: userId,
      status: 'pending',
      verified_address: verifiedAddress
    })
    .select()
    .single()
  
  return { data, error }
}

export const inviteToNeighborhood = async (
  neighborhoodId: string,
  invitedUserId: string,
  inviterId: string,
  message?: string
) => {
  const { data, error } = await supabase
    .from('neighborhood_members')
    .insert({
      neighborhood_id: neighborhoodId,
      user_id: invitedUserId,
      status: 'invited',
      invited_by: inviterId,
      invited_at: new Date().toISOString(),
      invite_message: message,
      verification_method: 'invited'
    })
    .select()
    .single()
  
  return { data, error }
}

export const updateNeighborhoodMemberStatus = async (
  memberId: string,
  status: 'verified' | 'rejected',
  verificationMethod?: string
) => {
  const updates: any = {
    status,
    updated_at: new Date().toISOString()
  }
  
  if (status === 'verified') {
    updates.verified_at = new Date().toISOString()
    updates.verification_method = verificationMethod || 'manual'
  }
  
  const { data, error } = await supabase
    .from('neighborhood_members')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single()
  
  return { data, error }
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

// Event Registry functions
export const getEventMaterials = async (eventId: string) => {
  const { data, error } = await supabase
    .from('event_materials')
    .select(`
      *,
      claims:event_material_claims(
        *,
        user:profiles(id, full_name, avatar_url)
      )
    `)
    .eq('event_id', eventId)
    .order('registry_type', { ascending: true })
    .order('is_required', { ascending: false })

  return { data: data || [], error }
}

export const getUserEventClaims = async (eventId: string, userId: string) => {
  const { data: materials } = await supabase
    .from('event_materials')
    .select('id')
    .eq('event_id', eventId)

  if (!materials || materials.length === 0) {
    return { data: [], error: null }
  }

  const materialIds = materials.map(m => m.id)

  const { data, error } = await supabase
    .from('event_material_claims')
    .select('*')
    .in('material_id', materialIds)
    .eq('user_id', userId)
    .eq('status', 'claimed')

  return { data: data || [], error }
}

export const claimEventMaterial = async (
  materialId: string,
  userId: string,
  claimType: 'personal' | 'lending',
  quantity: number,
  notes?: string
) => {
  // Check if user already has a claim for this material
  const { data: existing } = await supabase
    .from('event_material_claims')
    .select('*')
    .eq('material_id', materialId)
    .eq('user_id', userId)
    .eq('claim_type', claimType)
    .single()

  if (existing) {
    return { data: null, error: new Error('You already have a claim for this item') }
  }

  // Check available quantity
  const { data: material } = await supabase
    .from('event_materials')
    .select('max_quantity, current_claims')
    .eq('id', materialId)
    .single()

  if (material && material.max_quantity) {
    const available = material.max_quantity - (material.current_claims || 0)
    if (quantity > available) {
      return { data: null, error: new Error(`Only ${available} available`) }
    }
  }

  const { data, error } = await supabase
    .from('event_material_claims')
    .insert({
      material_id: materialId,
      user_id: userId,
      claim_type: claimType,
      quantity,
      notes,
      status: 'claimed'
    })
    .select()
    .single()

  return { data, error }
}

export const updateEventMaterialClaim = async (
  claimId: string,
  quantity: number,
  notes?: string
) => {
  const { data, error } = await supabase
    .from('event_material_claims')
    .update({
      quantity,
      notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', claimId)
    .select()
    .single()

  return { data, error }
}

export const cancelEventMaterialClaim = async (claimId: string) => {
  const { data, error } = await supabase
    .from('event_material_claims')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', claimId)
    .select()
    .single()

  return { data, error }
}

export const deleteEventMaterialClaim = async (claimId: string) => {
  const { error } = await supabase
    .from('event_material_claims')
    .delete()
    .eq('id', claimId)

  return { error }
}

export const saveEventMaterials = async (
  eventId: string,
  materials: Partial<EventMaterial>[]
) => {
  // First, delete all existing materials for this event
  await supabase
    .from('event_materials')
    .delete()
    .eq('event_id', eventId)

  // Then insert new materials
  if (materials.length > 0) {
    const materialsToInsert = materials.map(m => ({
      event_id: eventId,
      item: m.item,
      quantity: m.quantity,
      max_quantity: m.max_quantity,
      is_required: m.is_required,
      provider: m.provider,
      notes: m.notes,
      registry_type: m.registry_type,
      visibility: m.visibility,
      is_template_item: m.is_template_item
    }))

    const { data, error } = await supabase
      .from('event_materials')
      .insert(materialsToInsert)
      .select()

    return { data, error }
  }

  return { data: [], error: null }
}

export const updateEventRegistrySettings = async (
  eventId: string,
  settings: {
    venue_provides_equipment?: boolean
    registry_visibility?: 'public' | 'organizer_only'
    registry_enabled?: boolean
  }
) => {
  const { data, error } = await supabase
    .from('events')
    .update({
      ...settings,
      updated_at: new Date().toISOString()
    })
    .eq('id', eventId)
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
  // Demo mode - return mock notifications
  if (DEMO_MODE) {
    const notifications = DEMO_NOTIFICATIONS.slice(0, limit)
    return { data: notifications, error: null }
  }

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

// Update personal information
export const updatePersonalInfo = async (userId: string, personalInfo: {
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  phone_number?: string
  address?: string
  city?: string
  zip_code?: string
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...personalInfo,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// Update email preferences
export const updateEmailPreferences = async (userId: string, preferences: {
  weekly_digest: boolean
  event_reminders: boolean
  new_member_spotlights: boolean
  space_availability: boolean
  tips_resources: boolean
  email_frequency: 'realtime' | 'daily' | 'weekly' | 'monthly'
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      email_preferences: preferences,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// Update social media connections
export const updateSocialMedia = async (userId: string, socialMedia: {
  instagram?: string | null
  facebook?: string | null
  linkedin?: string | null
  twitter?: string | null
  sharing_preferences: {
    auto_share_events: boolean
    share_achievements: boolean
    allow_friend_discovery: boolean
  }
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      social_media: socialMedia,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// Update interests
export const updateInterests = async (userId: string, interests: {
  holistic_interests: string[]
  additional_interests: string[]
  involvement_level: 'curious' | 'active' | 'dedicated'
  other_interests?: string
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      holistic_interests: interests.holistic_interests,
      additional_interests: interests.additional_interests,
      involvement_level: interests.involvement_level,
      other_interests: interests.other_interests,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// Update mobile notification settings
export const updateMobileNotifications = async (userId: string, settings: {
  push_notifications: {
    event_reminders: boolean
    new_messages: boolean
    event_updates: boolean
    community_announcements: boolean
  }
  quiet_hours: {
    enabled: boolean
    start_time: string
    end_time: string
  }
  notification_sound: string
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      mobile_notifications: settings,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// Update privacy settings
export const updatePrivacySettings = async (userId: string, settings: {
  profile_visibility: 'public' | 'community' | 'private'
  share_activity_data: boolean
  analytics_enabled: boolean
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...settings,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// Messaging functions
export const sendMessage = async (
  senderId: string,
  recipientId: string,
  content: string,
  contextType?: 'space' | 'event' | 'general',
  contextId?: string
) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      content: content.trim(),
      context_type: contextType,
      context_id: contextId
    })
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(
        id,
        full_name,
        avatar_url
      ),
      recipient:profiles!messages_recipient_id_fkey(
        id,
        full_name,
        avatar_url
      )
    `)
    .single()

  // Create a notification for the recipient
  if (data && !error) {
    await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'message',
        title: 'New Message',
        message: `You have a new message from ${data.sender?.full_name || 'Someone'}`,
        link: '/messages',
        metadata: {
          message_id: data.id,
          sender_id: senderId,
          sender_name: data.sender?.full_name,
          preview: content.substring(0, 100)
        }
      })
  }

  return { data, error }
}

export const getConversations = async (userId: string) => {
  // Demo mode - return mock conversations
  if (DEMO_MODE) {
    const conversations = DEMO_PEOPLE.map((person, index) => ({
      id: `conv-${index}`,
      user_id: userId,
      other_user_id: person.id,
      other_user: person,
      last_message: DEMO_MESSAGES[index % DEMO_MESSAGES.length].content,
      last_message_at: new Date(Date.now() - index * 3600000).toISOString(),
      unread_count: index === 0 ? 2 : 0
    }))
    return { data: conversations, error: null }
  }

  const { data, error } = await supabase
    .from('conversation_threads')
    .select('*')
    .order('created_at', { ascending: false })

  return { data, error }
}

export const getMessages = async (userId: string, otherUserId: string) => {
  // Demo mode - return mock messages
  if (DEMO_MODE) {
    const otherUser = DEMO_PEOPLE.find(p => p.id === otherUserId) || DEMO_PEOPLE[0]
    const messages = DEMO_MESSAGES.map((msg, index) => ({
      ...msg,
      id: `msg-${index}`,
      sender_id: index % 2 === 0 ? userId : otherUserId,
      recipient_id: index % 2 === 0 ? otherUserId : userId,
      sender: index % 2 === 0 ? DEMO_PEOPLE[0] : otherUser,
      recipient: index % 2 === 0 ? otherUser : DEMO_PEOPLE[0],
      created_at: new Date(Date.now() - (DEMO_MESSAGES.length - index) * 600000).toISOString()
    }))
    return { data: messages, error: null }
  }

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(
        id,
        full_name,
        avatar_url
      ),
      recipient:profiles!messages_recipient_id_fkey(
        id,
        full_name,
        avatar_url
      )
    `)
    .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
    .order('created_at', { ascending: true })

  return { data, error }
}

export const markMessageAsRead = async (messageId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .update({
      read_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .select()
    .single()

  return { data, error }
}

export const getUnreadMessageCount = async (userId: string) => {
  // Demo mode - return mock unread count
  if (DEMO_MODE) {
    return { count: 1, error: null }
  }

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null)

  return { count: count || 0, error }
}

// Additional neighborhood functions
export const getNeighborhoodEvents = async (neighborhoodId: string) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('neighborhood_id', neighborhoodId)
    .eq('status', 'published')
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })

  return { data, error }
}

export const getNeighborhoodSpaces = async (neighborhoodId: string) => {
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('neighborhood_id', neighborhoodId)
    .eq('status', 'available')
    .eq('list_publicly', true)
    .order('created_at', { ascending: false })

  return { data, error }
}

export const requestToJoinNeighborhood = async (neighborhoodId: string, userId: string) => {
  const { data, error } = await supabase
    .from('neighborhood_members')
    .insert({
      neighborhood_id: neighborhoodId,
      user_id: userId,
      status: 'pending',
      verification_method: 'manual'
    })
    .select()
    .single()

  return { data, error }
}

export const respondToInvite = async (membershipId: string, response: 'accept' | 'decline') => {
  if (response === 'accept') {
    const { data, error } = await supabase
      .from('neighborhood_members')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString()
      })
      .eq('id', membershipId)
      .eq('status', 'invited')
      .select()
      .single()

    return { data, error }
  } else {
    const { error } = await supabase
      .from('neighborhood_members')
      .delete()
      .eq('id', membershipId)
      .eq('status', 'invited')

    return { data: null, error }
  }
}

// Facilitator Availability functions
export const getFacilitatorAvailability = async (facilitatorId: string) => {
  const { data, error } = await supabase
    .from('facilitator_availability')
    .select('*')
    .eq('facilitator_id', facilitatorId)
    .single()

  return { data, error }
}

export const updateFacilitatorAvailability = async (
  facilitatorId: string,
  availability: Partial<FacilitatorAvailability>
) => {
  const { data, error } = await supabase
    .from('facilitator_availability')
    .upsert({
      facilitator_id: facilitatorId,
      ...availability,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  return { data, error }
}

export const searchAvailableFacilitators = async (filters: {
  date?: string
  specialties?: string[]
  online?: boolean
  inPerson?: boolean
  radius?: number
  userLocation?: { lat: number; lng: number }
}) => {
  let query = supabase
    .from('profiles')
    .select(`
      *,
      facilitator_availability!inner(
        *
      ),
      facilitator_specialties(
        *
      )
    `)
    .eq('is_available_facilitator', true)
    .eq('facilitator_availability.is_active', true)

  if (filters.specialties && filters.specialties.length > 0) {
    query = query.in('facilitator_specialties.specialty', filters.specialties)
  }

  if (filters.online !== undefined) {
    query = query.eq('facilitator_availability.available_for_online', filters.online)
  }

  if (filters.inPerson !== undefined) {
    query = query.eq('facilitator_availability.available_for_in_person', filters.inPerson)
  }

  const { data, error } = await query

  return { data, error }
}

export const createBookingRequest = async (booking: {
  facilitator_id: string
  space_holder_id: string
  space_id: string
  requested_date: string
  requested_start_time: string
  requested_end_time: string
  event_type: string
  event_description?: string
  expected_attendance?: number
  initial_message?: string
}) => {
  const { data, error } = await supabase
    .from('facilitator_booking_requests')
    .insert(booking)
    .select()
    .single()

  return { data, error }
}

export const getBookingRequests = async (userId: string, role: 'facilitator' | 'space_holder') => {
  const column = role === 'facilitator' ? 'facilitator_id' : 'space_holder_id'
  
  const { data, error } = await supabase
    .from('facilitator_booking_requests')
    .select(`
      *,
      facilitator:profiles!facilitator_booking_requests_facilitator_id_fkey(
        id,
        full_name,
        avatar_url,
        facilitator_bio,
        facilitator_rating
      ),
      space_holder:profiles!facilitator_booking_requests_space_holder_id_fkey(
        id,
        full_name,
        avatar_url
      ),
      space:spaces(
        id,
        name,
        address
      )
    `)
    .eq(column, userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export const updateBookingRequest = async (
  bookingId: string,
  updates: {
    status?: 'accepted' | 'declined' | 'cancelled' | 'completed'
    facilitator_response?: string
    cancellation_reason?: string
  }
) => {
  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString()
  }

  if (updates.status === 'accepted') {
    updateData.confirmed_at = new Date().toISOString()
  } else if (updates.status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString()
  } else if (updates.status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('facilitator_booking_requests')
    .update(updateData)
    .eq('id', bookingId)
    .select()
    .single()

  return { data, error }
}

export const getFacilitatorSpecialties = async (facilitatorId: string) => {
  const { data, error } = await supabase
    .from('facilitator_specialties')
    .select('*')
    .eq('facilitator_id', facilitatorId)
    .order('category', { ascending: true })

  return { data, error }
}

export const updateFacilitatorSpecialties = async (
  facilitatorId: string,
  specialties: Array<{
    specialty: string
    category: string
    experience_years: number
  }>
) => {
  // First delete existing specialties
  await supabase
    .from('facilitator_specialties')
    .delete()
    .eq('facilitator_id', facilitatorId)

  // Then insert new ones
  if (specialties.length > 0) {
    const { data, error } = await supabase
      .from('facilitator_specialties')
      .insert(
        specialties.map(s => ({
          facilitator_id: facilitatorId,
          ...s
        }))
      )
      .select()

    return { data, error }
  }

  return { data: [], error: null }
}

// Admin User Rating interfaces
export interface AdminUserRating {
  id: string
  user_id: string
  admin_id: string
  rating: number
  feedback_category?: string
  feedback_text?: string
  is_public: boolean
  created_at: string
  updated_at: string
  
  // Relations
  user?: Profile
  admin?: Profile
}

// Admin rating functions
export const createAdminRating = async (rating: {
  user_id: string
  admin_id: string
  rating: number
  feedback_category?: string
  feedback_text?: string
  is_public?: boolean
}) => {
  const { data, error } = await supabase
    .from('admin_user_ratings')
    .insert(rating)
    .select(`
      *,
      user:profiles!admin_user_ratings_user_id_fkey(id, full_name, avatar_url, email),
      admin:profiles!admin_user_ratings_admin_id_fkey(id, full_name, avatar_url)
    `)
    .single()

  return { data, error }
}

export const getAdminRatingsForUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('admin_user_ratings')
    .select(`
      *,
      admin:profiles!admin_user_ratings_admin_id_fkey(id, full_name, avatar_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export const updateAdminRating = async (
  ratingId: string,
  updates: {
    rating?: number
    feedback_category?: string
    feedback_text?: string
    is_public?: boolean
  }
) => {
  const { data, error } = await supabase
    .from('admin_user_ratings')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', ratingId)
    .select()
    .single()

  return { data, error }
}

export const deleteAdminRating = async (ratingId: string) => {
  const { error } = await supabase
    .from('admin_user_ratings')
    .delete()
    .eq('id', ratingId)

  return { error }
}

export const getMyAdminRatings = async (adminId: string) => {
  const { data, error } = await supabase
    .from('admin_user_ratings')
    .select(`
      *,
      user:profiles!admin_user_ratings_user_id_fkey(id, full_name, avatar_url, email)
    `)
    .eq('admin_id', adminId)
    .order('created_at', { ascending: false })

  return { data, error }
}

// ======================================================================
// QUICK REGISTRATION & REFERRAL TRACKING SYSTEM
// ======================================================================

// Extend EventParticipant interface with new quick registration fields
export interface EventParticipantWithQuickReg extends EventParticipant {
  verification_status?: 'pending' | 'verified' | 'expired'
  verification_token?: string
  verification_sent_at?: string
  verified_at?: string
  pending_name?: string
  pending_email?: string
  referred_by?: string
  registered_via?: 'in-person' | 'online' | 'qr-code'
}

// Referral stats interface
export interface ReferralStats {
  user_id: string
  total_referrals: number
  completed_referrals: number
  pending_referrals: number
  conversion_rate: number
  last_referral_at?: string
  updated_at: string
}

// Quick registration response interface
export interface QuickRegistrationResponse {
  registration_id: string
  verification_token: string | null
  success: boolean
  message: string
}

// Verification response interface
export interface VerificationResponse {
  success: boolean
  message: string
  event_id: string | null
  event_title: string | null
}

// Referral leaderboard entry interface
export interface ReferralLeaderboardEntry {
  user_id: string
  full_name: string
  avatar_url?: string
  total_referrals: number
  completed_referrals: number
  conversion_rate: number
  rank: number
}

// User referral details interface
export interface UserReferralDetails {
  referred_user_id: string
  full_name?: string
  email?: string
  avatar_url?: string
  referral_source?: 'event' | 'direct_link' | 'ambassador' | 'organic'
  referral_event_id?: string
  event_title?: string
  onboarding_completed: boolean
  created_at: string
}

// ======================================================================
// QUICK REGISTRATION FUNCTIONS
// ======================================================================

/**
 * Create a quick registration for an in-person event check-in
 * Generates magic link verification token for new users
 */
export const createQuickRegistration = async (
  eventId: string,
  name: string,
  email: string,
  referrerId: string
): Promise<{ data: QuickRegistrationResponse | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .rpc('create_quick_registration', {
        p_event_id: eventId,
        p_name: name,
        p_email: email,
        p_referrer_id: referrerId
      })

    if (error) throw error

    // Return first row from the result
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    logError(error as Error, 'createQuickRegistration')
    return { data: null, error }
  }
}

/**
 * Verify a registration token and complete event registration
 */
export const verifyRegistrationToken = async (
  token: string,
  userId: string
): Promise<{ data: VerificationResponse | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .rpc('verify_registration_token', {
        p_token: token,
        p_user_id: userId
      })

    if (error) throw error

    // Return first row from the result
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    logError(error as Error, 'verifyRegistrationToken')
    return { data: null, error }
  }
}

/**
 * Get pending registrations for an event (organizers only)
 */
export const getPendingRegistrations = async (eventId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_pending_registrations', {
        p_event_id: eventId
      })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    logError(error as Error, 'getPendingRegistrations')
    return { data: [], error }
  }
}

// ======================================================================
// REFERRAL TRACKING FUNCTIONS
// ======================================================================

/**
 * Get referral stats for a user
 */
export const getReferralStats = async (userId: string) => {
  const { data, error } = await supabase
    .from('referral_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  return { data, error }
}

/**
 * Get referral leaderboard (top referrers)
 */
export const getReferralLeaderboard = async (limit: number = 10) => {
  try {
    const { data, error } = await supabase
      .rpc('get_referral_leaderboard', {
        p_limit: limit
      })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    logError(error as Error, 'getReferralLeaderboard')
    return { data: [], error }
  }
}

/**
 * Get details of users referred by a specific user
 */
export const getUserReferrals = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_referrals', {
        p_user_id: userId
      })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    logError(error as Error, 'getUserReferrals')
    return { data: [], error }
  }
}

/**
 * Mark user's onboarding as completed
 * This updates referral stats automatically via database triggers
 */
export const completeOnboarding = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('complete_onboarding', {
        p_user_id: userId
      })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logError(error as Error, 'completeOnboarding')
    return { data: null, error }
  }
}

/**
 * Track a referral when a user registers
 * Used during the registration flow
 */
export const trackReferral = async (
  userId: string,
  referredBy: string,
  referralSource: 'event' | 'direct_link' | 'ambassador' | 'organic',
  referralEventId?: string
) => {
  try {
    const { data, error } = await supabase
      .rpc('track_referral_on_registration', {
        p_user_id: userId,
        p_referred_by: referredBy,
        p_referral_source: referralSource,
        p_referral_event_id: referralEventId || null
      })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logError(error as Error, 'trackReferral')
    return { data: null, error }
  }
}

/**
 * Manually update referral stats for a user
 * (Usually handled automatically by database triggers)
 */
export const updateReferralStats = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('update_referral_stats', {
        p_user_id: userId
      })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logError(error as Error, 'updateReferralStats')
    return { data: null, error }
  }
}

// ======================================================================
// BRAND AMBASSADOR SYSTEM
// ======================================================================

// Brand ambassador tier type
export type AmbassadorTier = 'bronze' | 'silver' | 'gold' | 'platinum'

// Brand ambassador interface
export interface BrandAmbassador {
  user_id: string
  full_name?: string
  email?: string
  avatar_url?: string
  ambassador_tier?: AmbassadorTier
  ambassador_since?: string
  total_referrals: number
  completed_referrals: number
  conversion_rate: number
}

// Ambassador event interface
export interface AmbassadorEvent {
  event_id: string
  title: string
  description?: string
  date: string
  start_time: string
  end_time: string
  location_name?: string
  organizer_name?: string
  participant_count: number
}

/**
 * Get all brand ambassadors
 * Optionally filter by tier
 */
export const getBrandAmbassadors = async (tier?: AmbassadorTier) => {
  try {
    const { data, error } = await supabase
      .rpc('get_brand_ambassadors', {
        p_tier: tier || null
      })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error: any) {
    logError(error as Error, 'getBrandAmbassadors')
    return { data: [], error }
  }
}

/**
 * Get ambassador-only events for a user
 * Only returns events if user is an ambassador
 */
export const getAmbassadorEvents = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_ambassador_events', {
        p_user_id: userId
      })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error: any) {
    logError(error as Error, 'getAmbassadorEvents')
    return { data: [], error }
  }
}

/**
 * Manually promote a user to brand ambassador (admin only)
 */
export const adminPromoteToAmbassador = async (
  userId: string,
  tier: AmbassadorTier = 'bronze',
  notes?: string
) => {
  try {
    const { data, error } = await supabase
      .rpc('admin_promote_to_ambassador', {
        p_user_id: userId,
        p_tier: tier,
        p_notes: notes || null
      })

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    logError(error as Error, 'adminPromoteToAmbassador')
    return { data: null, error }
  }
}

/**
 * Remove ambassador status from a user (admin only)
 */
export const adminRemoveAmbassador = async (
  userId: string,
  reason?: string
) => {
  try {
    const { data, error } = await supabase
      .rpc('admin_remove_ambassador', {
        p_user_id: userId,
        p_reason: reason || null
      })

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    logError(error as Error, 'adminRemoveAmbassador')
    return { data: null, error }
  }
}

/**
 * Update ambassador status based on current referral stats (manual trigger)
 * Normally handled automatically by database triggers
 */
export const updateAmbassadorStatus = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('update_ambassador_status', {
        p_user_id: userId
      })

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    logError(error as Error, 'updateAmbassadorStatus')
    return { data: null, error }
  }
}

// ============================================================================
// Custom Page / White-Label Functions
// ============================================================================

/**
 * Get space by slug including custom page settings
 */
export const getSpaceBySlugWithCustomPage = async (slug: string): Promise<Space | null> => {
  try {
    const { data, error } = await supabase
      .from('spaces')
      .select(`
        *,
        owner:profiles(id, username, full_name, avatar_url, bio, rating, total_reviews, verified),
        neighborhood:neighborhoods(id, name, slug, description),
        amenities:space_amenities(amenity),
        accessibility_features:space_accessibility_features(feature),
        holistic_categories:space_holistic_categories(category),
        animal_types:space_animal_types(type)
      `)
      .eq('slug', slug)
      .single()

    if (error) throw error

    return data
  } catch (error: any) {
    logError(error as Error, 'getSpaceBySlugWithCustomPage')
    return null
  }
}

/**
 * Get facilitator profile by user ID including custom page settings
 */
export const getFacilitatorBySlugWithCustomPage = async (username: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .eq('is_facilitator', true)
      .single()

    if (error) throw error

    return data
  } catch (error: any) {
    logError(error as Error, 'getFacilitatorBySlugWithCustomPage')
    return null
  }
}

/**
 * Update custom page settings for a space
 */
export const updateSpaceCustomPage = async (
  spaceId: string,
  settings: Partial<CustomPageSettings>
) => {
  try {
    const { data, error } = await supabase
      .from('spaces')
      .update({ custom_page_settings: settings })
      .eq('id', spaceId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    logError(error as Error, 'updateSpaceCustomPage')
    return { data: null, error }
  }
}

/**
 * Update custom page settings for a facilitator
 */
export const updateFacilitatorCustomPage = async (
  userId: string,
  settings: Partial<CustomPageSettings>
) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ custom_page_settings: settings })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    logError(error as Error, 'updateFacilitatorCustomPage')
    return { data: null, error }
  }
}

/**
 * Upload image for custom page (logo, banner, or block image)
 */
export const uploadCustomPageImage = async (
  entityType: 'space' | 'facilitator',
  entityId: string,
  file: File,
  imageType: 'logo' | 'banner' | 'block'
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    // Create file path
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${imageType}-${timestamp}.${fileExt}`
    const filePath = `custom-pages/${entityType}s/${entityId}/${fileName}`

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(filePath)

    return { url: publicUrl, error: null }
  } catch (error: any) {
    logError(error as Error, 'uploadCustomPageImage')
    return { url: null, error }
  }
}

/**
 * Delete custom page image from storage
 */
export const deleteCustomPageImage = async (
  imageUrl: string
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/storage/v1/object/public/')
    if (pathParts.length < 2) {
      throw new Error('Invalid image URL format')
    }
    const fullPath = pathParts[1]
    const bucketAndPath = fullPath.split('/')
    const bucket = bucketAndPath[0]
    const filePath = bucketAndPath.slice(1).join('/')

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) throw error

    return { success: true, error: null }
  } catch (error: any) {
    logError(error as Error, 'deleteCustomPageImage')
    return { success: false, error }
  }
}

// ============================================================================
// Community Features Functions
// ============================================================================

/**
 * Apply for space community membership
 */
export const applyForSpaceMembership = async (
  spaceId: string,
  applicationMessage?: string
) => {
  try {
    const { data, error } = await supabase
      .from('space_members')
      .insert({
        space_id: spaceId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        status: 'pending',
        application_message: applicationMessage
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    logError(error as Error, 'applyForSpaceMembership')
    return { data: null, error }
  }
}

/**
 * Get space members with optional status filter
 */
export const getSpaceMembers = async (
  spaceId: string,
  status?: SpaceMemberStatus
) => {
  try {
    let query = supabase
      .from('space_members')
      .select(`
        *,
        user:profiles(id, username, full_name, avatar_url, bio, rating, verified),
        approved_by_user:profiles!approved_by(id, username, full_name)
      `)
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    logError(error as Error, 'getSpaceMembers')
    return { data: null, error }
  }
}

/**
 * Update space member status (approve/reject)
 */
export const updateSpaceMemberStatus = async (
  memberId: string,
  status: SpaceMemberStatus,
  rejectionReason?: string
) => {
  try {
    const { data: userData } = await supabase.auth.getUser()

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'approved') {
      updateData.approved_by = userData.user?.id
      updateData.approved_at = new Date().toISOString()
    } else if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason
    }

    const { data, error } = await supabase
      .from('space_members')
      .update(updateData)
      .eq('id', memberId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    logError(error as Error, 'updateSpaceMemberStatus')
    return { data: null, error }
  }
}

/**
 * Check if user is a member of a space
 */
export const checkSpaceMembership = async (spaceId: string, userId?: string) => {
  try {
    const { data: userData } = await supabase.auth.getUser()
    const checkUserId = userId || userData.user?.id

    if (!checkUserId) {
      return { isMember: false, membership: null, error: null }
    }

    const { data, error } = await supabase
      .from('space_members')
      .select('*')
      .eq('space_id', spaceId)
      .eq('user_id', checkUserId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return {
      isMember: data?.status === 'approved',
      membership: data,
      error: null
    }
  } catch (error: any) {
    logError(error as Error, 'checkSpaceMembership')
    return { isMember: false, membership: null, error }
  }
}

/**
 * Create a community request
 */
export const createCommunityRequest = async (
  spaceId: string,
  requestData: {
    title: string
    description: string
    category: CommunityRequestCategory
    priority?: CommunityRequestPriority
    is_private?: boolean
    ai_assisted?: boolean
    ai_suggestions?: any[]
  }
) => {
  try {
    const { data: userData } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('community_requests')
      .insert({
        space_id: spaceId,
        requester_id: userData.user?.id,
        ...requestData
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    logError(error as Error, 'createCommunityRequest')
    return { data: null, error }
  }
}

/**
 * Get community requests for a space
 */
export const getCommunityRequests = async (
  spaceId: string,
  filters?: {
    category?: CommunityRequestCategory
    status?: CommunityRequestStatus
    is_private?: boolean
  }
) => {
  try {
    const { data: userData } = await supabase.auth.getUser()

    let query = supabase
      .from('community_requests')
      .select(`
        *,
        space:spaces(id, name, slug),
        requester:profiles!requester_id(id, username, full_name, avatar_url, verified),
        assigned_to_user:profiles!assigned_to(id, username, full_name),
        fulfilled_by_user:profiles!fulfilled_by(id, username, full_name)
      `)
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.is_private !== undefined) {
      query = query.eq('is_private', filters.is_private)
    }

    const { data, error } = await query

    if (error) throw error

    // Check if user has upvoted each request
    if (userData.user?.id && data) {
      const requestIds = data.map(r => r.id)
      const { data: upvotes } = await supabase
        .from('community_request_upvotes')
        .select('request_id')
        .in('request_id', requestIds)
        .eq('user_id', userData.user.id)

      const upvotedIds = new Set(upvotes?.map(u => u.request_id) || [])

      return {
        data: data.map(request => ({
          ...request,
          has_upvoted: upvotedIds.has(request.id)
        })),
        error: null
      }
    }

    return { data, error: null }
  } catch (error: any) {
    logError(error as Error, 'getCommunityRequests')
    return { data: null, error }
  }
}

/**
 * Get a single community request with details
 */
export const getCommunityRequest = async (requestId: string) => {
  try {
    const { data: userData } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('community_requests')
      .select(`
        *,
        space:spaces(id, name, slug, owner_id),
        requester:profiles!requester_id(id, username, full_name, avatar_url, bio, verified),
        assigned_to_user:profiles!assigned_to(id, username, full_name),
        fulfilled_by_user:profiles!fulfilled_by(id, username, full_name),
        responses:community_request_responses(
          *,
          user:profiles(id, username, full_name, avatar_url, verified)
        )
      `)
      .eq('id', requestId)
      .single()

    if (error) throw error

    // Check if user has upvoted
    if (userData.user?.id) {
      const { data: upvote } = await supabase
        .from('community_request_upvotes')
        .select('id')
        .eq('request_id', requestId)
        .eq('user_id', userData.user.id)
        .single()

      return {
        data: {
          ...data,
          has_upvoted: !!upvote
        },
        error: null
      }
    }

    return { data, error: null }
  } catch (error: any) {
    logError(error as Error, 'getCommunityRequest')
    return { data: null, error }
  }
}

/**
 * Respond to a community request
 */
export const respondToCommunityRequest = async (
  requestId: string,
  message: string,
  isOfferToHelp: boolean = false,
  aiAssisted: boolean = false
) => {
  try {
    const { data: userData } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('community_request_responses')
      .insert({
        request_id: requestId,
        user_id: userData.user?.id,
        message,
        is_offer_to_help: isOfferToHelp,
        ai_assisted: aiAssisted
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    logError(error as Error, 'respondToCommunityRequest')
    return { data: null, error }
  }
}

/**
 * Upvote a community request
 */
export const upvoteCommunityRequest = async (requestId: string) => {
  try {
    const { data: userData } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('community_request_upvotes')
      .insert({
        request_id: requestId,
        user_id: userData.user?.id
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    logError(error as Error, 'upvoteCommunityRequest')
    return { data: null, error }
  }
}

/**
 * Remove upvote from a community request
 */
export const removeUpvoteCommunityRequest = async (requestId: string) => {
  try {
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('community_request_upvotes')
      .delete()
      .eq('request_id', requestId)
      .eq('user_id', userData.user?.id)

    if (error) throw error

    return { success: true, error: null }
  } catch (error: any) {
    logError(error as Error, 'removeUpvoteCommunityRequest')
    return { success: false, error }
  }
}

/**
 * Update community request status
 */
export const updateCommunityRequestStatus = async (
  requestId: string,
  status: CommunityRequestStatus,
  fulfillmentNotes?: string
) => {
  try {
    const { data: userData } = await supabase.auth.getUser()

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'fulfilled') {
      updateData.fulfilled_by = userData.user?.id
      updateData.fulfilled_at = new Date().toISOString()
      if (fulfillmentNotes) {
        updateData.fulfillment_notes = fulfillmentNotes
      }
    }

    const { data, error } = await supabase
      .from('community_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    logError(error as Error, 'updateCommunityRequestStatus')
    return { data: null, error }
  }
}
