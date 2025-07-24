-- 修复最后一个数据库函数的搜索路径安全问题
CREATE OR REPLACE FUNCTION public.update_driver_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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