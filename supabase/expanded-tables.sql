-- ============================================
-- HARMONY SPACES - EXPANDED DATABASE SCHEMA
-- For Comprehensive Community Wellness Platform
-- ============================================

-- ============================================
-- WELLNESS & HEALING ECOSYSTEM
-- ============================================

-- Wellness Providers Registry
CREATE TABLE IF NOT EXISTS public.wellness_providers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider_type TEXT[] NOT NULL, -- ['healer', 'therapist', 'coach', 'instructor', 'practitioner']
  specializations TEXT[],
  certifications JSONB DEFAULT '[]'::jsonb,
  years_experience INTEGER,
  bio TEXT,
  philosophy TEXT,

  -- Availability & Booking
  booking_enabled BOOLEAN DEFAULT true,
  session_types JSONB, -- Different types of sessions offered
  default_session_duration INTEGER DEFAULT 60, -- in minutes
  buffer_time INTEGER DEFAULT 15, -- minutes between sessions

  -- Pricing
  pricing_model TEXT CHECK (pricing_model IN ('fixed', 'sliding_scale', 'donation', 'free')),
  base_rate DECIMAL(10, 2),
  sliding_scale_min DECIMAL(10, 2),
  sliding_scale_max DECIMAL(10, 2),

  -- Settings
  accepts_insurance BOOLEAN DEFAULT false,
  insurance_providers TEXT[],
  virtual_sessions BOOLEAN DEFAULT true,
  in_person_sessions BOOLEAN DEFAULT true,
  home_visits BOOLEAN DEFAULT false,

  -- Stats
  total_sessions INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wellness Services Catalog
CREATE TABLE IF NOT EXISTS public.wellness_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider_id UUID REFERENCES wellness_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'bodywork', 'energy_healing', 'counseling', 'nutrition', etc.
  description TEXT,
  duration_minutes INTEGER,
  price DECIMAL(10, 2),

  -- Service Details
  preparation_instructions TEXT,
  what_to_expect TEXT,
  benefits TEXT[],
  contraindications TEXT[],

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Healing Circles & Support Groups
CREATE TABLE IF NOT EXISTS public.healing_circles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  facilitator_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  circle_type TEXT, -- 'support', 'meditation', 'prayer', 'sharing', 'ceremony'

  -- Schedule
  frequency TEXT, -- 'weekly', 'biweekly', 'monthly'
  day_of_week INTEGER,
  start_time TIME,
  duration_minutes INTEGER,

  -- Settings
  max_participants INTEGER DEFAULT 12,
  is_open BOOLEAN DEFAULT true, -- open to new members
  requires_commitment BOOLEAN DEFAULT false,
  commitment_length TEXT, -- '6 weeks', '3 months', etc.

  -- Location
  is_virtual BOOLEAN DEFAULT false,
  is_in_person BOOLEAN DEFAULT true,
  location_id UUID REFERENCES spaces(id),

  guidelines TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RESOURCE SHARING & GIFT ECONOMY
-- ============================================

-- Community Resources Library
CREATE TABLE IF NOT EXISTS public.community_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'tools', 'equipment', 'books', 'materials', 'space', 'vehicle'

  -- Availability
  available_for TEXT[], -- ['lending', 'sharing', 'gifting']
  current_status TEXT DEFAULT 'available', -- 'available', 'in_use', 'maintenance', 'retired'

  -- Lending Terms
  max_loan_days INTEGER,
  deposit_required BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(10, 2),

  -- Condition & Details
  condition TEXT, -- 'new', 'excellent', 'good', 'fair', 'poor'
  purchase_date DATE,
  estimated_value DECIMAL(10, 2),
  maintenance_notes TEXT,

  -- Location
  pickup_location TEXT,
  delivery_available BOOLEAN DEFAULT false,

  -- Images
  images TEXT[],

  -- Stats
  times_shared INTEGER DEFAULT 0,
  total_days_shared INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resource Lending/Borrowing Tracker
