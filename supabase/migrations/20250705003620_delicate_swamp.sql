/*
  # Messaging System Enhancements

  1. New Tables
    - `message_attachments` - Store file and image attachments for messages
    - `message_reactions` - Store emoji reactions to messages
    - `conversation_settings` - Store conversation-specific settings
    - `message_read_status` - Track read status for each message by each participant

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for data access

  3. Changes
    - Add new fields to existing messaging tables
    - Add functions for real-time messaging features
*/

-- Message attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id, reaction)
);

-- Conversation settings table
CREATE TABLE IF NOT EXISTS conversation_settings (
  conversation_id UUID PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
  muted BOOLEAN DEFAULT FALSE,
  pinned BOOLEAN DEFAULT FALSE,
  theme TEXT,
  custom_name TEXT,
  notification_level TEXT DEFAULT 'all' CHECK (notification_level IN ('all', 'mentions', 'none')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Message read status table (more detailed than just last_read_message_id)
CREATE TABLE IF NOT EXISTS message_read_status (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

-- Add typing indicator field to conversation_participants
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS typing_at TIMESTAMPTZ;

-- Add is_pinned field to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Add reply_to_id field to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;

-- Create policies for message_attachments
CREATE POLICY "Users can view message attachments in their conversations" ON message_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_attachments.message_id
      AND cp.user_id = auth.uid()
    )
  );

-- Create policies for message_reactions
CREATE POLICY "Users can view message reactions in their conversations" ON message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_reactions.message_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions to messages in their conversations" ON message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_reactions.message_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their own reactions" ON message_reactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Create policies for conversation_settings
CREATE POLICY "Users can view settings for their conversations" ON conversation_settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_settings.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update settings for their conversations" ON conversation_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_settings.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

-- Create policies for message_read_status
CREATE POLICY "Users can view read status in their conversations" ON message_read_status
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_read_status.message_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own read status" ON message_read_status
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Update last_read_message_id in conversation_participants
  UPDATE conversation_participants
  SET last_read_message_id = (
    SELECT id FROM messages
    WHERE conversation_id = p_conversation_id
    ORDER BY sent_at DESC
    LIMIT 1
  )
  WHERE conversation_id = p_conversation_id
  AND user_id = p_user_id;
  
  -- Insert read status for all unread messages
  INSERT INTO message_read_status (message_id, user_id)
  SELECT m.id, p_user_id
  FROM messages m
  LEFT JOIN message_read_status mrs ON m.id = mrs.message_id AND mrs.user_id = p_user_id
  WHERE m.conversation_id = p_conversation_id
  AND mrs.message_id IS NULL
  ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(
  p_user_id UUID
)
RETURNS TABLE (
  conversation_id UUID,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.conversation_id,
    COUNT(m.id)::BIGINT AS unread_count
  FROM messages m
  JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
  LEFT JOIN message_read_status mrs ON m.id = mrs.message_id AND mrs.user_id = p_user_id
  WHERE cp.user_id = p_user_id
  AND mrs.message_id IS NULL
  AND m.sender_id != p_user_id
  GROUP BY m.conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create a new conversation
CREATE OR REPLACE FUNCTION create_conversation(
  p_creator_id UUID,
  p_type TEXT,
  p_name TEXT,
  p_participant_ids UUID[],
  p_event_id UUID DEFAULT NULL,
  p_space_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Create the conversation
  INSERT INTO conversations (
    created_by,
    type,
    name,
    event_id,
    space_id,
    created_at,
    updated_at
  ) VALUES (
    p_creator_id,
    p_type,
    p_name,
    p_event_id,
    p_space_id,
    NOW(),
    NOW()
  ) RETURNING id INTO v_conversation_id;
  
  -- Add the creator as a participant
  INSERT INTO conversation_participants (
    conversation_id,
    user_id,
    role,
    joined_at
  ) VALUES (
    v_conversation_id,
    p_creator_id,
    'admin',
    NOW()
  );
  
  -- Add other participants
  IF p_participant_ids IS NOT NULL AND array_length(p_participant_ids, 1) > 0 THEN
    INSERT INTO conversation_participants (
      conversation_id,
      user_id,
      role,
      joined_at
    )
    SELECT 
      v_conversation_id,
      id,
      'member',
      NOW()
    FROM unnest(p_participant_ids) AS id
    WHERE id != p_creator_id
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;
  
  -- Create default conversation settings
  INSERT INTO conversation_settings (
    conversation_id,
    updated_at,
    updated_by
  ) VALUES (
    v_conversation_id,
    NOW(),
    p_creator_id
  );
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get or create direct conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
  p_user_id1 UUID,
  p_user_id2 UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Check if a direct conversation already exists between these users
  SELECT c.id INTO v_conversation_id
  FROM conversations c
  JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
  JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
  WHERE c.type = 'direct'
  AND cp1.user_id = p_user_id1
  AND cp2.user_id = p_user_id2
  LIMIT 1;
  
  -- If no conversation exists, create one
  IF v_conversation_id IS NULL THEN
    v_conversation_id := create_conversation(
      p_user_id1,
      'direct',
      NULL,
      ARRAY[p_user_id2]
    );
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get conversations with latest message and unread count
CREATE OR REPLACE FUNCTION get_conversations_with_details(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  event_id UUID,
  space_id UUID,
  created_by UUID,
  last_message JSONB,
  unread_count BIGINT,
  participants JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH unread_counts AS (
    SELECT * FROM get_unread_message_count(p_user_id)
  ),
  latest_messages AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      jsonb_build_object(
        'id', m.id,
        'content', m.content,
        'sent_at', m.sent_at,
        'sender_id', m.sender_id,
        'type', m.type
      ) AS message_data
    FROM messages m
    JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE cp.user_id = p_user_id
    ORDER BY m.conversation_id, m.sent_at DESC
  ),
  conversation_participants AS (
    SELECT 
      cp.conversation_id,
      jsonb_agg(
        jsonb_build_object(
          'user_id', cp.user_id,
          'role', cp.role,
          'joined_at', cp.joined_at,
          'user', jsonb_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url,
            'verified', p.verified
          )
        )
      ) AS participants_data
    FROM conversation_participants cp
    JOIN profiles p ON cp.user_id = p.id
    GROUP BY cp.conversation_id
  )
  SELECT 
    c.id,
    c.type,
    c.name,
    c.created_at,
    c.updated_at,
    c.event_id,
    c.space_id,
    c.created_by,
    lm.message_data AS last_message,
    COALESCE(uc.unread_count, 0) AS unread_count,
    COALESCE(cp.participants_data, '[]'::jsonb) AS participants
  FROM conversations c
  JOIN conversation_participants cp_user ON c.id = cp_user.conversation_id
  LEFT JOIN latest_messages lm ON c.id = lm.conversation_id
  LEFT JOIN unread_counts uc ON c.id = uc.conversation_id
  LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
  WHERE cp_user.user_id = p_user_id
  ORDER BY COALESCE(lm.message_data->>'sent_at', c.updated_at::text) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON message_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id);