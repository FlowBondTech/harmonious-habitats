-- =====================================================
-- Liability Agreement System for Space Creators
-- Supports Day and Overnight Retreat Agreements
-- =====================================================

-- Agreement Templates Table
-- Stores pre-built templates for day and overnight agreements
CREATE TABLE IF NOT EXISTS agreement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('day', 'overnight')),
  description TEXT,
  content TEXT NOT NULL, -- Template with placeholders like {{space_name}}, {{date}}, etc.
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Space Liability Agreements Table
-- Stores agreements created by space owners for their spaces
CREATE TABLE IF NOT EXISTS space_liability_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id),
  agreement_type TEXT NOT NULL CHECK (agreement_type IN ('day', 'overnight')),
  template_id UUID REFERENCES agreement_templates(id),

  -- Agreement content (can be customized from template)
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- Additional fields
  requires_signature BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_space_agreement_type UNIQUE(space_id, agreement_type)
);

-- Event Liability Agreements Table
-- Links specific events to agreements (many-to-many)
CREATE TABLE IF NOT EXISTS event_liability_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  agreement_id UUID NOT NULL REFERENCES space_liability_agreements(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_event_agreement UNIQUE(event_id, agreement_id)
);

-- Participant Agreement Signatures Table
-- Tracks which participants have signed agreements
CREATE TABLE IF NOT EXISTS participant_agreement_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  agreement_id UUID NOT NULL REFERENCES space_liability_agreements(id),
  participant_id UUID NOT NULL REFERENCES profiles(id),

  -- Signature details
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  signature_data JSONB, -- Can store digital signature, IP address, etc.
  agreed_to_terms BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_participant_signature UNIQUE(event_id, agreement_id, participant_id)
);

-- Add retreat fields to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_retreat BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS retreat_type TEXT CHECK (retreat_type IN ('day', 'overnight', 'multi-day')),
  ADD COLUMN IF NOT EXISTS retreat_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retreat_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accommodation_provided BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS meals_included TEXT[] DEFAULT '{}', -- ['breakfast', 'lunch', 'dinner']
  ADD COLUMN IF NOT EXISTS retreat_itinerary JSONB; -- Structured schedule for retreat

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_space_agreements_space_id ON space_liability_agreements(space_id);
CREATE INDEX IF NOT EXISTS idx_space_agreements_type ON space_liability_agreements(agreement_type);
CREATE INDEX IF NOT EXISTS idx_event_agreements_event_id ON event_liability_agreements(event_id);
CREATE INDEX IF NOT EXISTS idx_signatures_event_id ON participant_agreement_signatures(event_id);
CREATE INDEX IF NOT EXISTS idx_signatures_participant_id ON participant_agreement_signatures(participant_id);
CREATE INDEX IF NOT EXISTS idx_events_retreat ON events(is_retreat) WHERE is_retreat = true;