CREATE TABLE IF NOT EXISTS public.resource_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  resource_id UUID REFERENCES community_resources(id),
  borrower_id UUID REFERENCES profiles(id),
  lender_id UUID REFERENCES profiles(id),

  -- Transaction Details
  transaction_type TEXT, -- 'lend', 'gift', 'share'
  start_date DATE NOT NULL,
  end_date DATE,
  actual_return_date DATE,

  -- Status
  status TEXT DEFAULT 'active', -- 'requested', 'active', 'returned', 'overdue', 'gifted'

  -- Feedback
  borrower_rating INTEGER CHECK (borrower_rating >= 1 AND borrower_rating <= 5),
  lender_rating INTEGER CHECK (lender_rating >= 1 AND lender_rating <= 5),
  borrower_notes TEXT,
  lender_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TIME BANKING & SKILL EXCHANGE
-- ============================================

-- Time Bank Accounts
CREATE TABLE IF NOT EXISTS public.time_bank_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

  -- Balance
  hours_balance DECIMAL(10, 2) DEFAULT 0,
  hours_earned DECIMAL(10, 2) DEFAULT 0,
  hours_spent DECIMAL(10, 2) DEFAULT 0,

  -- Settings
  auto_approve_requests BOOLEAN DEFAULT false,
  max_hours_per_request DECIMAL(10, 2) DEFAULT 8,

  -- Stats
  total_exchanges INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills & Services Offered
CREATE TABLE IF NOT EXISTS public.skill_offerings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  skill_name TEXT NOT NULL,
  category TEXT, -- 'professional', 'creative', 'practical', 'educational', 'wellness'
  description TEXT,

  -- Experience
  experience_level TEXT, -- 'beginner', 'intermediate', 'advanced', 'expert'
  years_experience INTEGER,

  -- Availability
  is_active BOOLEAN DEFAULT true,
  availability_notes TEXT,

  -- Preferences
  prefer_virtual BOOLEAN DEFAULT false,
  prefer_in_person BOOLEAN DEFAULT true,
  max_distance_miles INTEGER,

  -- Requirements
  equipment_needed TEXT,
  space_requirements TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time Bank Exchanges
CREATE TABLE IF NOT EXISTS public.time_bank_exchanges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Parties
  provider_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  skill_offering_id UUID REFERENCES skill_offerings(id),

  -- Exchange Details
  description TEXT NOT NULL,
  hours_exchanged DECIMAL(10, 2) NOT NULL,
  exchange_date DATE NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'completed', 'disputed', 'cancelled'

  -- Feedback
  provider_rating INTEGER CHECK (provider_rating >= 1 AND provider_rating <= 5),
  receiver_rating INTEGER CHECK (receiver_rating >= 1 AND receiver_rating <= 5),
  provider_feedback TEXT,
  receiver_feedback TEXT,

  -- Timestamps
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LEARNING & EDUCATION PLATFORM
-- ============================================

-- Courses & Workshops
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  instructor_id UUID REFERENCES profiles(id),

  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'wellness', 'sustainability', 'arts', 'skills', 'spirituality'

  -- Course Type
  format TEXT, -- 'workshop', 'course', 'series', 'retreat', 'intensive'
  level TEXT, -- 'beginner', 'intermediate', 'advanced', 'all_levels'

  -- Schedule
  start_date DATE,
  end_date DATE,
  schedule JSONB, -- Array of session dates/times
  total_sessions INTEGER,
  session_duration_minutes INTEGER,

  -- Capacity
  min_participants INTEGER DEFAULT 1,
  max_participants INTEGER,
  current_enrollment INTEGER DEFAULT 0,

  -- Pricing
  price DECIMAL(10, 2),
  early_bird_price DECIMAL(10, 2),
  early_bird_deadline DATE,
  sliding_scale_available BOOLEAN DEFAULT false,
  scholarships_available BOOLEAN DEFAULT false,

  -- Requirements
  prerequisites TEXT,
  materials_needed TEXT,
  materials_included TEXT,

  -- Location
  location_type TEXT, -- 'in_person', 'virtual', 'hybrid'
  space_id UUID REFERENCES spaces(id),
  virtual_platform TEXT,

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'published', 'enrolling', 'in_progress', 'completed', 'cancelled'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course Enrollments
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Enrollment Details
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'enrolled', -- 'enrolled', 'waitlisted', 'dropped', 'completed'

  -- Payment
  payment_amount DECIMAL(10, 2),
  payment_type TEXT, -- 'full', 'early_bird', 'sliding_scale', 'scholarship', 'time_bank'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'refunded'

  -- Progress
  sessions_attended INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,

  -- Certificate
  certificate_issued BOOLEAN DEFAULT false,
  certificate_issued_date DATE,

  -- Feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  testimonial TEXT,

  UNIQUE(course_id, student_id)
);

