-- 修复SuperAdmin页面的目的地和管理员访问码关联显示问题
-- 删除旧的RLS策略并创建新的更灵活的策略

-- 1. 删除preset_destinations表的旧策略
DROP POLICY IF EXISTS "Super admins can view all destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Community admins can view own destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "All roles can view approved destinations" ON public.preset_destinations;

-- 2. 创建新的preset_destinations策略
CREATE POLICY "Super admins can view all destinations" 
ON public.preset_destinations 
FOR SELECT 
USING (is_super_admin());

CREATE POLICY "All roles can view approved destinations" 
ON public.preset_destinations 
FOR SELECT 
USING (
  (is_approved = true AND is_active = true) OR
  (EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = get_current_access_code() 
    AND role = ANY(ARRAY['passenger', 'driver', 'community_admin'])
  ))
);

-- 3. 删除vehicles表的旧策略
DROP POLICY IF EXISTS "Passengers can view active vehicles in service time" ON public.vehicles;
DROP POLICY IF EXISTS "Drivers and admins can view active vehicles" ON public.vehicles;

-- 4. 创建新的vehicles策略
CREATE POLICY "All authenticated users can view vehicles" 
ON public.vehicles 
FOR SELECT 
USING (
  is_active = true AND (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE access_code = get_current_access_code() 
      AND role = ANY(ARRAY['passenger', 'driver', 'community_admin'])
    )
  )
);

-- 5. 删除fixed_routes表的旧策略
DROP POLICY IF EXISTS "All roles view active routes" ON public.fixed_routes;

-- 6. 创建新的fixed_routes策略
CREATE POLICY "All authenticated users can view routes" 
ON public.fixed_routes 
FOR SELECT 
USING (
  is_active = true AND (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE access_code = get_current_access_code() 
      AND role = ANY(ARRAY['passenger', 'driver', 'community_admin'])
    )
  )
);

-- 7. 修复社区管理员角色策略问题
-- 删除users表的重复策略
DROP POLICY IF EXISTS "Users view own data by access code" ON public.users;
DROP POLICY IF EXISTS "Users update own data by access code" ON public.users;

-- 8. 创建函数来查询预设目的地及其关联的管理员访问码
CREATE OR REPLACE FUNCTION public.get_destinations_with_admin_codes()
RETURNS TABLE(
  id uuid,
  name text,
  address text,
  contact text,
  is_approved boolean,
  created_at timestamp with time zone,
  admin_access_code uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
  FROM public.preset_destinations pd
  LEFT JOIN public.users u ON u.id = pd.admin_user_id
  ORDER BY pd.created_at DESC;
END;
$$;