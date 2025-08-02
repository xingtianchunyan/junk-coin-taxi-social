-- 禁用所有表的行级安全策略
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.preset_destinations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_addresses DISABLE ROW LEVEL SECURITY;

-- 删除所有RLS策略
DROP POLICY IF EXISTS "Users can self register" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data including role" ON public.users;

DROP POLICY IF EXISTS "Super admins can view all destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Community admins can create destination requests" ON public.preset_destinations;
DROP POLICY IF EXISTS "Community admins can view own destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Super admins can approve destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Super admins can delete destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "All roles can view approved destinations" ON public.preset_destinations;

DROP POLICY IF EXISTS "Community admins manage routes" ON public.fixed_routes;
DROP POLICY IF EXISTS "All authenticated users can view routes" ON public.fixed_routes;

DROP POLICY IF EXISTS "All authenticated users can view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Community admins can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Community admins can delete vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Drivers can update their vehicle operation hours" ON public.vehicles;
DROP POLICY IF EXISTS "Community admins can manage vehicles" ON public.vehicles;

DROP POLICY IF EXISTS "Users can view requests by access code" ON public.ride_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Users can delete own requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Community users can view related ride requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Community users can update related ride requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Users can create ride requests" ON public.ride_requests;

DROP POLICY IF EXISTS "All roles can view payments" ON public.payments;
DROP POLICY IF EXISTS "All roles can insert payments" ON public.payments;

DROP POLICY IF EXISTS "Community admins manage wallet addresses" ON public.wallet_addresses;
DROP POLICY IF EXISTS "All roles view active wallet addresses" ON public.wallet_addresses;

-- 删除所有触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS ensure_user_role_update_trigger ON public.users;
DROP TRIGGER IF EXISTS set_default_access_code_trigger ON public.users;
DROP TRIGGER IF EXISTS prevent_role_modification_trigger ON public.users;

DROP TRIGGER IF EXISTS update_preset_destinations_updated_at ON public.preset_destinations;

DROP TRIGGER IF EXISTS update_fixed_routes_updated_at ON public.fixed_routes;

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
DROP TRIGGER IF EXISTS create_driver_user_trigger ON public.vehicles;

DROP TRIGGER IF EXISTS update_ride_requests_updated_at ON public.ride_requests;
DROP TRIGGER IF EXISTS validate_ride_request_trigger ON public.ride_requests;
DROP TRIGGER IF EXISTS update_driver_status_trigger ON public.ride_requests;

DROP TRIGGER IF EXISTS validate_wallet_address_trigger ON public.wallet_addresses;

-- 删除所有自定义函数
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.set_default_access_code();
DROP FUNCTION IF EXISTS public.set_current_access_code(text);
DROP FUNCTION IF EXISTS public.ensure_user_role_update();
DROP FUNCTION IF EXISTS public.set_config(text, text);
DROP FUNCTION IF EXISTS public.validate_wallet_address();
DROP FUNCTION IF EXISTS public.create_driver_user_for_vehicle();
DROP FUNCTION IF EXISTS public.update_driver_status();
DROP FUNCTION IF EXISTS public.auto_update_vehicle_availability();
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.set_super_admin_verified(boolean);
DROP FUNCTION IF EXISTS public.get_current_access_code();
DROP FUNCTION IF EXISTS public.prevent_role_modification();
DROP FUNCTION IF EXISTS public.get_approved_destinations();
DROP FUNCTION IF EXISTS public.is_community_admin_by_access_code(text, uuid);
DROP FUNCTION IF EXISTS public.user_has_destination_access(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_or_create_user_by_access_code(text);
DROP FUNCTION IF EXISTS public.validate_ride_request();
DROP FUNCTION IF EXISTS public.validate_access_code(text);
DROP FUNCTION IF EXISTS public.get_destinations_with_admin_codes();
DROP FUNCTION IF EXISTS public.is_service_time_active(uuid);