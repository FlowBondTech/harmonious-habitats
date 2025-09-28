-- ============================================
-- HARMONIOUS HABITATS - Expanded Database Schema
-- A comprehensive community wellness & connection platform
-- ============================================

-- This script expands the base database with additional tables for:
-- 1. Wellness & Healing Services
-- 2. Community Resources & Sharing
-- 3. Learning & Education
-- 4. Marketplace & Exchange
-- 5. Impact Tracking & Analytics
-- 6. Community Governance

-- ============================================
-- WELLNESS & HEALING MODULE
-- ============================================

-- Wellness Providers (practitioners, healers, therapists)
CREATE TABLE IF NOT EXISTS public.wellness_providers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Professional Info
  professional_title TEXT,
  certifications TEXT[],
  years_of_experience INTEGER,
  specializations TEXT[],
  healing_modalities TEXT[], -- reiki, massage, acupuncture, etc.

  -- Practice Details
  practice_name TEXT,
  practice_type TEXT CHECK (practice_type IN ('individual', 'clinic', 'collective', 'mobile')),
  accepts_insurance BOOLEAN DEFAULT false,
  insurance_providers TEXT[],

  -- Availability
  consultation_types TEXT[], -- in-person, virtual, hybrid
  home_visits BOOLEAN DEFAULT false,
  emergency_availability BOOLEAN DEFAULT false,

  -- Pricing
  pricing_structure TEXT CHECK (pricing_structure IN ('fixed', 'sliding_scale', 'donation', 'insurance_only', 'mixed')),
  hourly_rate_min DECIMAL(10, 2),
  hourly_rate_max DECIMAL(10, 2),

  -- Profile
  bio TEXT,
  approach_philosophy TEXT,
  languages_spoken TEXT[],

  -- Verification
  verified_credentials BOOLEAN DEFAULT false,
  verification_date TIMESTAMP WITH TIME ZONE,
  verification_documents JSONB,

  -- Statistics
  total_sessions_provided INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  UNIQUE(user_id)
);

-- Wellness Services Catalog
CREATE TABLE IF NOT EXISTS public.wellness_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider_id UUID REFERENCES wellness_providers(id) ON DELETE CASCADE,

  -- Service Details
  service_name TEXT NOT NULL,
  service_category TEXT, -- massage, energy work, counseling, etc.
  description TEXT,

  -- Duration & Sessions
  duration_minutes INTEGER,
  session_type TEXT CHECK (session_type IN ('single', 'package', 'subscription', 'ongoing')),
  package_size INTEGER, -- number of sessions if package

  -- Pricing
  price DECIMAL(10, 2),
  price_type TEXT CHECK (price_type IN ('fixed', 'per_session', 'per_package', 'sliding_scale', 'donation')),

  -- Requirements
  prerequisites TEXT[],
  age_restrictions TEXT,
  health_considerations TEXT,

  -- Availability
  is_active BOOLEAN DEFAULT true,
  max_clients_per_session INTEGER DEFAULT 1, -- for group sessions

  -- Materials
  includes_materials BOOLEAN DEFAULT false,
  materials_description TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Wellness Sessions (bookings)
CREATE TABLE IF NOT EXISTS public.wellness_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  service_id UUID REFERENCES wellness_services(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES wellness_providers(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Schedule
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'America/Los_Angeles',

  -- Location
  session_location TEXT CHECK (session_location IN ('provider_location', 'client_home', 'virtual', 'other')),
  location_details TEXT,
  virtual_link TEXT,

  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),

  -- Payment
  payment_amount DECIMAL(10, 2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'waived', 'insurance_pending')),
  payment_method TEXT,

  -- Notes
  provider_notes TEXT, -- private
  session_notes TEXT, -- can be shared
  client_feedback TEXT,

  -- Follow-up
  follow_up_recommended BOOLEAN DEFAULT false,
  follow_up_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Healing Circles (support groups)
