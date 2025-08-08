-- 1) Helper functions to read JWT claims and current context
-- Use SECURITY DEFINER and stable semantics; set search_path for safety

-- Drop old helper functions if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_current_access_code'
      AND pg_function_is_visible(oid)
  ) THEN
    DROP FUNCTION public.get_current_access_code();
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_current_user_role'
      AND pg_function_is_visible(oid)
  ) THEN
    DROP FUNCTION public.get_current_user_role();
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_current_user_id'
      AND pg_function_is_visible(oid)
  ) THEN
    DROP FUNCTION public.get_current_user_id();
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_current_destination_id'
      AND pg_function_is_visible(oid)
  ) THEN
    DROP FUNCTION public.get_current_destination_id();
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'jwt_claim_text'
      AND pg_function_is_visible(oid)
  ) THEN
    DROP FUNCTION public.jwt_claim_text(text);
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'jwt_claim_uuid'
      AND pg_function_is_visible(oid)
  ) THEN
    DROP FUNCTION public.jwt_claim_uuid(text);
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_role'
      AND pg_function_is_visible(oid)
  ) THEN
    DROP FUNCTION public.is_role(text);
  END IF;
END$$;

-- Read a claim from JWT as text
CREATE OR REPLACE FUNCTION public.jwt_claim_text(claim_key text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF((auth.jwt() ->> claim_key), '')::text;
$$;

-- Read a claim from JWT as uuid
CREATE OR REPLACE FUNCTION public.jwt_claim_uuid(claim_key text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt() ->> claim_key)::uuid;
$$;

-- Current context helpers
CREATE OR REPLACE FUNCTION public.get_current_access_code()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.jwt_claim_uuid('access_code');
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.jwt_claim_text('user_role'), public.jwt_claim_text('role'));
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.jwt_claim_uuid('user_id');
$$;

-- Resolve destination_id via claim or lookup by user (security definer avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_destination_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dest uuid;
  uid uuid;
  acc uuid;
BEGIN
  dest := public.jwt_claim_uuid('destination_id');
  IF dest IS NOT NULL THEN
    RETURN dest;
  END IF;

  uid := public.get_current_user_id();
  IF uid IS NOT NULL THEN
    SELECT u.destination_id INTO dest FROM public.users u WHERE u.id = uid;
    RETURN dest;
  END IF;

  acc := public.get_current_access_code();
  IF acc IS NOT NULL THEN
    SELECT u.destination_id INTO dest FROM public.users u WHERE u.access_code = acc;
    RETURN dest;
  END IF;

  RETURN NULL;
END;
$$;

-- Simple role helpers
CREATE OR REPLACE FUNCTION public.is_role(target text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LOWER(public.get_current_user_role()) = LOWER(target);
$$;

-- 2) Validation trigger: prevent non-admin users from changing roles on users table
CREATE OR REPLACE FUNCTION public.prevent_role_change_by_non_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT (public.is_role('community_admin') OR public.is_role('super_admin')) THEN
      RAISE EXCEPTION 'Only community_admin or super_admin can change roles' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_role_change_by_non_admin'
  ) THEN
    CREATE TRIGGER trg_prevent_role_change_by_non_admin
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change_by_non_admin();
  END IF;
END$$;

-- 3) Enable RLS on tables (safe if already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preset_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_addresses ENABLE ROW LEVEL SECURITY;

-- 4) Drop existing policies to replace with new
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT pol.polname, c.relname FROM pg_policy pol JOIN pg_class c ON c.oid = pol.polrelid WHERE c.relname IN ('users','ride_requests','vehicles','preset_destinations','fixed_routes','wallet_addresses') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.polname, r.relname);
  END LOOP;
END$$;

-- 5) USERS table policies
-- SELECT: own row; community_admin can see drivers in same destination; super_admin can see community_admins
CREATE POLICY users_select_own_or_admin_scope ON public.users
FOR SELECT
USING (
  access_code = public.get_current_access_code()
  OR (
    public.is_role('community_admin')
    AND destination_id IS NOT NULL
    AND destination_id = public.get_current_destination_id()
    AND role = 'driver'
  )
  OR (
    public.is_role('super_admin')
    AND role = 'community_admin'
  )
);

-- INSERT: disabled via RLS (use SECURITY DEFINER RPC/Edge Function)
-- If you must allow, uncomment the following conservative policy
-- CREATE POLICY users_insert_none ON public.users FOR INSERT WITH CHECK (false);

-- UPDATE: user can update own profile; admins can update within scope described above
CREATE POLICY users_update_self ON public.users
FOR UPDATE
USING (access_code = public.get_current_access_code())
WITH CHECK (access_code = public.get_current_access_code());

