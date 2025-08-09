-- Tighten policies to authenticated users only
DROP POLICY IF EXISTS preset_destinations_select_super_admin ON public.preset_destinations;
CREATE POLICY preset_destinations_select_super_admin
ON public.preset_destinations
FOR SELECT TO authenticated
USING (public.is_role('super_admin'));

DROP POLICY IF EXISTS preset_destinations_update_super_admin ON public.preset_destinations;
CREATE POLICY preset_destinations_update_super_admin
ON public.preset_destinations
FOR UPDATE TO authenticated
USING (public.is_role('super_admin'))
WITH CHECK (public.is_role('super_admin'));

DROP POLICY IF EXISTS users_select_super_admin ON public.users;
CREATE POLICY users_select_super_admin
ON public.users
FOR SELECT TO authenticated
USING (public.is_role('super_admin'));
