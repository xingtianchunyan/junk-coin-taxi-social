-- 修复auto_update_vehicle_availability函数的搜索路径安全问题
CREATE OR REPLACE FUNCTION public.auto_update_vehicle_availability()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- 将已过期的忙碌车辆状态改为可用
  UPDATE public.vehicles 
  SET current_status = 'available'
  WHERE current_status = 'busy' 
  AND last_trip_end_time < now();
END;
$function$;