-- Insert default agreement templates
INSERT INTO agreement_templates (name, type, description, content, is_default) VALUES
(
  'Day Retreat Liability Agreement',
  'day',
  'Standard liability waiver for single-day retreat events',
  E'# Liability Waiver and Release Agreement\n## Day Retreat at {{space_name}}\n\n**Event Date:** {{event_date}}\n**Location:** {{space_address}}\n**Participant Name:** {{participant_name}}\n\n### Assumption of Risk\nI understand that participation in {{event_name}} involves certain inherent risks, including but not limited to physical activity, wellness practices, and group interactions. I voluntarily assume all risks associated with my participation.\n\n### Release of Liability\nIn consideration of being permitted to participate in this retreat, I hereby release, waive, and discharge {{space_name}}, its owners, facilitators, and staff from any and all liability for injury, illness, death, or property damage arising from my participation.\n\n### Medical Clearance\nI certify that I am physically and mentally capable of participating in this retreat. I agree to inform the facilitators of any medical conditions, injuries, or limitations that may affect my participation.\n\n### Photo/Video Release\nI consent to the use of photographs and videos taken during the retreat for promotional purposes unless I explicitly opt out.\n\n### Code of Conduct\nI agree to:\n- Respect all participants, facilitators, and the space\n- Follow all safety guidelines provided\n- Maintain confidentiality of other participants\n- Arrive on time and participate fully\n- Leave the space as I found it\n\n### Cancellation Policy\n{{cancellation_policy}}\n\n---\n\n**Participant Signature:** _________________________\n**Date:** _________________________\n\n**Emergency Contact:** {{emergency_contact_name}}\n**Emergency Phone:** {{emergency_contact_phone}}',
  true
),
(
  'Overnight Retreat Liability Agreement',
  'overnight',
  'Comprehensive liability waiver for overnight/multi-day retreat events',
  E'# Liability Waiver and Release Agreement\n## Overnight Retreat at {{space_name}}\n\n**Event Dates:** {{retreat_start_date}} - {{retreat_end_date}}\n**Location:** {{space_address}}\n**Participant Name:** {{participant_name}}\n\n### Assumption of Risk\nI understand that participation in {{event_name}} involves extended stay, overnight accommodations, and various activities throughout the retreat period. I acknowledge the inherent risks including but not limited to:\n- Physical activities and wellness practices\n- Shared accommodation facilities\n- Meal preparation and consumption\n- Extended group interactions\n- Travel to and from the location\n\nI voluntarily assume all risks associated with my participation.\n\n### Release of Liability\nIn consideration of being permitted to participate in this overnight retreat, I hereby release, waive, and discharge {{space_name}}, its owners, operators, facilitators, staff, and volunteers from any and all liability, claims, demands, or causes of action for injury, illness, death, or property damage arising from my participation.\n\n### Medical Clearance and Conditions\nI certify that:\n- I am in good physical and mental health\n- I have no medical conditions that would prevent safe participation\n- I will inform facilitators of any allergies, dietary restrictions, or medical needs\n- I carry adequate health insurance\n- I authorize emergency medical treatment if necessary\n\n### Accommodation Acknowledgment\nI understand that:\n- Accommodations may be shared unless specified otherwise\n- I am responsible for my personal belongings\n- I will respect quiet hours and shared spaces\n- {{accommodation_details}}\n\n### Food and Dietary Needs\n- Dietary restrictions: {{dietary_restrictions}}\n- Allergies: {{allergies}}\n- I understand meals provided are: {{meals_included}}\n\n### Photo/Video Release\nI consent to the use of photographs and videos taken during the retreat for promotional purposes unless I explicitly opt out below.\n☐ I opt out of photo/video usage\n\n### Code of Conduct\nI agree to:\n- Respect all participants, facilitators, and the space at all times\n- Follow all safety guidelines and retreat schedule\n- Maintain confidentiality of other participants\n- Refrain from alcohol and non-prescribed substances unless explicitly allowed\n- Participate in community responsibilities (cleanup, meal prep, etc.)\n- Leave the space better than I found it\n- Honor the retreat container and sacred space\n\n### Cancellation and Refund Policy\n{{cancellation_policy}}\n\n### Retreat Schedule Acknowledgment\nI understand the retreat runs from check-in at {{checkin_time}} on {{retreat_start_date}} to check-out at {{checkout_time}} on {{retreat_end_date}}.\n\n### Personal Responsibility\nI agree to:\n- Arrive on time and stay for the full retreat duration\n- Bring required items: {{packing_list}}\n- Follow the retreat schedule and participate in all activities unless modified by facilitators\n- Respect the land and local community\n\n---\n\n**Participant Signature:** _________________________\n**Date:** _________________________\n**Print Name:** _________________________\n\n### Emergency Contact Information\n**Name:** {{emergency_contact_name}}\n**Relationship:** {{emergency_contact_relationship}}\n**Phone:** {{emergency_contact_phone}}\n**Alternate Phone:** {{emergency_contact_alternate}}\n\n### Insurance Information\n**Provider:** _________________________\n**Policy Number:** _________________________\n\n---\n\n*This agreement shall be binding upon me, my heirs, executors, administrators, and assigns.*',
  true
);

-- RLS Policies

-- Space Liability Agreements Policies
ALTER TABLE space_liability_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Space creators can create agreements for their spaces"
  ON space_liability_agreements FOR INSERT
  WITH CHECK (
    creator_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_liability_agreements.space_id
      AND spaces.space_holder_id = auth.uid()
    )
  );

CREATE POLICY "Space creators can update their agreements"
  ON space_liability_agreements FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Space creators can delete their agreements"
  ON space_liability_agreements FOR DELETE
  USING (creator_id = auth.uid());

CREATE POLICY "Anyone can view active agreements"
  ON space_liability_agreements FOR SELECT
  USING (is_active = true);

-- Agreement Templates Policies
ALTER TABLE agreement_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates"
  ON agreement_templates FOR SELECT
  USING (is_active = true);

-- Event Liability Agreements Policies
ALTER TABLE event_liability_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event creators can manage event agreements"
  ON event_liability_agreements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_liability_agreements.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Participants can view required agreements"
  ON event_liability_agreements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_participants.event_id = event_liability_agreements.event_id
      AND event_participants.user_id = auth.uid()
    )
  );

-- Participant Signatures Policies
ALTER TABLE participant_agreement_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can sign agreements"
  ON participant_agreement_signatures FOR INSERT
  WITH CHECK (participant_id = auth.uid());

CREATE POLICY "Users can view their own signatures"
  ON participant_agreement_signatures FOR SELECT
  USING (participant_id = auth.uid());

CREATE POLICY "Event organizers can view all signatures for their events"
  ON participant_agreement_signatures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = participant_agreement_signatures.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Add retreat category to existing categories
-- Note: This assumes you have a categories or event_types concept
-- If categories are hardcoded in the frontend, update the CreateEvent.tsx component

COMMENT ON TABLE agreement_templates IS 'Pre-built liability agreement templates for day and overnight retreats';
COMMENT ON TABLE space_liability_agreements IS 'Liability agreements created by space owners for their spaces';
COMMENT ON TABLE event_liability_agreements IS 'Links events to required liability agreements';
COMMENT ON TABLE participant_agreement_signatures IS 'Tracks participant signatures on liability agreements';
