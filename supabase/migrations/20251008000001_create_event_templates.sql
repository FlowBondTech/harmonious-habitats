-- Create event_templates table for saving reusable event configurations

CREATE TABLE IF NOT EXISTS event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL, -- Stores all the event configuration
  category TEXT,
  is_favorite BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_templates_user_id ON event_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_event_templates_category ON event_templates(category);
CREATE INDEX IF NOT EXISTS idx_event_templates_is_favorite ON event_templates(is_favorite);
CREATE INDEX IF NOT EXISTS idx_event_templates_created_at ON event_templates(created_at DESC);

-- Enable RLS
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own templates"
  ON event_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON event_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON event_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON event_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_event_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_templates_updated_at_trigger
  BEFORE UPDATE ON event_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_event_templates_updated_at();

-- Add column to events table to track which template was used (if any)
ALTER TABLE events ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES event_templates(id) ON DELETE SET NULL;