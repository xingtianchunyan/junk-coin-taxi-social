-- 阶段一：数据库字段补充

-- 1. 为 preset_destinations 表添加字段
ALTER TABLE public.preset_destinations 
ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN service_start_time time DEFAULT '08:00:00',
ADD COLUMN service_end_time time DEFAULT '18:00:00',
ADD COLUMN service_days jsonb DEFAULT '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]'::jsonb;

-- 2. 为 vehicles 表添加字段
ALTER TABLE public.vehicles 
ADD COLUMN work_start_time time DEFAULT '08:00:00',
ADD COLUMN work_end_time time DEFAULT '18:00:00',
ADD COLUMN current_status text DEFAULT 'offline' CHECK (current_status IN ('available', 'busy', 'offline')),
ADD COLUMN last_trip_end_time timestamp with time zone DEFAULT now();

-- 3. 为 users 表添加字段（用户目的地绑定）
ALTER TABLE public.users 
ADD COLUMN destination_id uuid REFERENCES public.preset_destinations(id);

-- 4. 创建目的地权限验证函数
CREATE OR REPLACE FUNCTION public.user_has_destination_access(user_access_code uuid, dest_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = user_access_code 
    AND (destination_id = dest_id OR destination_id IS NULL)
  );
END;
$$;

-- 5. 创建时间段验证函数
CREATE OR REPLACE FUNCTION public.is_service_time_active(dest_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dest_record record;
  current_time time;
  current_day text;
BEGIN
  SELECT service_start_time, service_end_time, service_days 
  INTO dest_record
  FROM public.preset_destinations 
  WHERE id = dest_id AND approval_status = 'approved';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  current_time := CURRENT_TIME;
  current_day := lower(to_char(CURRENT_DATE, 'Day'));
  current_day := trim(current_day);
  
  -- 检查是否在服务日期内
  IF NOT (dest_record.service_days ? current_day) THEN
    RETURN false;
  END IF;
  
  -- 检查是否在服务时间内
  RETURN current_time BETWEEN dest_record.service_start_time AND dest_record.service_end_time;
END;
$$;

-- 6. 创建司机状态更新函数
CREATE OR REPLACE FUNCTION public.update_driver_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- 7. 创建触发器
CREATE TRIGGER update_driver_status_trigger
    AFTER UPDATE ON public.ride_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_driver_status();

-- 8. 创建自动恢复司机状态的函数
CREATE OR REPLACE FUNCTION public.auto_update_vehicle_availability()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 将已过期的忙碌车辆状态改为可用
  UPDATE public.vehicles 
  SET current_status = 'available'
  WHERE current_status = 'busy' 
  AND last_trip_end_time < now();
END;
$$;

-- 9. 更新 RLS 策略 - preset_destinations
DROP POLICY IF EXISTS "Community admins can create destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Community admins can manage their destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Anyone can view active destinations" ON public.preset_destinations;

CREATE POLICY "Users can view approved destinations in their area" 
ON public.preset_destinations 
FOR SELECT 
USING (approval_status = 'approved' AND is_active = true);

CREATE POLICY "Community admins can create destinations" 
ON public.preset_destinations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Super admins can manage all destinations" 
ON public.preset_destinations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid()::uuid 
    AND role = 'admin'
  )
);

CREATE POLICY "Community admins can manage their approved destinations" 
ON public.preset_destinations 
FOR UPDATE 
USING (
  approval_status = 'approved' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid()::uuid 
    AND destination_id = preset_destinations.id
    AND role = 'owner'
  )
);

-- 10. 更新 RLS 策略 - vehicles
DROP POLICY IF EXISTS "Community admins can manage destination vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Anyone can view active destination vehicles" ON public.vehicles;

CREATE POLICY "Users can view vehicles in their destination" 
ON public.vehicles 
FOR SELECT 
USING (
  is_active = true 
  AND user_has_destination_access(auth.uid()::uuid, destination_id)
);

CREATE POLICY "Community admins can manage their destination vehicles" 
ON public.vehicles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid()::uuid 
    AND destination_id = vehicles.destination_id
    AND role = 'owner'
  )
);

CREATE POLICY "Drivers can update their own vehicle status" 
ON public.vehicles 
FOR UPDATE 
USING (
  user_id = (
    SELECT id FROM public.users 
    WHERE access_code = auth.uid()::uuid
  )
);

-- 11. 更新 RLS 策略 - ride_requests
DROP POLICY IF EXISTS "Anyone can view basic ride info" ON public.ride_requests;
DROP POLICY IF EXISTS "Anyone can insert ride requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Users can update ride requests with proper authorization" ON public.ride_requests;

CREATE POLICY "Users can view ride requests in their destination" 
ON public.ride_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = auth.uid()::uuid 
    AND fr.id = ride_requests.fixed_route_id
  ) 
  OR 
  access_code = auth.uid()::uuid
);

CREATE POLICY "Users can create ride requests in service time" 
ON public.ride_requests 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fixed_routes fr
    WHERE fr.id = fixed_route_id 
    AND is_service_time_active(fr.destination_id)
  )
);

CREATE POLICY "Authorized users can update ride requests" 
ON public.ride_requests 
FOR UPDATE 
USING (
  access_code = auth.uid()::uuid 
  OR 
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = auth.uid()::uuid 
    AND fr.id = ride_requests.fixed_route_id
    AND u.role IN ('owner', 'driver')
  )
);

-- 12. 更新已有目的地为已批准状态（兼容现有数据）
UPDATE public.preset_destinations 
SET approval_status = 'approved' 
WHERE approval_status = 'pending';

-- 13. 为现有车辆设置默认工作状态
UPDATE public.vehicles 
SET current_status = 'available' 
WHERE current_status = 'offline';