/*
  # Fix get_conversations_with_details RPC function

  1. Database Changes
    - Drop and recreate the get_conversations_with_details function
    - Fix column references from user_id to id in profiles table joins
    - Ensure proper data structure is returned for the frontend

  2. Security
    - Maintain existing RLS policies
    - Function runs with invoker's permissions
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_conversations_with_details(uuid);

-- Create the corrected function
CREATE OR REPLACE FUNCTION get_conversations_with_details(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  type text,
  name text,
  event_id uuid,
  space_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  participants jsonb,
  last_message jsonb,
  unread_count bigint
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.type,
    c.name,
    c.event_id,
    c.space_id,
    c.created_at,
    c.updated_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'user_id', cp.user_id,
            'role', cp.role,
            'joined_at', cp.joined_at,
            'user', jsonb_build_object(
              'id', p.id,
              'full_name', p.full_name,
              'username', p.username,
              'avatar_url', p.avatar_url
            )
          )
        )
        FROM conversation_participants cp
        JOIN profiles p ON p.id = cp.user_id
        WHERE cp.conversation_id = c.id
      ),
      '[]'::jsonb
    ) as participants,
    COALESCE(
      (
        SELECT jsonb_build_object(
          'id', m.id,
          'content', m.content,
          'sent_at', m.sent_at,
          'type', m.type,
          'sender_id', m.sender_id,
          'sender', jsonb_build_object(
            'id', sender.id,
            'full_name', sender.full_name,
            'username', sender.username,
            'avatar_url', sender.avatar_url
          )
        )
        FROM messages m
        JOIN profiles sender ON sender.id = m.sender_id
        WHERE m.conversation_id = c.id
          AND m.deleted_at IS NULL
        ORDER BY m.sent_at DESC
        LIMIT 1
      ),
      NULL
    ) as last_message,
    COALESCE(
      (
        SELECT COUNT(*)
        FROM messages m
        LEFT JOIN message_read_status mrs ON mrs.message_id = m.id AND mrs.user_id = p_user_id
        WHERE m.conversation_id = c.id
          AND m.sender_id != p_user_id
          AND m.deleted_at IS NULL
          AND mrs.read_at IS NULL
      ),
      0
    ) as unread_count
  FROM conversations c
  JOIN conversation_participants cp_current ON cp_current.conversation_id = c.id
  WHERE cp_current.user_id = p_user_id
  ORDER BY 
    CASE 
      WHEN (
        SELECT m.sent_at 
        FROM messages m 
        WHERE m.conversation_id = c.id 
          AND m.deleted_at IS NULL 
        ORDER BY m.sent_at DESC 
        LIMIT 1
      ) IS NOT NULL 
      THEN (
        SELECT m.sent_at 
        FROM messages m 
        WHERE m.conversation_id = c.id 
          AND m.deleted_at IS NULL 
        ORDER BY m.sent_at DESC 
        LIMIT 1
      )
      ELSE c.updated_at
    END DESC;
END;
$$;