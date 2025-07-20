-- Create messages table for direct messaging between users
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Participants
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Message content
  content TEXT NOT NULL,
  
  -- Status
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Context (optional - for messages about spaces or events)
  context_type TEXT CHECK (context_type IN ('space', 'event', 'general')),
  context_id UUID,
  
  -- Ensure sender and recipient are different
  CONSTRAINT different_participants CHECK (sender_id != recipient_id)
);

-- Create indexes for performance
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(recipient_id) WHERE read_at IS NULL;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see messages they sent or received
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT 
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id
  );

-- Users can send messages
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = recipient_id
    )
  );

-- Users can update their own messages (for marking as read)
CREATE POLICY "Recipients can mark messages as read" ON messages
  FOR UPDATE 
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for conversation threads (latest message per user pair)
CREATE VIEW conversation_threads AS
SELECT DISTINCT ON (
  LEAST(sender_id, recipient_id),
  GREATEST(sender_id, recipient_id)
)
  m.*,
  s.full_name as sender_name,
  s.avatar_url as sender_avatar,
  r.full_name as recipient_name,
  r.avatar_url as recipient_avatar,
  CASE 
    WHEN m.sender_id = auth.uid() THEN r.id
    ELSE s.id
  END as other_user_id,
  CASE 
    WHEN m.sender_id = auth.uid() THEN r.full_name
    ELSE s.full_name
  END as other_user_name,
  CASE 
    WHEN m.sender_id = auth.uid() THEN r.avatar_url
    ELSE s.avatar_url
  END as other_user_avatar
FROM messages m
JOIN profiles s ON m.sender_id = s.id
JOIN profiles r ON m.recipient_id = r.id
WHERE 
  auth.uid() = m.sender_id OR 
  auth.uid() = m.recipient_id
ORDER BY 
  LEAST(sender_id, recipient_id),
  GREATEST(sender_id, recipient_id),
  created_at DESC;