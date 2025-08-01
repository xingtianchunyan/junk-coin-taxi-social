-- 首先修复访问码会话设置功能
CREATE OR REPLACE FUNCTION public.set_current_access_code(input_access_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 设置当前会话的访问码
  PERFORM set_config('app.current_access_code', input_access_code, false);
END;
$function$;

-- 修复角色选择问题，为新用户确保正确的角色设置
CREATE OR REPLACE FUNCTION public.ensure_user_role_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 确保角色更新时的正确性
  IF NEW.role IS NOT NULL AND OLD.role IS NULL THEN
    -- 第一次设置角色，允许更新
    RETURN NEW;
  ELSIF NEW.role IS NOT NULL AND OLD.role IS NOT NULL AND NEW.role != OLD.role THEN
    -- 角色已存在且试图修改，需要特殊权限
    IF NOT is_super_admin() THEN
      RAISE EXCEPTION 'Role modification requires super admin privileges';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 重新创建用户表的角色更新触发器
DROP TRIGGER IF EXISTS prevent_role_modification_trigger ON users;
CREATE TRIGGER ensure_user_role_update_trigger
BEFORE UPDATE OF role ON users
FOR EACH ROW
EXECUTE FUNCTION ensure_user_role_update();

-- 修复RLS策略，简化用户权限检查
DROP POLICY IF EXISTS "Users can update own data except role" ON users;
CREATE POLICY "Users can update own data including role"
ON users
FOR UPDATE
USING (access_code::text = current_setting('app.current_access_code', true))
WITH CHECK (access_code::text = current_setting('app.current_access_code', true));

-- 修复preset_destinations的RLS策略，确保只有已审批的目的地对乘客可见
DROP POLICY IF EXISTS "All roles can view approved destinations" ON preset_destinations;
CREATE POLICY "All roles can view approved destinations"
ON preset_destinations
FOR SELECT
USING (
  (is_approved = true AND is_active = true) OR
  (admin_user_id IN (
    SELECT id FROM users 
    WHERE access_code::text = current_setting('app.current_access_code', true)
    AND role = 'community_admin'
  )) OR
  is_super_admin()
);

-- 修复ride_requests的RLS策略，简化权限检查
DROP POLICY IF EXISTS "All authenticated users can create ride requests" ON ride_requests;
CREATE POLICY "Users can create ride requests"
ON ride_requests
FOR INSERT
WITH CHECK (
  access_code::text = current_setting('app.current_access_code', true)
);

-- 确保vehicle表的权限正确
DROP POLICY IF EXISTS "Community admins can manage vehicles" ON vehicles;
CREATE POLICY "Community admins can manage vehicles"
ON vehicles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code::text = current_setting('app.current_access_code', true)
    AND role = 'community_admin'
  )
);

-- 修复fixed_routes的权限策略
DROP POLICY IF EXISTS "Community admins manage routes" ON fixed_routes;
CREATE POLICY "Community admins manage routes"
ON fixed_routes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code::text = current_setting('app.current_access_code', true)
    AND role = 'community_admin'
  ) OR is_super_admin()
);