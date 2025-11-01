-- Migration: Add community features for spaces
-- Date: 2025-11-01
-- Description: Adds community request system where approved members can make requests
--              Includes member management, requests (help, resources, skills, events)
--              and AI writing assistant support

-- Add community features toggle to spaces
ALTER TABLE spaces
ADD COLUMN IF NOT EXISTS community_features_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN spaces.community_features_enabled IS 'Enable community request system for this space';

-- Create space_members table for community membership
CREATE TABLE IF NOT EXISTS space_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relationships
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Membership details
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),

  -- Application/approval
  application_message TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Metadata
  last_active_at TIMESTAMPTZ,
  contributions_count INTEGER DEFAULT 0,
  requests_count INTEGER DEFAULT 0,

  -- Unique constraint: one membership per user per space
  UNIQUE(space_id, user_id)
);

-- Create community_requests table
CREATE TABLE IF NOT EXISTS community_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relationships
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id),

  -- Request details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('help_needed', 'resource_request', 'skill_sharing', 'event_idea')),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'fulfilled', 'declined', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Privacy
  is_private BOOLEAN DEFAULT false,

  -- Fulfillment details
  fulfilled_by UUID REFERENCES profiles(id),
  fulfilled_at TIMESTAMPTZ,
  fulfillment_notes TEXT,

  -- Interaction metrics
  views_count INTEGER DEFAULT 0,
  responses_count INTEGER DEFAULT 0,
  upvotes_count INTEGER DEFAULT 0,

  -- AI assistance tracking
  ai_assisted BOOLEAN DEFAULT false,
  ai_suggestions JSONB DEFAULT '[]'::jsonb
);

-- Create community_request_responses table
CREATE TABLE IF NOT EXISTS community_request_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relationships
  request_id UUID NOT NULL REFERENCES community_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Response content
  message TEXT NOT NULL,
  is_offer_to_help BOOLEAN DEFAULT false,

  -- AI assistance
  ai_assisted BOOLEAN DEFAULT false
);

