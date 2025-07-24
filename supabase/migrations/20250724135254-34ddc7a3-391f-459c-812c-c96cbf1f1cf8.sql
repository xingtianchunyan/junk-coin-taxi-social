-- 创建触发器函数来防止角色修改
CREATE OR REPLACE FUNCTION public.prevent_role_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- 检查是否尝试修改角色
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Role modification is not allowed. Current role: %, Attempted role: %', OLD.role, NEW.role;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

-- 在users表上创建触发器
CREATE TRIGGER prevent_role_modification_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_modification();