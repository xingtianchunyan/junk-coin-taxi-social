-- 修复 RLS 策略和移除车主角色

-- 1. 首先更新数据库枚举，移除 owner 角色
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('passenger', 'driver', 'admin');

-- 2. 更新现有的 owner 角色为 admin （社区管理员）
UPDATE public.users 
SET role = 'admin'
WHERE role = 'owner';

-- 3. 修复 preset_destinations 的 RLS 策略
DROP POLICY IF EXISTS "Users can view approved destinations in their area" ON public.preset_destinations;
DROP POLICY IF EXISTS "Community admins can create destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Super admins can manage all destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Community admins can manage their approved destinations" ON public.preset_destinations;

-- 社区管理员可以查看所有已批准的目的地
CREATE POLICY "Users can view approved destinations" 
ON public.preset_destinations 
FOR SELECT 
USING (approval_status = 'approved' AND is_active = true);

-- 已认证用户可以创建目的地
CREATE POLICY "Authenticated users can create destinations" 
ON public.preset_destinations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 管理员可以管理所有目的地
CREATE POLICY "Admins can manage all destinations" 
ON public.preset_destinations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role = 'admin'
  )
);

-- 4. 修复 vehicles 的 RLS 策略
DROP POLICY IF EXISTS "Users can view vehicles in their destination" ON public.vehicles;
DROP POLICY IF EXISTS "Community admins can manage their destination vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Drivers can update their own vehicle status" ON public.vehicles;

-- 用户可以查看活跃车辆
CREATE POLICY "Users can view active vehicles" 
ON public.vehicles 
FOR SELECT 
USING (is_active = true);

-- 管理员可以管理所有车辆
CREATE POLICY "Admins can manage vehicles" 
ON public.vehicles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role = 'admin'
  )
);

-- 司机可以更新自己的车辆状态
CREATE POLICY "Drivers can update their vehicle status" 
ON public.vehicles 
FOR UPDATE 
USING (
  user_id = (
    SELECT id FROM public.users 
    WHERE access_code = auth.uid()
  )
);

-- 5. 修复 ride_requests 的 RLS 策略
DROP POLICY IF EXISTS "Users can view ride requests in their destination" ON public.ride_requests;
DROP POLICY IF EXISTS "Users can create ride requests in service time" ON public.ride_requests;
DROP POLICY IF EXISTS "Authorized users can update ride requests" ON public.ride_requests;

-- 用户可以查看乘车请求
CREATE POLICY "Users can view ride requests" 
ON public.ride_requests 
FOR SELECT 
USING (
  -- 用户可以查看自己的请求
  access_code = auth.uid() 
  OR 
  -- 或者是管理员/司机查看自己目的地的请求
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = auth.uid() 
    AND fr.id = ride_requests.fixed_route_id
    AND u.role IN ('admin', 'driver')
  )
);

-- 已认证用户可以创建乘车请求
CREATE POLICY "Authenticated users can create ride requests" 
ON public.ride_requests 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 授权用户可以更新乘车请求
CREATE POLICY "Authorized users can update ride requests" 
ON public.ride_requests 
FOR UPDATE 
USING (
  -- 用户可以更新自己的请求
  access_code = auth.uid() 
  OR 
  -- 或者是管理员/司机可以更新自己目的地的请求
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = auth.uid() 
    AND fr.id = ride_requests.fixed_route_id
    AND u.role IN ('admin', 'driver')
  )
);

-- 6. 修复数据库函数的安全路径
CREATE OR REPLACE FUNCTION public.get_or_create_user_by_access_code(input_access_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  user_id uuid;
BEGIN
  -- 尝试获取现有用户
  SELECT id INTO user_id
  FROM public.users
  WHERE access_code::text = input_access_code;
  
  -- 如果用户不存在，创建新用户
  IF user_id IS NULL THEN
    INSERT INTO public.users (access_code, role)
    VALUES (input_access_code::uuid, 'admin')
    RETURNING id INTO user_id;
  END IF;
  
  RETURN user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_community_admin_by_access_code(input_access_code text, admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code::text = input_access_code AND id = admin_user_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_destination_access(user_access_code uuid, dest_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = user_access_code 
    AND (destination_id = dest_id OR destination_id IS NULL)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_service_time_active(dest_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  dest_record record;
  check_time time;
  check_day text;
BEGIN
  SELECT service_start_time, service_end_time, service_days 
  INTO dest_record
  FROM public.preset_destinations 
  WHERE id = dest_id AND approval_status = 'approved';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  check_time := CURRENT_TIME;
  check_day := lower(to_char(CURRENT_DATE, 'Day'));
  check_day := trim(check_day);
  
  -- 检查是否在服务日期内
  IF NOT (dest_record.service_days ? check_day) THEN
    RETURN false;
  END IF;
  
  -- 检查是否在服务时间内
  RETURN check_time BETWEEN dest_record.service_start_time AND dest_record.service_end_time;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_driver_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  route_duration integer;
BEGIN
  -- 当乘车请求状态改为confirmed时，计算司机忙碌时间
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- 获取路线预计时间
    SELECT estimated_duration_minutes INTO route_duration
    FROM public.fixed_routes 
    WHERE id = NEW.fixed_route_id;
    
    -- 更新车辆状态为忙碌，设置预计结束时间
    UPDATE public.vehicles 
    SET current_status = 'busy',
        last_trip_end_time = now() + INTERVAL '1 minute' * COALESCE(route_duration * 2, 60)
    WHERE id = NEW.vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_update_vehicle_availability()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- 将已过期的忙碌车辆状态改为可用
  UPDATE public.vehicles 
  SET current_status = 'available'
  WHERE current_status = 'busy' 
  AND last_trip_end_time < now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_driver_user_for_vehicle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- 如果没有指定user_id，则创建新的司机用户
  IF NEW.user_id IS NULL THEN
    INSERT INTO public.users (role, access_code)
    VALUES ('driver', gen_random_uuid())
    RETURNING id INTO NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 7. 为车辆创建触发器
DROP TRIGGER IF EXISTS create_driver_user_trigger ON public.vehicles;
CREATE TRIGGER create_driver_user_trigger
  BEFORE INSERT ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_driver_user_for_vehicle();

-- 8. 为乘车请求创建状态更新触发器
DROP TRIGGER IF EXISTS update_driver_status_trigger ON public.ride_requests;
CREATE TRIGGER update_driver_status_trigger
  AFTER UPDATE ON public.ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_status();