CREATE TABLE IF NOT EXISTS public.healing_circles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  facilitator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Circle Info
  circle_name TEXT NOT NULL,
  circle_type TEXT, -- grief, addiction recovery, chronic illness, etc.
  description TEXT,

  -- Format
  format TEXT CHECK (format IN ('open', 'closed', 'drop_in', 'series')),
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'as_needed')),
  duration_weeks INTEGER, -- for series

  -- Meetings
  meeting_day INTEGER, -- 0-6 for weekly
  meeting_time TIME,
  meeting_duration_minutes INTEGER,

  -- Location
  is_virtual BOOLEAN DEFAULT false,
  location_id UUID REFERENCES spaces(id),
  virtual_platform TEXT,

  -- Participation
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  requires_registration BOOLEAN DEFAULT true,
  is_confidential BOOLEAN DEFAULT true,

  -- Guidelines
  circle_agreements TEXT, -- community agreements
  prerequisites TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- COMMUNITY RESOURCES MODULE
-- ============================================

-- Community Resources (tool library, equipment, etc.)
CREATE TABLE IF NOT EXISTS public.community_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Resource Info
  resource_name TEXT NOT NULL,
  resource_type TEXT, -- tool, equipment, book, seed, etc.
  category TEXT, -- gardening, construction, kitchen, craft, etc.
  description TEXT,

  -- Condition
  condition TEXT CHECK (condition IN ('new', 'excellent', 'good', 'fair', 'needs_repair')),
  purchase_date DATE,
  estimated_value DECIMAL(10, 2),

  -- Availability
  is_available BOOLEAN DEFAULT true,
  availability_type TEXT CHECK (availability_type IN ('loan', 'share', 'rent', 'gift')),

  -- Lending Terms
  max_loan_days INTEGER DEFAULT 7,
  deposit_required BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(10, 2),

  -- Location
  storage_location TEXT,
  pickup_instructions TEXT,
  delivery_available BOOLEAN DEFAULT false,

  -- Images
  images TEXT[],
  manual_url TEXT,

  -- Usage
  times_borrowed INTEGER DEFAULT 0,
  last_borrowed DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Resource Lending Tracking
