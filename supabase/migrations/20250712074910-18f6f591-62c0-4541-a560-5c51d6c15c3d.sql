-- 创建一个函数来根据访问码获取用户ID，如果用户不存在则创建
CREATE OR REPLACE FUNCTION public.get_or_create_user_by_access_code(input_access_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;