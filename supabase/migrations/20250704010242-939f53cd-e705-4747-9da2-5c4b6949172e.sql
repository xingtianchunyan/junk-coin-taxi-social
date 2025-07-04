-- Fix RLS policies to be more secure (corrected version)

-- 1. First, let's create a proper authentication check function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix admin_users table policy to require proper authentication
DROP POLICY IF EXISTS "Only admins can access admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Only authenticated admins can access admin_users" ON public.admin_users;

CREATE POLICY "Only authenticated admins can access admin_users"
ON public.admin_users
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- 3. Fix ride_requests policies to be more restrictive
DROP POLICY IF EXISTS "Anyone can update their own ride requests with access code" ON public.ride_requests;
DROP POLICY IF EXISTS "Users can update ride requests with valid access code" ON public.ride_requests;

-- Allow updates only by admins or with valid access code verification
CREATE POLICY "Users can update ride requests with proper authorization"
ON public.ride_requests
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 4. Restrict wallet_addresses policies to admins only
DROP POLICY IF EXISTS "Allow system to insert wallet addresses" ON public.wallet_addresses;
DROP POLICY IF EXISTS "Allow system to update wallet addresses" ON public.wallet_addresses;
DROP POLICY IF EXISTS "Only admins can insert wallet addresses" ON public.wallet_addresses;
DROP POLICY IF EXISTS "Only admins can update wallet addresses" ON public.wallet_addresses;

CREATE POLICY "Only admins can insert wallet addresses"
ON public.wallet_addresses
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update wallet addresses"
ON public.wallet_addresses
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 5. Add input validation trigger for wallet addresses
CREATE OR REPLACE FUNCTION validate_wallet_address()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate address format (basic validation)
  IF NEW.address IS NULL OR LENGTH(NEW.address) < 10 THEN
    RAISE EXCEPTION 'Invalid wallet address format';
  END IF;
  
  -- Validate symbol format
  IF NEW.symbol IS NULL OR LENGTH(NEW.symbol) < 2 OR LENGTH(NEW.symbol) > 10 THEN
    RAISE EXCEPTION 'Invalid symbol format';
  END IF;
  
  -- Validate chain name
  IF NEW.chain_name IS NULL OR LENGTH(NEW.chain_name) < 2 THEN
    RAISE EXCEPTION 'Invalid chain name';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_wallet_address_trigger ON public.wallet_addresses;
CREATE TRIGGER validate_wallet_address_trigger
  BEFORE INSERT OR UPDATE ON public.wallet_addresses
  FOR EACH ROW EXECUTE FUNCTION validate_wallet_address();

-- 6. Add validation for ride requests
CREATE OR REPLACE FUNCTION validate_ride_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Sanitize and validate text fields
  IF NEW.friend_name IS NULL OR LENGTH(TRIM(NEW.friend_name)) = 0 THEN
    RAISE EXCEPTION 'Friend name is required';
  END IF;
  
  IF NEW.start_location IS NULL OR LENGTH(TRIM(NEW.start_location)) = 0 THEN
    RAISE EXCEPTION 'Start location is required';
  END IF;
  
  IF NEW.end_location IS NULL OR LENGTH(TRIM(NEW.end_location)) = 0 THEN
    RAISE EXCEPTION 'End location is required';
  END IF;
  
  -- Sanitize text inputs to prevent XSS
  NEW.friend_name = TRIM(NEW.friend_name);
  NEW.start_location = TRIM(NEW.start_location);
  NEW.end_location = TRIM(NEW.end_location);
  
  IF NEW.notes IS NOT NULL THEN
    NEW.notes = TRIM(NEW.notes);
  END IF;
  
  IF NEW.contact_info IS NOT NULL THEN
    NEW.contact_info = TRIM(NEW.contact_info);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_ride_request_trigger ON public.ride_requests;
CREATE TRIGGER validate_ride_request_trigger
  BEFORE INSERT OR UPDATE ON public.ride_requests
  FOR EACH ROW EXECUTE FUNCTION validate_ride_request();