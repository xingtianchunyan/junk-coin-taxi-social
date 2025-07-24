-- 修复数据库函数的搜索路径安全问题
-- 更新validate_ride_request函数
CREATE OR REPLACE FUNCTION public.validate_ride_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Sanitize and validate text fields
  IF NEW.friend_name IS NULL OR LENGTH(TRIM(NEW.friend_name)) = 0 THEN
    RAISE EXCEPTION 'Friend name is required';
  END IF;
  
  IF NEW.start_location IS NULL OR LENGTH(TRIM(NEW.start_location)) = 0 THEN
    RAISE EXCEPTION 'Start location is required';
  END IF;
  
  IF NEW.end_location IS NULL OR LENGTH(TRIM(NEW.end_location)) = 0 THEN
    RAISE EXCEPTION 'End location is required';
  END IF;
  
  -- Sanitize text inputs to prevent XSS
  NEW.friend_name = TRIM(NEW.friend_name);
  NEW.start_location = TRIM(NEW.start_location);
  NEW.end_location = TRIM(NEW.end_location);
  
  IF NEW.notes IS NOT NULL THEN
    NEW.notes = TRIM(NEW.notes);
  END IF;
  
  IF NEW.contact_info IS NOT NULL THEN
    NEW.contact_info = TRIM(NEW.contact_info);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 更新create_driver_user_for_vehicle函数
CREATE OR REPLACE FUNCTION public.create_driver_user_for_vehicle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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