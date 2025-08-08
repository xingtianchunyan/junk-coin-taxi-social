-- Tighten policies to avoid anonymous role where not intended
DROP POLICY IF EXISTS users_select_own_or_admin_scope ON public.users;
CREATE POLICY users_select_own_or_admin_scope ON public.users
FOR SELECT TO authenticated
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

DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self ON public.users
FOR UPDATE TO authenticated
USING (access_code = public.get_current_access_code())
WITH CHECK (access_code = public.get_current_access_code());

DROP POLICY IF EXISTS ride_requests_select_passenger ON public.ride_requests;
CREATE POLICY ride_requests_select_passenger ON public.ride_requests
FOR SELECT TO authenticated
USING (access_code = public.get_current_access_code());