CREATE POLICY users_update_by_admins ON public.users
FOR UPDATE TO authenticated
USING (
  (public.is_role('community_admin') AND destination_id = public.get_current_destination_id() AND role = 'driver')
  OR (public.is_role('super_admin') AND role = 'community_admin')
)
WITH CHECK (
  (public.is_role('community_admin') AND destination_id = public.get_current_destination_id() AND role = 'driver')
  OR (public.is_role('super_admin') AND role = 'community_admin')
);

-- DELETE: none

-- 6) RIDE_REQUESTS policies
-- SELECT
CREATE POLICY ride_requests_select_passenger ON public.ride_requests
FOR SELECT
USING (access_code = public.get_current_access_code());

CREATE POLICY ride_requests_select_driver ON public.ride_requests
FOR SELECT TO authenticated
USING (
  public.is_role('driver') AND (
    processing_driver_id = public.get_current_user_id()
    OR vehicle_id IN (
      SELECT v.id FROM public.vehicles v WHERE v.user_id = public.get_current_user_id()
    )
  )
);

CREATE POLICY ride_requests_select_admin ON public.ride_requests
FOR SELECT TO authenticated
USING (
  public.is_role('community_admin') AND (
    EXISTS (
      SELECT 1 FROM public.vehicles v 
      WHERE v.id = ride_requests.vehicle_id 
        AND v.destination_id = public.get_current_destination_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.fixed_routes fr
      WHERE fr.id = ride_requests.fixed_route_id
        AND fr.destination_id = public.get_current_destination_id()
    )
  )
);

-- INSERT: passengers only (own access_code)
CREATE POLICY ride_requests_insert_passenger ON public.ride_requests
FOR INSERT TO authenticated
WITH CHECK (
  public.is_role('passenger') AND access_code = public.get_current_access_code()
);

-- UPDATE: passenger own; driver/admin related
CREATE POLICY ride_requests_update_passenger ON public.ride_requests
FOR UPDATE TO authenticated
USING (public.is_role('passenger') AND access_code = public.get_current_access_code())
WITH CHECK (public.is_role('passenger') AND access_code = public.get_current_access_code());

CREATE POLICY ride_requests_update_driver ON public.ride_requests
FOR UPDATE TO authenticated
USING (
  public.is_role('driver') AND (
    processing_driver_id = public.get_current_user_id()
    OR vehicle_id IN (SELECT v.id FROM public.vehicles v WHERE v.user_id = public.get_current_user_id())
  )
)
WITH CHECK (
  public.is_role('driver') AND (
    processing_driver_id = public.get_current_user_id()
    OR vehicle_id IN (SELECT v.id FROM public.vehicles v WHERE v.user_id = public.get_current_user_id())
  )
);

CREATE POLICY ride_requests_update_admin ON public.ride_requests
FOR UPDATE TO authenticated
USING (
  public.is_role('community_admin') AND (
    EXISTS (
      SELECT 1 FROM public.vehicles v 
      WHERE v.id = ride_requests.vehicle_id 
        AND v.destination_id = public.get_current_destination_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.fixed_routes fr
      WHERE fr.id = ride_requests.fixed_route_id
        AND fr.destination_id = public.get_current_destination_id()
    )
  )
)
WITH CHECK (
  public.is_role('community_admin') AND (
    EXISTS (
      SELECT 1 FROM public.vehicles v 
      WHERE v.id = ride_requests.vehicle_id 
        AND v.destination_id = public.get_current_destination_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.fixed_routes fr
      WHERE fr.id = ride_requests.fixed_route_id
        AND fr.destination_id = public.get_current_destination_id()
    )
  )
);

-- DELETE: none (explicitly deny)

-- 7) VEHICLES policies
-- Public can view active vehicles (for browsing), plus authenticated users
CREATE POLICY vehicles_select_public_active ON public.vehicles
FOR SELECT
USING (is_active = true);

-- INSERT: drivers can create their own vehicles; community_admin can create for their destination
CREATE POLICY vehicles_insert_driver ON public.vehicles
FOR INSERT TO authenticated
WITH CHECK (
  public.is_role('driver') AND user_id = public.get_current_user_id() AND destination_id = public.get_current_destination_id()
);

CREATE POLICY vehicles_insert_admin ON public.vehicles
FOR INSERT TO authenticated
WITH CHECK (
  public.is_role('community_admin') AND destination_id = public.get_current_destination_id()
);

-- UPDATE: drivers on their own; admin on their destination
CREATE POLICY vehicles_update_driver ON public.vehicles
FOR UPDATE TO authenticated
USING (public.is_role('driver') AND user_id = public.get_current_user_id())
WITH CHECK (public.is_role('driver') AND user_id = public.get_current_user_id());

CREATE POLICY vehicles_update_admin ON public.vehicles
FOR UPDATE TO authenticated
USING (public.is_role('community_admin') AND destination_id = public.get_current_destination_id())
WITH CHECK (public.is_role('community_admin') AND destination_id = public.get_current_destination_id());

