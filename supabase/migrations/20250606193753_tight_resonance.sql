/*
  # Admin RLS Policies for Full Management Access

  1. New RLS Policies for user_profiles
    - Allow admins to update any user profile (including admin status changes)
    - Allow admins to delete any user profile

  2. New RLS Policies for spaces
    - Allow admins to update any space
    - Allow admins to delete any space

  3. New RLS Policies for invite_codes
    - Allow admins to delete any invite code

  4. New RLS Policies for space_attendees
    - Allow admins to view all attendee relationships
    - Allow admins to remove users from spaces

  These policies enable administrators to perform comprehensive user management,
  space moderation, and invite code management through the admin panel.
*/

-- Admin policies for user_profiles table
CREATE POLICY "Admins can update any user profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

CREATE POLICY "Admins can delete any user profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

-- Admin policies for spaces table
CREATE POLICY "Admins can update any space"
  ON spaces
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

CREATE POLICY "Admins can delete any space"
  ON spaces
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

-- Admin policies for invite_codes table
CREATE POLICY "Admins can delete any invite code"
  ON invite_codes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

-- Admin policies for space_attendees table
CREATE POLICY "Admins can view all space attendees"
  ON space_attendees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

CREATE POLICY "Admins can remove users from spaces"
  ON space_attendees
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

-- Function to promote user to admin (admin-only)
CREATE OR REPLACE FUNCTION promote_user_to_admin(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update target user to admin
  UPDATE user_profiles 
  SET is_admin = true, updated_at = now()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke admin privileges (admin-only)
CREATE OR REPLACE FUNCTION revoke_admin_privileges(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Prevent self-demotion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot revoke your own admin privileges';
  END IF;

  -- Update target user to remove admin
  UPDATE user_profiles 
  SET is_admin = false, updated_at = now()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete user and all related data (admin-only)
CREATE OR REPLACE FUNCTION delete_user_completely(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Prevent self-deletion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- Delete user profile (cascading will handle related data)
  DELETE FROM user_profiles WHERE id = target_user_id;

  -- Delete auth user (this requires service role key in practice)
  -- Note: This would typically be done via a separate admin API call
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;