-- Learning Paths / Journeys
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,

  -- Path Structure
  courses JSONB, -- Ordered array of course IDs and requirements
  estimated_duration TEXT, -- '3 months', '1 year', etc.

  -- Completion Criteria
  required_courses INTEGER,
  elective_courses INTEGER,

  -- Certification
  offers_certification BOOLEAN DEFAULT false,
  certification_name TEXT,
  certification_requirements TEXT,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMMUNITY MARKETPLACE
-- ============================================

-- Marketplace Listings
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'handmade', 'produce', 'services', 'healing_tools', 'books', 'art'

  -- Listing Type
  listing_type TEXT, -- 'sell', 'trade', 'gift', 'wanted'

  -- Pricing
  price DECIMAL(10, 2),
  price_type TEXT, -- 'fixed', 'negotiable', 'free', 'trade', 'donation'
  trade_preferences TEXT,

  -- Details
  condition TEXT, -- 'new', 'like_new', 'good', 'fair', 'poor'
  quantity_available INTEGER DEFAULT 1,

  -- Images
  images TEXT[],

  -- Location
  pickup_available BOOLEAN DEFAULT true,
  delivery_available BOOLEAN DEFAULT false,
  shipping_available BOOLEAN DEFAULT false,
  delivery_radius_miles INTEGER,

  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'sold', 'pending', 'expired', 'removed'

  -- Stats
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,

  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMMUNITY GOALS & IMPACT
-- ============================================

-- Community Projects & Initiatives
CREATE TABLE IF NOT EXISTS public.community_projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id),

  name TEXT NOT NULL,
  description TEXT,
  mission TEXT,

  -- Project Type
  category TEXT, -- 'environmental', 'social', 'educational', 'wellness', 'infrastructure'

  -- Goals
  goals JSONB, -- Array of specific goals with metrics
  target_completion_date DATE,

  -- Resources Needed
  volunteers_needed INTEGER,
  skills_needed TEXT[],
  materials_needed TEXT[],
  funding_needed DECIMAL(10, 2),
  funding_raised DECIMAL(10, 2) DEFAULT 0,

  -- Participation
  current_volunteers INTEGER DEFAULT 0,
  total_hours_contributed INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'planning', -- 'planning', 'active', 'completed', 'paused'

  -- Impact Metrics
  impact_metrics JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Volunteer Tracking