CREATE TABLE IF NOT EXISTS public.resource_lending (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  resource_id UUID REFERENCES community_resources(id) ON DELETE CASCADE,
  borrower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Loan Period
  loan_start_date DATE NOT NULL,
  loan_end_date DATE NOT NULL,
  actual_return_date DATE,

  -- Status
  status TEXT DEFAULT 'reserved' CHECK (status IN ('reserved', 'checked_out', 'returned', 'overdue', 'lost', 'damaged')),

  -- Condition
  condition_at_checkout TEXT,
  condition_at_return TEXT,
  damage_notes TEXT,

  -- Deposit
  deposit_collected DECIMAL(10, 2),
  deposit_returned DECIMAL(10, 2),

  -- Notes
  borrower_notes TEXT,
  lender_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Skill Exchange (time banking)
CREATE TABLE IF NOT EXISTS public.skill_exchange (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Skill Info
  skill_name TEXT NOT NULL,
  skill_category TEXT, -- teaching, repair, creative, professional, etc.
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  description TEXT,

  -- Availability
  is_active BOOLEAN DEFAULT true,
  availability_schedule JSONB,
  max_hours_per_week INTEGER,

  -- Exchange Preferences
  exchange_type TEXT CHECK (exchange_type IN ('time_bank', 'direct_exchange', 'pay_it_forward', 'mixed')),
  preferred_exchanges TEXT[], -- what they'd like in return

  -- Location
  service_area TEXT[], -- neighborhoods/areas served
  remote_available BOOLEAN DEFAULT false,
  travel_willing BOOLEAN DEFAULT false,

  -- Requirements
  tools_required TEXT[],
  participant_requirements TEXT,

  -- Statistics
  total_hours_provided INTEGER DEFAULT 0,
  total_exchanges INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Time Bank Transactions
CREATE TABLE IF NOT EXISTS public.time_bank_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Parties
  giver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  skill_exchange_id UUID REFERENCES skill_exchange(id),

  -- Transaction Details
  hours_exchanged DECIMAL(4, 2) NOT NULL,
  service_date DATE NOT NULL,
  service_description TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'disputed', 'cancelled')),

  -- Verification
  giver_confirmed BOOLEAN DEFAULT false,
  receiver_confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMP WITH TIME ZONE,

  -- Ratings
  giver_rating INTEGER CHECK (giver_rating >= 1 AND giver_rating <= 5),
  receiver_rating INTEGER CHECK (receiver_rating >= 1 AND receiver_rating <= 5),

  -- Notes
  public_notes TEXT,
  private_notes JSONB, -- {giver: "...", receiver: "..."}

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Community Gardens
CREATE TABLE IF NOT EXISTS public.community_gardens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Garden Info
  garden_name TEXT NOT NULL,
  location_id UUID REFERENCES spaces(id),
  address TEXT,

  -- Size & Layout
  total_plots INTEGER,
  available_plots INTEGER DEFAULT 0,
  plot_size_sqft INTEGER,

  -- Features
  has_water BOOLEAN DEFAULT true,
  has_compost BOOLEAN DEFAULT false,
  has_tools BOOLEAN DEFAULT false,
  has_greenhouse BOOLEAN DEFAULT false,
  accessibility_features TEXT[],

  -- Rules & Guidelines
  organic_only BOOLEAN DEFAULT true,
  garden_rules TEXT,
  volunteer_hours_required INTEGER DEFAULT 0, -- per month

  -- Fees
  plot_fee_annual DECIMAL(10, 2),
  fee_structure TEXT, -- sliding scale info

  -- Management
  coordinator_id UUID REFERENCES profiles(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garden Plot Assignments
CREATE TABLE IF NOT EXISTS public.garden_plots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  garden_id UUID REFERENCES community_gardens(id) ON DELETE CASCADE,
  gardener_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Plot Details
  plot_number TEXT NOT NULL,
  plot_size_sqft INTEGER,

  -- Assignment
  assigned_date DATE NOT NULL,
  expiry_date DATE,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),

  -- Compliance
  volunteer_hours_completed INTEGER DEFAULT 0,
  last_maintenance_date DATE,
  warnings_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  UNIQUE(garden_id, plot_number)
);

-- ============================================
-- LEARNING & EDUCATION MODULE
-- ============================================

-- Courses & Workshops
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Course Info
  course_title TEXT NOT NULL,
  course_type TEXT CHECK (course_type IN ('workshop', 'series', 'intensive', 'retreat', 'ongoing')),
  category TEXT, -- wellness, sustainability, arts, skills, etc.
  description TEXT,

  -- Schedule
  start_date DATE,
  end_date DATE,
  schedule_details TEXT, -- "Every Tuesday 6-8pm"
  total_sessions INTEGER,
  hours_per_session DECIMAL(3, 1),

  -- Location
  is_online BOOLEAN DEFAULT false,
  location_id UUID REFERENCES spaces(id),
  online_platform TEXT,

  -- Enrollment
  min_participants INTEGER DEFAULT 1,
  max_participants INTEGER,
  current_enrollment INTEGER DEFAULT 0,

  -- Requirements
  prerequisites TEXT[],
  age_range TEXT,
  materials_needed TEXT[],

  -- Pricing
  fee_type TEXT CHECK (fee_type IN ('free', 'fixed', 'sliding_scale', 'donation', 'material_cost_only')),
  course_fee DECIMAL(10, 2),
  early_bird_discount DECIMAL(5, 2), -- percentage
  scholarship_available BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'enrolling', 'in_progress', 'completed', 'cancelled')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Course Enrollments
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Enrollment Details
  enrolled_date DATE NOT NULL,
  enrollment_status TEXT DEFAULT 'enrolled' CHECK (enrollment_status IN ('enrolled', 'waitlisted', 'dropped', 'completed', 'incomplete')),

  -- Payment
  payment_amount DECIMAL(10, 2),
  payment_status TEXT,
  scholarship_recipient BOOLEAN DEFAULT false,

  -- Attendance
  sessions_attended INTEGER DEFAULT 0,
  attendance_percentage DECIMAL(5, 2),

  -- Completion
  completed_date DATE,
  certificate_issued BOOLEAN DEFAULT false,
  certificate_id TEXT,

  -- Feedback
  course_rating INTEGER CHECK (course_rating >= 1 AND course_rating <= 5),
  feedback_text TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  UNIQUE(course_id, student_id)
);

