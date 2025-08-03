-- Recreate essential functions for the app to work

-- Function to validate access codes (needed for login)
CREATE OR REPLACE FUNCTION public.validate_access_code(input_access_code uuid)
RETURNS TABLE(access_code uuid, role text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.access_code, u.role
  FROM users u
  WHERE u.access_code = input_access_code;
END;
$$;

-- Function to get or create user by access code
CREATE OR REPLACE FUNCTION public.get_or_create_user_by_access_code(input_access_code uuid)
RETURNS TABLE(id uuid, access_code uuid, role text, wallet_address text, destination_id uuid, created_at timestamptz, updated_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record users%ROWTYPE;
BEGIN
  -- Try to find existing user
  SELECT * INTO user_record
  FROM users u
  WHERE u.access_code = input_access_code;
  
  -- If user doesn't exist, create one
  IF NOT FOUND THEN
    INSERT INTO users (access_code)
    VALUES (input_access_code)
    RETURNING * INTO user_record;
  END IF;
  
  -- Return the user record
  RETURN QUERY
  SELECT user_record.id, user_record.access_code, user_record.role, 
         user_record.wallet_address, user_record.destination_id, 
         user_record.created_at, user_record.updated_at;
END;
$$;

-- Function to get approved destinations
CREATE OR REPLACE FUNCTION public.get_approved_destinations()
RETURNS TABLE(id uuid, name text, address text, contact text, description text, 
              service_start_time time, service_end_time time, service_days jsonb, 
              is_active boolean, is_approved boolean, admin_user_id uuid, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.name, d.address, d.contact, d.description,
         d.service_start_time, d.service_end_time, d.service_days,
         d.is_active, d.is_approved, d.admin_user_id, d.created_at
  FROM preset_destinations d
  WHERE d.is_approved = true AND d.is_active = true;
END;
$$;