-- Fix RLS vulnerabilities for ride_requests and payments

-- 1) Enable RLS for payments (it was disabled in a previous migration)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 2) Drop existing permissive policies for payments if any
DROP POLICY IF EXISTS "Anyone can view payments for accessible rides" ON public.payments;
DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;

-- 3) Define secure policies for payments
-- SELECT: Users can see payments for their own ride requests
CREATE POLICY payments_select_passenger ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ride_requests rr
    WHERE rr.id = payments.ride_request_id
    AND rr.access_code = public.get_current_access_code()
  )
);

-- SELECT: Drivers and community admins can see payments for rides they handle
CREATE POLICY payments_select_staff ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ride_requests rr
    WHERE rr.id = payments.ride_request_id
    AND (
      (public.is_role('driver') AND (
        rr.processing_driver_id = public.get_current_user_id()
        OR rr.vehicle_id IN (SELECT v.id FROM public.vehicles v WHERE v.user_id = public.get_current_user_id())
      ))
      OR (public.is_role('community_admin') AND (
        EXISTS (
          SELECT 1 FROM public.vehicles v 
          WHERE v.id = rr.vehicle_id 
          AND v.destination_id = public.get_current_destination_id()
        )
        OR EXISTS (
          SELECT 1 FROM public.fixed_routes fr
          WHERE fr.id = rr.fixed_route_id
          AND fr.destination_id = public.get_current_destination_id()
        )
      ))
    )
  )
);

-- SELECT: Super admins can see all payments
CREATE POLICY payments_select_super_admin ON public.payments
FOR SELECT
USING (public.is_role('super_admin'));

-- INSERT: Passengers can create payments for their own ride requests
CREATE POLICY payments_insert_passenger ON public.payments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ride_requests rr
    WHERE rr.id = payments.ride_request_id
    AND rr.access_code = public.get_current_access_code()
  )
);

-- 4) Add missing super_admin policy for ride_requests
DROP POLICY IF EXISTS ride_requests_select_super_admin ON public.ride_requests;
CREATE POLICY ride_requests_select_super_admin ON public.ride_requests
FOR SELECT
USING (public.is_role('super_admin'));

DROP POLICY IF EXISTS ride_requests_update_super_admin ON public.ride_requests;
CREATE POLICY ride_requests_update_super_admin ON public.ride_requests
FOR UPDATE
USING (public.is_role('super_admin'))
WITH CHECK (public.is_role('super_admin'));

-- 5) Add super_admin policies for other tables
CREATE POLICY vehicles_all_super_admin ON public.vehicles
FOR ALL USING (public.is_role('super_admin'));

CREATE POLICY fixed_routes_all_super_admin ON public.fixed_routes
FOR ALL USING (public.is_role('super_admin'));

CREATE POLICY wallet_addresses_all_super_admin ON public.wallet_addresses
FOR ALL USING (public.is_role('super_admin'));

-- 6) Fix permissive ride_requests insert policy from early migrations
-- (The policy "Anyone can create ride requests" was replaced in 20250808152231, 
-- but let's ensure it's gone if it was on a different name)
DROP POLICY IF EXISTS "Anyone can create ride requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Anyone can view basic ride info" ON public.ride_requests;
DROP POLICY IF EXISTS "Anyone can update their own ride requests with access code" ON public.ride_requests;
