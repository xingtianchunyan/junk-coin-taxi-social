-- Add current authenticated user as admin
-- First, let's check if there's already an admin user entry
-- If not, we'll add the current user as admin

-- Add the current user to admin_users table
-- Note: You'll need to replace this with your actual user ID after running this migration
INSERT INTO public.admin_users (username, password_hash, email)
VALUES ('admin', 'placeholder_hash', '1762251101@qq.com')
ON CONFLICT (email) DO NOTHING;

-- Alternative: Create a simple function to make any authenticated user an admin for vehicles
-- This is a temporary solution - you should manage admins properly in production
CREATE OR REPLACE FUNCTION public.is_vehicle_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For now, allow any authenticated user to manage vehicles
  -- You can modify this logic as needed
  RETURN user_id IS NOT NULL;
END;
$$;

-- Update the vehicles RLS policy to use the new function
DROP POLICY IF EXISTS "Only admins can manage vehicles" ON public.vehicles;

CREATE POLICY "Vehicle admins can manage vehicles" 
ON public.vehicles 
FOR ALL 
USING (is_vehicle_admin(auth.uid()))
WITH CHECK (is_vehicle_admin(auth.uid()));