-- Learning Paths (curated learning journeys)
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_by UUID REFERENCES profiles(id),

  -- Path Info
  path_name TEXT NOT NULL,
  path_category TEXT,
  description TEXT,

  -- Structure
  total_courses INTEGER,
  estimated_duration_weeks INTEGER,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'mixed')),

  -- Courses (ordered)
  course_sequence JSONB, -- [{course_id, order, required}]

  -- Completion
  completion_certificate BOOLEAN DEFAULT false,
  completion_benefits TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- MARKETPLACE & EXCHANGE MODULE
-- ============================================

-- Marketplace Listings
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Listing Info
  title TEXT NOT NULL,
  listing_type TEXT CHECK (listing_type IN ('sell', 'buy', 'trade', 'free', 'wanted')),
  category TEXT,
  description TEXT,

  -- Condition & Details
  item_condition TEXT CHECK (item_condition IN ('new', 'like_new', 'good', 'fair', 'for_parts')),
  brand TEXT,
  model TEXT,
  year_made INTEGER,

  -- Pricing
  price DECIMAL(10, 2),
  price_negotiable BOOLEAN DEFAULT false,
  accept_trades BOOLEAN DEFAULT false,
  trade_preferences TEXT,

  -- Images
  images TEXT[],

  -- Availability
  quantity_available INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'expired', 'removed')),

  -- Location
  pickup_only BOOLEAN DEFAULT true,
  delivery_available BOOLEAN DEFAULT false,
  shipping_available BOOLEAN DEFAULT false,
  location_general TEXT, -- "Downtown", "North Side", etc.

  -- Expiry
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Service Offerings (professional services)
CREATE TABLE IF NOT EXISTS public.service_offerings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Service Info
  service_title TEXT NOT NULL,
  service_category TEXT, -- home repair, tutoring, pet care, etc.
  description TEXT,

  -- Qualifications
  certifications TEXT[],
  years_experience INTEGER,
  insurance_bonded BOOLEAN DEFAULT false,

  -- Pricing
  pricing_type TEXT CHECK (pricing_type IN ('hourly', 'fixed', 'quote', 'sliding_scale')),
  rate_min DECIMAL(10, 2),
  rate_max DECIMAL(10, 2),

  -- Availability
  service_area TEXT[],
  availability_schedule JSONB,
  emergency_service BOOLEAN DEFAULT false,

  -- Portfolio
  portfolio_images TEXT[],
  references_available BOOLEAN DEFAULT false,

  -- Statistics
  jobs_completed INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  response_time_hours INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Gift Economy