CREATE TABLE IF NOT EXISTS public.volunteer_hours (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  volunteer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES community_projects(id),

  -- Time Tracking
  activity_date DATE NOT NULL,
  hours_contributed DECIMAL(10, 2) NOT NULL,

  -- Activity Details
  activity_type TEXT, -- 'planning', 'physical_work', 'coordination', 'outreach', 'skilled_work'
  description TEXT,

  -- Verification
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Health Metrics
CREATE TABLE IF NOT EXISTS public.community_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Time Period
  metric_date DATE NOT NULL,
  metric_type TEXT, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'

  -- Engagement Metrics
  active_members INTEGER,
  new_members INTEGER,
  events_hosted INTEGER,
  total_event_attendance INTEGER,

  -- Sharing Economy Metrics
  resources_shared INTEGER,
  time_hours_exchanged DECIMAL(10, 2),
  marketplace_transactions INTEGER,

  -- Wellness Metrics
  wellness_sessions_completed INTEGER,
  healing_circles_held INTEGER,
  courses_completed INTEGER,

  -- Impact Metrics
  volunteer_hours_total DECIMAL(10, 2),
  projects_completed INTEGER,
  carbon_saved_kg DECIMAL(10, 2),

  -- Financial Metrics
  total_value_exchanged DECIMAL(10, 2),
  donation_total DECIMAL(10, 2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SUSTAINABILITY & ENVIRONMENT
-- ============================================

-- Community Gardens
CREATE TABLE IF NOT EXISTS public.community_gardens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  location_id UUID REFERENCES spaces(id),
  coordinator_id UUID REFERENCES profiles(id),

  -- Garden Details
  total_plots INTEGER,
  available_plots INTEGER,
  plot_size_sqft INTEGER,

  -- Features
  water_available BOOLEAN DEFAULT true,
  tools_available BOOLEAN DEFAULT true,
  composting_available BOOLEAN DEFAULT true,
  greenhouse_available BOOLEAN DEFAULT false,

  -- Rules & Guidelines
  organic_only BOOLEAN DEFAULT true,
  guidelines TEXT,

  -- Season
  season_start_month INTEGER,
  season_end_month INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garden Plot Assignments
CREATE TABLE IF NOT EXISTS public.garden_plots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  garden_id UUID REFERENCES community_gardens(id) ON DELETE CASCADE,
  gardener_id UUID REFERENCES profiles(id),

  plot_number TEXT,
  assigned_date DATE,

  -- Plot Details
  current_crops TEXT[],
  notes TEXT,

  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'fallow', 'pending', 'abandoned'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Carbon Footprint Tracking
CREATE TABLE IF NOT EXISTS public.carbon_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Activity
  activity_date DATE NOT NULL,
  activity_type TEXT, -- 'carpool', 'bike', 'walk', 'public_transit', 'local_food', 'composting'

  -- Impact
  carbon_saved_kg DECIMAL(10, 2),
  distance_miles DECIMAL(10, 2),

  -- Verification
  verified BOOLEAN DEFAULT false,
  verification_method TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMMUNICATION & COLLABORATION
-- ============================================

-- Discussion Forums
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,

  -- Settings
  is_public BOOLEAN DEFAULT true,
  requires_membership BOOLEAN DEFAULT false,

  -- Stats
  topic_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Topics
CREATE TABLE IF NOT EXISTS public.forum_topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),

  title TEXT NOT NULL,
  content TEXT,

  -- Settings
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,

  -- Stats
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  last_reply_by UUID REFERENCES profiles(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Posts
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),

  content TEXT NOT NULL,

  -- Reply Threading
  parent_post_id UUID REFERENCES forum_posts(id),

  -- Moderation
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  edited_by UUID REFERENCES profiles(id),

  -- Stats
  like_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- GOVERNANCE & DECISION MAKING
-- ============================================

-- Proposals for Community Decisions
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposer_id UUID REFERENCES profiles(id),

  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'policy', 'project', 'funding', 'event', 'rule_change'

  -- Voting
  voting_start_date TIMESTAMP WITH TIME ZONE,
  voting_end_date TIMESTAMP WITH TIME ZONE,

  -- Options
  voting_type TEXT, -- 'yes_no', 'multiple_choice', 'ranked_choice'
  options JSONB, -- Array of voting options

  -- Requirements
  quorum_required INTEGER, -- Minimum votes needed
  approval_threshold DECIMAL(5, 2), -- Percentage needed to pass

  -- Results
  total_votes INTEGER DEFAULT 0,
  result JSONB,

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'open', 'closed', 'passed', 'failed'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes on Proposals
CREATE TABLE IF NOT EXISTS public.proposal_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES profiles(id),

  vote JSONB NOT NULL, -- Flexible structure for different voting types

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(proposal_id, voter_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Add appropriate indexes for all foreign keys and frequently queried columns
CREATE INDEX IF NOT EXISTS idx_wellness_providers_user ON wellness_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_services_provider ON wellness_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_healing_circles_facilitator ON healing_circles(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_resource_transactions_borrower ON resource_transactions(borrower_id);
CREATE INDEX IF NOT EXISTS idx_time_bank_exchanges_provider ON time_bank_exchanges(provider_id);
CREATE INDEX IF NOT EXISTS idx_time_bank_exchanges_receiver ON time_bank_exchanges(receiver_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_community_projects_creator ON community_projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_hours_volunteer ON volunteer_hours(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON forum_topics(category_id);
CREATE INDEX IF NOT EXISTS idx_proposals_proposer ON proposals(proposer_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE wellness_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE healing_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_bank_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_gardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies would go here...

DO $$
BEGIN
  RAISE NOTICE '✅ Expanded tables created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'New capabilities added:';
  RAISE NOTICE '- Wellness & Healing Ecosystem';
  RAISE NOTICE '- Resource Sharing & Gift Economy';
  RAISE NOTICE '- Time Banking & Skill Exchange';
  RAISE NOTICE '- Learning & Education Platform';
  RAISE NOTICE '- Community Marketplace';
  RAISE NOTICE '- Community Goals & Impact Tracking';
  RAISE NOTICE '- Sustainability & Gardens';
  RAISE NOTICE '- Forums & Communication';
  RAISE NOTICE '- Governance & Voting';
END $$;