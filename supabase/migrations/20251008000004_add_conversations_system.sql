-- Conversations System
-- This migration adds proper conversation support for the messaging system

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Conversation details
  name TEXT, -- For named group conversations, null for direct messages
  type TEXT CHECK (type IN ('direct', 'event', 'space', 'group')) NOT NULL DEFAULT 'direct',

  -- Context (for event/space conversations)
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Create conversation_participants table (many-to-many)
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Relationship
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Participant details
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP WITH TIME ZONE,

  -- Read tracking
  last_read_at TIMESTAMP WITH TIME ZONE,

  -- Prevent duplicate participants
  UNIQUE(conversation_id, user_id)
);

-- Add conversation_id to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- Add message status tracking
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_event ON conversations(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_space ON conversations(space_id) WHERE space_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
-- Users can view conversations they're part of
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.left_at IS NULL
    )
  );

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Will be restricted by participant logic

-- RLS Policies for conversation_participants
-- Users can view participants of their conversations
CREATE POLICY "Users can view conversation participants" ON conversation_participants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
    )
  );

-- Users can add themselves to conversations (through application logic)
CREATE POLICY "Users can add participants" ON conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Controlled by application logic

-- Users can leave conversations (update their left_at)
CREATE POLICY "Users can leave conversations" ON conversation_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Update messages RLS to work with conversations
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT TO authenticated
  USING (
    -- Direct messages (legacy support)
    (conversation_id IS NULL AND (auth.uid() = sender_id OR auth.uid() = recipient_id))
    OR
    -- Conversation messages
    (conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.left_at IS NULL
    ))
  );

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    (
      -- Direct messages (legacy)
      (conversation_id IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = recipient_id))
      OR
      -- Conversation messages
      (conversation_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = auth.uid()
        AND conversation_participants.left_at IS NULL
      ))
    )
  );

-- Create trigger to update updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get conversations with details
CREATE OR REPLACE FUNCTION get_conversations_with_details(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  event_id UUID,
  space_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count BIGINT,
  participants JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.type,
    c.event_id,
    c.space_id,
    c.created_at,
    (
      SELECT m.content
      FROM messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) as last_message,
    (
      SELECT m.created_at
      FROM messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) as last_message_at,
    (
      SELECT COUNT(*)
      FROM messages m
      LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = p_user_id
      WHERE m.conversation_id = c.id
      AND m.sender_id != p_user_id
      AND (m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamp))
    ) as unread_count,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'user_id', cp.user_id,
          'role', cp.role,
          'joined_at', cp.joined_at,
          'user', jsonb_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
          )
        )
      )
      FROM conversation_participants cp
      JOIN profiles p ON p.id = cp.user_id
      WHERE cp.conversation_id = c.id
      AND cp.left_at IS NULL
    ) as participants
  FROM conversations c
  WHERE EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = c.id
    AND conversation_participants.user_id = p_user_id
    AND conversation_participants.left_at IS NULL
  )
  ORDER BY last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or get direct conversation between two users
CREATE OR REPLACE FUNCTION create_or_get_direct_conversation(
  p_user_a UUID,
  p_user_b UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Check if conversation already exists
  SELECT c.id INTO v_conversation_id
  FROM conversations c
  WHERE c.type = 'direct'
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp1
    WHERE cp1.conversation_id = c.id
    AND cp1.user_id = p_user_a
    AND cp1.left_at IS NULL
  )
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = c.id
    AND cp2.user_id = p_user_b
    AND cp2.left_at IS NULL
  )
  AND (
    SELECT COUNT(*) FROM conversation_participants
    WHERE conversation_id = c.id
    AND left_at IS NULL
  ) = 2
  LIMIT 1;

  -- If conversation doesn't exist, create it
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (type)
    VALUES ('direct')
    RETURNING id INTO v_conversation_id;

    -- Add participants
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES
      (v_conversation_id, p_user_a),
      (v_conversation_id, p_user_b);
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = CURRENT_TIMESTAMP
  WHERE conversation_id = p_conversation_id
  AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count for user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT m.conversation_id)::INTEGER INTO v_count
  FROM messages m
  LEFT JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = p_user_id
  WHERE m.sender_id != p_user_id
  AND (m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamp))
  AND EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = m.conversation_id
    AND user_id = p_user_id
    AND left_at IS NULL
  );

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE conversations IS 'Conversations for messaging system - supports direct, group, event, and space chats';
COMMENT ON TABLE conversation_participants IS 'Many-to-many relationship between conversations and users';
COMMENT ON FUNCTION get_conversations_with_details IS 'Returns all conversations for a user with last message, unread count, and participants';
COMMENT ON FUNCTION create_or_get_direct_conversation IS 'Creates a new direct conversation or returns existing one between two users';
COMMENT ON FUNCTION mark_conversation_as_read IS 'Updates the last_read_at timestamp for a user in a conversation';
COMMENT ON FUNCTION get_unread_message_count IS 'Returns the total number of conversations with unread messages for a user';
