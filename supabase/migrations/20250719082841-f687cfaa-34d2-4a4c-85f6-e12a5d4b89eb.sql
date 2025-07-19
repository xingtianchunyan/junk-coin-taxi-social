-- 创建验证访问码的安全函数，绕过RLS限制
CREATE OR REPLACE FUNCTION public.validate_access_code(input_access_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_data record;
BEGIN
  -- 直接查询用户表，绕过RLS策略
  SELECT id, role, destination_id, created_at
  INTO user_data
  FROM public.users
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
$$;