/*
  # Fix Authentication and Profile Issues

  1. Fix RLS policies that may be preventing profile access
  2. Ensure user role assignment works properly
  3. Add better error handling for profile creation
  4. Fix any missing policies
*/

-- Drop and recreate problematic policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Recreate profile policies with better logic
CREATE POLICY "Users can view all profiles" ON profiles 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON profiles 
  FOR UPDATE TO authenticated 
  USING (is_admin(auth.uid()));

-- Fix user roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

CREATE POLICY "Users can view their own roles" ON user_roles 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" ON user_roles 
  FOR SELECT TO authenticated 
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles" ON user_roles 
  FOR ALL TO authenticated 
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert user roles" ON user_roles 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Update the function to assign roles to handle edge cases better
CREATE OR REPLACE FUNCTION assign_admin_to_first_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  admin_role_id INTEGER;
  user_role_id INTEGER;
BEGIN
  -- Get role IDs
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO user_role_id FROM roles WHERE name = 'user';
  
  -- Count total profiles (not including the one being inserted)
  SELECT COUNT(*) INTO user_count FROM profiles WHERE id != NEW.id;
  
  -- If this is the first user, assign admin role
  IF user_count = 0 THEN
    INSERT INTO user_roles (user_id, role_id, assigned_at)
    VALUES (NEW.id, admin_role_id, NOW())
    ON CONFLICT (user_id, role_id) DO NOTHING;
  ELSE
    -- Assign regular user role
    INSERT INTO user_roles (user_id, role_id, assigned_at)
    VALUES (NEW.id, user_role_id, NOW())
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the profile creation
    RAISE WARNING 'Failed to assign user role: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS assign_user_role_trigger ON profiles;
CREATE TRIGGER assign_user_role_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_admin_to_first_user();

-- Update the is_admin function to handle cases where no roles exist
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id AND r.name = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to ensure profile exists
CREATE OR REPLACE FUNCTION ensure_profile_exists(user_id UUID, user_email TEXT DEFAULT NULL)
RETURNS profiles AS $$
DECLARE
  profile_record profiles;
BEGIN
  -- Try to get existing profile
  SELECT * INTO profile_record FROM profiles WHERE id = user_id;
  
  -- If no profile exists, create one
  IF NOT FOUND THEN
    INSERT INTO profiles (id, created_at, updated_at)
    VALUES (user_id, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
    RETURNING * INTO profile_record;
  END IF;
  
  RETURN profile_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user role safely
CREATE OR REPLACE FUNCTION get_user_role_safe(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  role_name TEXT;
BEGIN
  SELECT r.name INTO role_name 
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_id
  LIMIT 1;
  
  RETURN COALESCE(role_name, 'user');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;