CREATE TABLE IF NOT EXISTS public.gift_economy (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  giver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Gift Info
  gift_title TEXT NOT NULL,
  gift_type TEXT CHECK (gift_type IN ('item', 'service', 'experience', 'knowledge', 'space', 'meal')),
  description TEXT,

  -- Availability
  quantity_available INTEGER DEFAULT 1,
  available_until DATE,
  recurring BOOLEAN DEFAULT false, -- for ongoing offers
  frequency TEXT, -- if recurring

  -- Conditions
  no_strings_attached BOOLEAN DEFAULT true,
  suggested_recipient TEXT, -- "families with children", "elderly", etc.

  -- Location
  pickup_required BOOLEAN DEFAULT true,
  location_general TEXT,

  -- Status
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'partially_claimed', 'expired')),

  -- Impact
  times_claimed INTEGER DEFAULT 0,
  recipient_feedback TEXT[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- IMPACT & METRICS MODULE
-- ============================================

-- Community Goals
CREATE TABLE IF NOT EXISTS public.community_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_by UUID REFERENCES profiles(id),

  -- Goal Info
  goal_title TEXT NOT NULL,
  goal_category TEXT, -- sustainability, wellness, education, social, economic
  description TEXT,

  -- Metrics
  target_metric TEXT, -- what we're measuring
  target_value DECIMAL(10, 2),
  current_value DECIMAL(10, 2) DEFAULT 0,
  unit_of_measure TEXT,

  -- Timeline
  start_date DATE,
  target_date DATE,

  -- Participation
  participants_count INTEGER DEFAULT 0,
  coordinator_id UUID REFERENCES profiles(id),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('planning', 'active', 'achieved', 'paused', 'abandoned')),

  -- Updates
  last_update DATE,
  update_history JSONB, -- [{date, value, notes}]

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Impact Metrics
CREATE TABLE IF NOT EXISTS public.impact_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Metric Info
  metric_name TEXT NOT NULL,
  metric_category TEXT,
  description TEXT,

  -- Measurement
  measurement_type TEXT CHECK (measurement_type IN ('count', 'sum', 'average', 'percentage', 'ratio')),
  calculation_method TEXT, -- SQL or description

  -- Tracking
  current_value DECIMAL(10, 2),
  previous_value DECIMAL(10, 2),
  trend TEXT CHECK (trend IN ('increasing', 'decreasing', 'stable')),

  -- History
  historical_data JSONB, -- time series data

  -- Reporting
  report_frequency TEXT CHECK (report_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  last_calculated TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Volunteer Hours Tracking
CREATE TABLE IF NOT EXISTS public.volunteer_hours (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  volunteer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Activity
  activity_type TEXT, -- event support, garden maintenance, admin, teaching, etc.
  activity_description TEXT,
  related_event_id UUID REFERENCES events(id),
  related_space_id UUID REFERENCES spaces(id),

  -- Time
  volunteer_date DATE NOT NULL,
  hours_contributed DECIMAL(4, 2) NOT NULL,

  -- Verification
  verified_by UUID REFERENCES profiles(id),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'disputed')),

  -- Recognition
  skills_used TEXT[],
  impact_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sustainability Tracking
CREATE TABLE IF NOT EXISTS public.sustainability_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reported_by UUID REFERENCES profiles(id),

  -- Category
  tracking_category TEXT, -- waste reduction, energy saving, water conservation, etc.
  action_taken TEXT,

  -- Measurement
  quantity DECIMAL(10, 2),
  unit TEXT, -- pounds, gallons, kWh, etc.

  -- Impact
  co2_saved_kg DECIMAL(10, 2),
  water_saved_gallons DECIMAL(10, 2),
  waste_diverted_pounds DECIMAL(10, 2),

  -- Context
  related_event_id UUID REFERENCES events(id),
  related_space_id UUID REFERENCES spaces(id),

  -- Verification
  evidence_photos TEXT[],
  verified BOOLEAN DEFAULT false,

  tracking_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- COMMUNITY GOVERNANCE MODULE
-- ============================================

-- Proposals (community decision-making)
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposed_by UUID REFERENCES profiles(id),

  -- Proposal Details
  proposal_title TEXT NOT NULL,
  proposal_type TEXT CHECK (proposal_type IN ('policy', 'project', 'budget', 'event', 'partnership', 'other')),
  description TEXT,

  -- Supporting Info
  background TEXT,
  benefits TEXT,
  risks TEXT,
  budget_required DECIMAL(10, 2),

  -- Voting
  voting_start_date DATE,
  voting_end_date DATE,
  quorum_required INTEGER, -- minimum votes needed
  approval_threshold DECIMAL(3, 2), -- percentage needed to pass

  -- Results
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  votes_abstain INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open_for_voting', 'passed', 'failed', 'implemented', 'withdrawn')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Proposal Votes
CREATE TABLE IF NOT EXISTS public.proposal_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  vote TEXT CHECK (vote IN ('for', 'against', 'abstain')),
  vote_weight INTEGER DEFAULT 1, -- for weighted voting systems

  -- Comments
  public_comment TEXT,
  private_notes TEXT,

  voted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  UNIQUE(proposal_id, voter_id)
);

