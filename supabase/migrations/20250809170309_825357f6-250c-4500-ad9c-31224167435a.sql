-- Add helper to generate a fresh access code
CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT gen_random_uuid();
$$;

-- Create a secure function for super_admin to create users with a new access code
CREATE OR REPLACE FUNCTION public.create_user_with_access_code(
  p_role text,
  p_destination_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  access_code uuid,
  role text,
  destination_id uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_user users%ROWTYPE;
BEGIN
  -- Only super_admins can create access codes/users
  IF NOT public.is_role('super_admin') THEN
    RAISE EXCEPTION 'Only super_admin can create access codes' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.users (access_code, role, destination_id)
  VALUES (gen_random_uuid(), p_role, p_destination_id)
  RETURNING * INTO new_user;

  RETURN QUERY
  SELECT new_user.id, new_user.access_code, new_user.role, new_user.destination_id, new_user.created_at;
END;
$$;

-- Allow super_admin to view ALL destinations (approved or not)
DROP POLICY IF EXISTS preset_destinations_select_super_admin ON public.preset_destinations;
CREATE POLICY preset_destinations_select_super_admin
ON public.preset_destinations
FOR SELECT
USING (public.is_role('super_admin'));

-- Allow super_admin to approve/update any destination
DROP POLICY IF EXISTS preset_destinations_update_super_admin ON public.preset_destinations;
CREATE POLICY preset_destinations_update_super_admin
ON public.preset_destinations
FOR UPDATE
USING (public.is_role('super_admin'))
WITH CHECK (public.is_role('super_admin'));

-- Broaden visibility for super_admin on users to help with admin workflows
DROP POLICY IF EXISTS users_select_super_admin ON public.users;
CREATE POLICY users_select_super_admin
ON public.users
FOR SELECT
USING (public.is_role('super_admin'));
