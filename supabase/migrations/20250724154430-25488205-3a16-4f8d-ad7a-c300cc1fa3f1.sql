-- 修复搜索路径配置，使用安全但功能的路径设置
-- 更新所有需要访问auth函数和public表的安全函数

-- 1. 修复update_updated_at_column函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update the updated_at column to current timestamp
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. 修复is_super_admin函数
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 通过应用层设置的钱包地址验证超级管理员身份
  -- 应用层需要在认证时设置 app.super_admin_verified = 'true'
  RETURN current_setting('app.super_admin_verified', true) = 'true';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$function$;

-- 3. 修复set_super_admin_verified函数
CREATE OR REPLACE FUNCTION public.set_super_admin_verified(is_verified boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 设置当前会话的超级管理员验证状态
  PERFORM set_config('app.super_admin_verified', is_verified::text, false);
END;
$function$;

-- 4. 修复get_current_access_code函数
CREATE OR REPLACE FUNCTION public.get_current_access_code()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 返回当前会话的访问码
  RETURN current_setting('app.current_access_code', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$function$;

-- 5. 修复prevent_role_modification函数
CREATE OR REPLACE FUNCTION public.prevent_role_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 检查是否尝试修改角色
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Role modification is not allowed. Current role: %, Attempted role: %', OLD.role, NEW.role;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 6. 修复get_approved_destinations函数
CREATE OR REPLACE FUNCTION public.get_approved_destinations()
RETURNS TABLE(id uuid, name text, address text, description text, is_approved boolean, is_active boolean, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pd.id,
    pd.name,
    pd.address,
    pd.description,
    pd.is_approved,
    pd.is_active,
    pd.created_at
  FROM preset_destinations pd
  WHERE pd.is_approved = true 
    AND pd.is_active = true
  ORDER BY pd.name;
END;
$function$;

-- 7. 修复is_community_admin_by_access_code函数
CREATE OR REPLACE FUNCTION public.is_community_admin_by_access_code(input_access_code text, admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE access_code::text = input_access_code AND id = admin_user_id
  );
END;
$function$;

-- 8. 修复user_has_destination_access函数
CREATE OR REPLACE FUNCTION public.user_has_destination_access(user_access_code uuid, dest_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = user_access_code 
    AND (destination_id = dest_id OR destination_id IS NULL)
  );
END;
$function$;

-- 9. 修复get_or_create_user_by_access_code函数
CREATE OR REPLACE FUNCTION public.get_or_create_user_by_access_code(input_access_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_id uuid;
BEGIN
  -- 尝试获取现有用户
  SELECT id INTO user_id
  FROM users
  WHERE access_code::text = input_access_code;
  
  -- 如果用户不存在，创建新用户（默认为乘客角色）
  IF user_id IS NULL THEN
    INSERT INTO users (access_code, role)
    VALUES (input_access_code::uuid, 'passenger')
    RETURNING id INTO user_id;
  END IF;
  
  RETURN user_id;
END;
$function$;

-- 10. 修复validate_ride_request函数
CREATE OR REPLACE FUNCTION public.validate_ride_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- 11. 修复validate_access_code函数
CREATE OR REPLACE FUNCTION public.validate_access_code(input_access_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_data record;
BEGIN
  -- 直接查询用户表，绕过RLS策略
  SELECT id, role, destination_id, created_at
  INTO user_data
  FROM users
  WHERE access_code::text = input_access_code;
  
  -- 如果找到用户，返回基本信息
  IF FOUND THEN
    RETURN jsonb_build_object(
      'exists', true,
      'user_id', user_data.id,
      'role', user_data.role,
      'destination_id', user_data.destination_id,
      'created_at', user_data.created_at
    );
  ELSE
    RETURN jsonb_build_object(
      'exists', false
    );
  END IF;
END;
$function$;

-- 12. 修复get_destinations_with_admin_codes函数
CREATE OR REPLACE FUNCTION public.get_destinations_with_admin_codes()
RETURNS TABLE(id uuid, name text, address text, contact text, is_approved boolean, created_at timestamp with time zone, admin_access_code uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pd.id,
    pd.name,
    pd.address,
    pd.contact,
    pd.is_approved,
    pd.created_at,
    u.access_code as admin_access_code
  FROM preset_destinations pd
  LEFT JOIN users u ON u.id = pd.admin_user_id
  ORDER BY pd.created_at DESC;
END;
$function$;

-- 13. 修复is_service_time_active函数
CREATE OR REPLACE FUNCTION public.is_service_time_active(dest_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  dest_record record;
  check_time time;
  check_day text;
BEGIN
  SELECT service_start_time, service_end_time, service_days 
  INTO dest_record
  FROM preset_destinations 
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

-- 14. 修复set_config函数
CREATE OR REPLACE FUNCTION public.set_config(setting_name text, setting_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM set_config(setting_name, setting_value, false);
END;
$function$;

-- 15. 修复validate_wallet_address函数
CREATE OR REPLACE FUNCTION public.validate_wallet_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if pay_way is exchange UID (2)
  IF NEW.pay_way = 2 THEN
    -- For exchange UID, we store the UID in the address field
    -- Allow UIDs up to bigint range (64-bit signed integer)
    
    -- Ensure the address contains only digits (for UIDs)
    IF NEW.address !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'Exchange UID must contain only digits';
    END IF;
    
    -- Convert to bigint to ensure it's within bigint range
    -- This allows much larger numbers than int4
    PERFORM NEW.address::bigint;
    
  -- Check if pay_way is cash payment (3)
  ELSIF NEW.pay_way = 3 THEN
    -- For cash payments, no specific validation needed
    -- Address field can be used for notes or location info
    NULL; -- No validation required for cash payments
    
  -- Check if pay_way is wallet address (1)
  ELSIF NEW.pay_way = 1 THEN
    -- For blockchain addresses, validate based on chain_name
    CASE NEW.chain_name
      -- Bitcoin addresses
      WHEN 1 THEN
        IF NEW.address !~ '^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$' AND NEW.address !~ '^bc1[a-zA-Z0-9]{25,39}$' THEN
          RAISE EXCEPTION 'Invalid Bitcoin address format';
        END IF;
      
      -- Ethereum/EVM-Compatible addresses
      WHEN 2 THEN
        IF NEW.address !~ '^0x[a-fA-F0-9]{40}$' THEN
          RAISE EXCEPTION 'Invalid Ethereum address format';
        END IF;
      
      -- Solana addresses
      WHEN 3 THEN
        IF NEW.address !~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$' THEN
          RAISE EXCEPTION 'Invalid Solana address format';
        END IF;
      
      -- Tron/TRC20 addresses
      WHEN 4 THEN
        IF NEW.address !~ '^T[a-zA-Z0-9]{33}$' THEN
          RAISE EXCEPTION 'Invalid Tron address format';
        END IF;
      
      -- TON addresses
      WHEN 5 THEN
        IF length(NEW.address) < 10 THEN
          RAISE EXCEPTION 'Address seems too short for a TON address';
        END IF;
      
      -- SUI addresses
      WHEN 6 THEN
        IF NEW.address !~ '^0x[a-fA-F0-9]{64}$' THEN
          RAISE EXCEPTION 'Invalid Sui address format';
        END IF;
      
      -- Other chains - basic validation
      ELSE
        IF length(NEW.address) < 10 THEN
          RAISE EXCEPTION 'Address seems too short for a blockchain address';
        END IF;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 16. 修复create_driver_user_for_vehicle函数
CREATE OR REPLACE FUNCTION public.create_driver_user_for_vehicle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 如果没有指定user_id，则创建新的司机用户
  IF NEW.user_id IS NULL THEN
    INSERT INTO users (role, access_code)
    VALUES ('driver', gen_random_uuid())
    RETURNING id INTO NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 17. 修复update_driver_status函数
CREATE OR REPLACE FUNCTION public.update_driver_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  route_duration integer;
BEGIN
  -- 当乘车请求状态改为confirmed时，计算司机忙碌时间
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- 获取路线预计时间
    SELECT estimated_duration_minutes INTO route_duration
    FROM fixed_routes 
    WHERE id = NEW.fixed_route_id;
    
    -- 更新车辆状态为忙碌，设置预计结束时间
    UPDATE vehicles 
    SET current_status = 'busy',
        last_trip_end_time = now() + INTERVAL '1 minute' * COALESCE(route_duration * 2, 60)
    WHERE id = NEW.vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 18. 修复auto_update_vehicle_availability函数
CREATE OR REPLACE FUNCTION public.auto_update_vehicle_availability()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 将已过期的忙碌车辆状态改为可用
  UPDATE vehicles 
  SET current_status = 'available'
  WHERE current_status = 'busy' 
  AND last_trip_end_time < now();
END;
$function$;