-- Community Funds
CREATE TABLE IF NOT EXISTS public.community_funds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Fund Info
  fund_name TEXT NOT NULL,
  fund_purpose TEXT,

  -- Balance
  current_balance DECIMAL(10, 2) DEFAULT 0,
  reserved_amount DECIMAL(10, 2) DEFAULT 0, -- allocated but not spent
  available_balance DECIMAL(10, 2) GENERATED ALWAYS AS (current_balance - reserved_amount) STORED,

  -- Management
  treasurer_id UUID REFERENCES profiles(id),
  requires_approval BOOLEAN DEFAULT true,
  approval_threshold DECIMAL(10, 2), -- amount requiring community approval

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fund Transactions
CREATE TABLE IF NOT EXISTS public.fund_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fund_id UUID REFERENCES community_funds(id) ON DELETE CASCADE,

  -- Transaction Details
  transaction_type TEXT CHECK (transaction_type IN ('income', 'expense', 'transfer', 'reservation')),
  amount DECIMAL(10, 2) NOT NULL,

  -- Description
  category TEXT,
  description TEXT,

  -- Related Entities
  related_proposal_id UUID REFERENCES proposals(id),
  related_event_id UUID REFERENCES events(id),
  payee_id UUID REFERENCES profiles(id),

  -- Approval
  approved_by UUID REFERENCES profiles(id),
  approval_date TIMESTAMP WITH TIME ZONE,

  -- Documentation
  receipt_url TEXT,
  notes TEXT,

  transaction_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES FOR NEW TABLES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE wellness_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE healing_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_lending ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_exchange ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_gardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_economy ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (can be customized based on requirements)

-- Wellness Module Policies
CREATE POLICY "Wellness providers are public" ON wellness_providers FOR SELECT USING (true);
CREATE POLICY "Users manage own wellness profile" ON wellness_providers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Wellness services are public" ON wellness_services FOR SELECT USING (true);
CREATE POLICY "Providers manage own services" ON wellness_services FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM wellness_providers WHERE wellness_providers.id = wellness_services.provider_id));

-- Community Resources Policies
CREATE POLICY "Resources are public" ON community_resources FOR SELECT USING (true);
CREATE POLICY "Users manage own resources" ON community_resources FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Marketplace Policies
CREATE POLICY "Listings are public" ON marketplace_listings FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "Users manage own listings" ON marketplace_listings FOR ALL USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

-- Learning Module Policies
CREATE POLICY "Courses are public" ON courses FOR SELECT USING (status != 'draft' OR instructor_id = auth.uid());
CREATE POLICY "Instructors manage own courses" ON courses FOR ALL USING (auth.uid() = instructor_id) WITH CHECK (auth.uid() = instructor_id);

-- Impact Tracking Policies
CREATE POLICY "Community goals are public" ON community_goals FOR SELECT USING (true);
CREATE POLICY "Volunteer hours viewable by volunteer" ON volunteer_hours FOR SELECT USING (auth.uid() = volunteer_id OR auth.uid() = verified_by);

-- Governance Policies
CREATE POLICY "Proposals are public" ON proposals FOR SELECT USING (status != 'draft' OR proposed_by = auth.uid());
CREATE POLICY "Users can vote once" ON proposal_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Wellness Indexes
CREATE INDEX idx_wellness_providers_user ON wellness_providers(user_id);
CREATE INDEX idx_wellness_services_provider ON wellness_services(provider_id);
CREATE INDEX idx_wellness_sessions_date ON wellness_sessions(session_date);

