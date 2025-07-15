-- 阶段一：数据库字段补充 (修复版)

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

-- 5. 创建时间段验证函数（修复变量名）
CREATE OR REPLACE FUNCTION public.is_service_time_active(dest_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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