-- DELETE: admin only within destination
CREATE POLICY vehicles_delete_admin ON public.vehicles
FOR DELETE TO authenticated
USING (public.is_role('community_admin') AND destination_id = public.get_current_destination_id());

-- 8) PRESET_DESTINATIONS policies
-- Public can view approved & active destinations
CREATE POLICY preset_destinations_select_public ON public.preset_destinations
FOR SELECT
USING (is_active = true AND is_approved = true);

-- Admin can view all destinations in their scope (even not approved yet)
CREATE POLICY preset_destinations_select_admin_scope ON public.preset_destinations
FOR SELECT TO authenticated
USING (public.is_role('community_admin') AND admin_user_id = public.get_current_user_id());

-- Create/Manage by community_admin
CREATE POLICY preset_destinations_insert_admin ON public.preset_destinations
FOR INSERT TO authenticated
WITH CHECK (public.is_role('community_admin') AND admin_user_id = public.get_current_user_id());

CREATE POLICY preset_destinations_update_admin ON public.preset_destinations
FOR UPDATE TO authenticated
USING (public.is_role('community_admin') AND admin_user_id = public.get_current_user_id())
WITH CHECK (public.is_role('community_admin') AND admin_user_id = public.get_current_user_id());

CREATE POLICY preset_destinations_delete_admin ON public.preset_destinations
FOR DELETE TO authenticated
USING (public.is_role('community_admin') AND admin_user_id = public.get_current_user_id());

-- 9) FIXED_ROUTES policies
-- Public view active routes
CREATE POLICY fixed_routes_select_public ON public.fixed_routes
FOR SELECT
USING (is_active = true);

-- Admin manage routes for their destination
CREATE POLICY fixed_routes_cud_admin ON public.fixed_routes
FOR ALL TO authenticated
USING (public.is_role('community_admin') AND destination_id = public.get_current_destination_id())
WITH CHECK (public.is_role('community_admin') AND destination_id = public.get_current_destination_id());

-- 10) WALLET_ADDRESSES policies
-- Public can view active wallet addresses
CREATE POLICY wallet_addresses_select_public ON public.wallet_addresses
FOR SELECT
USING (is_active = true);

-- Admin manage addresses for their destination or routes belonging to their destination
CREATE POLICY wallet_addresses_cud_admin ON public.wallet_addresses
FOR ALL TO authenticated
USING (
  public.is_role('community_admin') AND (
    destination_id = public.get_current_destination_id()
    OR route_id IN (
      SELECT fr.id FROM public.fixed_routes fr WHERE fr.destination_id = public.get_current_destination_id()
    )
  )
)
WITH CHECK (
  public.is_role('community_admin') AND (
    destination_id = public.get_current_destination_id()
    OR route_id IN (
      SELECT fr.id FROM public.fixed_routes fr WHERE fr.destination_id = public.get_current_destination_id()
    )
  )
);

-- Drivers can manage addresses for their own vehicles
CREATE POLICY wallet_addresses_cud_driver ON public.wallet_addresses
FOR ALL TO authenticated
USING (
  public.is_role('driver') AND vehicle_id IN (
    SELECT v.id FROM public.vehicles v WHERE v.user_id = public.get_current_user_id()
  )
)
WITH CHECK (
  public.is_role('driver') AND vehicle_id IN (
    SELECT v.id FROM public.vehicles v WHERE v.user_id = public.get_current_user_id()
  )
);

-- 11) Harden existing SECURITY DEFINER functions to ensure search_path
CREATE OR REPLACE FUNCTION public.validate_access_code(input_access_code uuid)
 RETURNS TABLE(access_code uuid, role text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT u.access_code, u.role
  FROM users u
  WHERE u.access_code = input_access_code;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_or_create_user_by_access_code(input_access_code uuid)
 RETURNS TABLE(id uuid, access_code uuid, role text, wallet_address text, destination_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  user_record users%ROWTYPE;
BEGIN
  SELECT * INTO user_record
  FROM users u
  WHERE u.access_code = input_access_code;
  
  IF NOT FOUND THEN
    INSERT INTO users (access_code)
    VALUES (input_access_code)
    RETURNING * INTO user_record;
  END IF;
  
  RETURN QUERY
  SELECT user_record.id, user_record.access_code, user_record.role, 
         user_record.wallet_address, user_record.destination_id, 
         user_record.created_at, user_record.updated_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_approved_destinations()
 RETURNS TABLE(id uuid, name text, address text, contact text, description text, service_start_time time without time zone, service_end_time time without time zone, service_days jsonb, is_active boolean, is_approved boolean, admin_user_id uuid, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT d.id, d.name, d.address, d.contact, d.description,
         d.service_start_time, d.service_end_time, d.service_days,
         d.is_active, d.is_approved, d.admin_user_id, d.created_at
  FROM preset_destinations d
  WHERE d.is_approved = true AND d.is_active = true;
END;
$function$;