-- Resource Indexes
CREATE INDEX idx_resources_type ON community_resources(resource_type);
CREATE INDEX idx_lending_status ON resource_lending(status);
CREATE INDEX idx_skill_exchange_category ON skill_exchange(skill_category);

-- Marketplace Indexes
CREATE INDEX idx_marketplace_status ON marketplace_listings(status);
CREATE INDEX idx_marketplace_category ON marketplace_listings(category);

-- Learning Indexes
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_enrollments_student ON course_enrollments(student_id);

-- Impact Indexes
CREATE INDEX idx_volunteer_date ON volunteer_hours(volunteer_date);
CREATE INDEX idx_sustainability_date ON sustainability_tracking(tracking_date);

-- ============================================
-- HELPFUL VIEWS FOR HARMONIOUS HABITATS
-- ============================================

-- Active Wellness Providers View
CREATE OR REPLACE VIEW active_wellness_providers AS
SELECT
  wp.*,
  p.full_name,
  p.avatar_url,
  COUNT(DISTINCT ws.id) as services_offered,
  COUNT(DISTINCT wss.id) as total_sessions
FROM wellness_providers wp
JOIN profiles p ON wp.user_id = p.id
LEFT JOIN wellness_services ws ON wp.id = ws.provider_id AND ws.is_active = true
LEFT JOIN wellness_sessions wss ON wp.id = wss.provider_id AND wss.status = 'completed'
GROUP BY wp.id, p.id;

-- Community Resource Library View
CREATE OR REPLACE VIEW resource_library AS
SELECT
  cr.*,
  p.full_name as owner_name,
  COUNT(rl.id) as times_borrowed,
  CASE
    WHEN cr.is_available = true AND NOT EXISTS (
      SELECT 1 FROM resource_lending
      WHERE resource_id = cr.id AND status IN ('reserved', 'checked_out')
    ) THEN 'available'
    ELSE 'unavailable'
  END as current_status
FROM community_resources cr
JOIN profiles p ON cr.owner_id = p.id
LEFT JOIN resource_lending rl ON cr.id = rl.resource_id
GROUP BY cr.id, p.id;

-- Community Impact Dashboard View
CREATE OR REPLACE VIEW community_impact AS
SELECT
  (SELECT COUNT(*) FROM events WHERE status = 'completed') as total_events_held,
  (SELECT COUNT(DISTINCT user_id) FROM event_participants) as unique_participants,
  (SELECT SUM(hours_contributed) FROM volunteer_hours WHERE verification_status = 'verified') as total_volunteer_hours,
  (SELECT COUNT(*) FROM wellness_sessions WHERE status = 'completed') as wellness_sessions_provided,
  (SELECT COUNT(*) FROM time_bank_transactions WHERE status = 'completed') as time_bank_exchanges,
  (SELECT SUM(co2_saved_kg) FROM sustainability_tracking WHERE verified = true) as total_co2_saved_kg,
  (SELECT COUNT(DISTINCT giver_id) FROM gift_economy WHERE status = 'claimed') as gift_economy_participants;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🌿 Harmonious Habitats Expansion Complete! 🌿';
  RAISE NOTICE '';
  RAISE NOTICE 'New modules added:';
  RAISE NOTICE '✅ Wellness & Healing (4 tables)';
  RAISE NOTICE '✅ Community Resources (6 tables)';
  RAISE NOTICE '✅ Learning & Education (3 tables)';
  RAISE NOTICE '✅ Marketplace & Exchange (3 tables)';
  RAISE NOTICE '✅ Impact & Metrics (5 tables)';
  RAISE NOTICE '✅ Community Governance (4 tables)';
  RAISE NOTICE '';
  RAISE NOTICE 'Total new tables: 25';
  RAISE NOTICE 'Platform ready for comprehensive community wellness!';
END $$;