-- Create community_request_upvotes table
CREATE TABLE IF NOT EXISTS community_request_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relationships
  request_id UUID NOT NULL REFERENCES community_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Unique constraint: one upvote per user per request
  UNIQUE(request_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_space_members_space_id ON space_members(space_id);
CREATE INDEX IF NOT EXISTS idx_space_members_user_id ON space_members(user_id);
CREATE INDEX IF NOT EXISTS idx_space_members_status ON space_members(status);

CREATE INDEX IF NOT EXISTS idx_community_requests_space_id ON community_requests(space_id);
CREATE INDEX IF NOT EXISTS idx_community_requests_requester_id ON community_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_community_requests_status ON community_requests(status);
CREATE INDEX IF NOT EXISTS idx_community_requests_category ON community_requests(category);
CREATE INDEX IF NOT EXISTS idx_community_requests_created_at ON community_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_request_responses_request_id ON community_request_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_community_request_upvotes_request_id ON community_request_upvotes(request_id);

-- Add comments for documentation
COMMENT ON TABLE space_members IS 'Community members for spaces with community features enabled';
COMMENT ON TABLE community_requests IS 'Community requests for help, resources, skills, and event ideas';
COMMENT ON TABLE community_request_responses IS 'Responses and offers to help on community requests';
COMMENT ON TABLE community_request_upvotes IS 'Upvotes on community requests to show community interest';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_space_members_updated_at
  BEFORE UPDATE ON space_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_requests_updated_at
  BEFORE UPDATE ON community_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_request_responses_updated_at
  BEFORE UPDATE ON community_request_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update request response count
CREATE OR REPLACE FUNCTION update_request_responses_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_requests
    SET responses_count = responses_count + 1
    WHERE id = NEW.request_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_requests
    SET responses_count = responses_count - 1
    WHERE id = OLD.request_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for response count
CREATE TRIGGER update_request_responses_count_trigger
  AFTER INSERT OR DELETE ON community_request_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_request_responses_count();

-- Create function to update request upvote count
CREATE OR REPLACE FUNCTION update_request_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_requests
    SET upvotes_count = upvotes_count + 1
    WHERE id = NEW.request_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_requests
    SET upvotes_count = upvotes_count - 1
    WHERE id = OLD.request_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for upvote count
CREATE TRIGGER update_request_upvotes_count_trigger
  AFTER INSERT OR DELETE ON community_request_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION update_request_upvotes_count();

-- Create function to update member contribution counts
CREATE OR REPLACE FUNCTION update_member_contribution_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE space_members
    SET contributions_count = contributions_count + 1
    WHERE space_id = NEW.space_id AND user_id = NEW.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contribution count (on responses)
CREATE TRIGGER update_member_contribution_count_trigger
  AFTER INSERT ON community_request_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_member_contribution_count();

-- Create function to update member request counts
CREATE OR REPLACE FUNCTION update_member_request_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE space_members
    SET requests_count = requests_count + 1
    WHERE space_id = NEW.space_id AND user_id = NEW.requester_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for request count
CREATE TRIGGER update_member_request_count_trigger
  AFTER INSERT ON community_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_member_request_count();

-- Enable Row Level Security
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_request_upvotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for space_members
CREATE POLICY "Users can view approved members of public spaces"
  ON space_members FOR SELECT
  USING (status = 'approved' OR auth.uid() IN (
    SELECT owner_id FROM spaces WHERE id = space_id
  ));

CREATE POLICY "Users can view their own membership applications"
  ON space_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can apply for space membership"
  ON space_members FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Space owners can manage members"
  ON space_members FOR ALL
  USING (auth.uid() IN (
    SELECT owner_id FROM spaces WHERE id = space_id
  ));

-- RLS Policies for community_requests
CREATE POLICY "Approved members can view public requests"
  ON community_requests FOR SELECT
  USING (
    is_private = false AND
    auth.uid() IN (
      SELECT user_id FROM space_members
      WHERE space_id = community_requests.space_id AND status = 'approved'
    )
  );

CREATE POLICY "Space owners and requesters can view private requests"
  ON community_requests FOR SELECT
  USING (
    is_private = true AND (
      auth.uid() = requester_id OR
      auth.uid() IN (
        SELECT owner_id FROM spaces WHERE id = space_id
      )
    )
  );

CREATE POLICY "Approved members can create requests"
  ON community_requests FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id AND
    auth.uid() IN (
      SELECT user_id FROM space_members
      WHERE space_id = community_requests.space_id AND status = 'approved'
    )
  );

CREATE POLICY "Requesters can update their own requests"
  ON community_requests FOR UPDATE
  USING (auth.uid() = requester_id);

CREATE POLICY "Space owners can update any request"
  ON community_requests FOR UPDATE
  USING (auth.uid() IN (
    SELECT owner_id FROM spaces WHERE id = space_id
  ));

-- RLS Policies for community_request_responses
CREATE POLICY "Anyone who can see the request can see responses"
  ON community_request_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_requests
      WHERE id = request_id
    )
  );

CREATE POLICY "Approved members can respond to requests"
  ON community_request_responses FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (
      SELECT user_id FROM space_members sm
      JOIN community_requests cr ON cr.space_id = sm.space_id
      WHERE cr.id = request_id AND sm.status = 'approved'
    )
  );

-- RLS Policies for community_request_upvotes
CREATE POLICY "Anyone who can see the request can see upvotes"
  ON community_request_upvotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_requests
      WHERE id = request_id
    )
  );

CREATE POLICY "Approved members can upvote requests"
  ON community_request_upvotes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (
      SELECT user_id FROM space_members sm
      JOIN community_requests cr ON cr.space_id = sm.space_id
      WHERE cr.id = request_id AND sm.status = 'approved'
    )
  );

CREATE POLICY "Users can remove their own upvotes"
  ON community_request_upvotes FOR DELETE
  USING (auth.uid() = user_id);
