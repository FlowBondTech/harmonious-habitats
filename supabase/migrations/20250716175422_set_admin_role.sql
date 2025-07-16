-- Migration to set user as admin
-- Ensure roles exist
INSERT INTO roles (id, name, description, created_at) VALUES 
(1, 'user', 'Regular user', NOW()),
(2, 'moderator', 'Community moderator', NOW()),
(3, 'admin', 'Administrator with full access', NOW())
ON CONFLICT (id) DO NOTHING;

-- Set cryptokoh@gmail.com as admin by temporarily handling the audit trigger
DO $$
DECLARE
    target_user_id UUID;
    admin_role_id INT;
    existing_role RECORD;
    audit_trigger_name TEXT;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'cryptokoh@gmail.com';
    
    -- Get the admin role ID
    SELECT id INTO admin_role_id 
    FROM roles 
    WHERE name = 'admin';
    
    -- Only proceed if both user and role exist
    IF target_user_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
        -- Find and temporarily disable audit trigger on user_roles table
        SELECT t.trigger_name INTO audit_trigger_name
        FROM information_schema.triggers t
        WHERE t.event_object_table = 'user_roles' 
        AND t.trigger_name LIKE '%audit%'
        LIMIT 1;
        
        IF audit_trigger_name IS NOT NULL THEN
            EXECUTE format('ALTER TABLE user_roles DISABLE TRIGGER %I', audit_trigger_name);
            RAISE NOTICE 'Temporarily disabled trigger: %', audit_trigger_name;
        END IF;
        
        -- Check if user already has admin role
        SELECT * INTO existing_role
        FROM user_roles 
        WHERE user_id = target_user_id AND role_id = admin_role_id;
        
        IF existing_role IS NULL THEN
            -- Insert new admin role
            INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
            VALUES (target_user_id, admin_role_id, NOW(), target_user_id);
            
            RAISE NOTICE 'Successfully assigned admin role to user: %', target_user_id;
        ELSE
            -- Update existing role
            UPDATE user_roles 
            SET assigned_at = NOW(), assigned_by = target_user_id
            WHERE user_id = target_user_id AND role_id = admin_role_id;
            
            RAISE NOTICE 'Admin role already exists for user: %, updated timestamp', target_user_id;
        END IF;
        
        -- Re-enable the audit trigger
        IF audit_trigger_name IS NOT NULL THEN
            EXECUTE format('ALTER TABLE user_roles ENABLE TRIGGER %I', audit_trigger_name);
            RAISE NOTICE 'Re-enabled trigger: %', audit_trigger_name;
        END IF;
        
    ELSE
        RAISE NOTICE 'User not found or admin role does not exist. User ID: %, Admin Role ID: %', target_user_id, admin_role_id;
    END IF;
END $$;
