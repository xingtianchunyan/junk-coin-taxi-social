-- 创建一个函数来检查访问码是否对应社区管理员
CREATE OR REPLACE FUNCTION public.is_community_admin_by_access_code(input_access_code text, admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code::text = input_access_code AND id = admin_user_id
  );
END;
$$;

-- 更新预设目的地策略
DROP POLICY IF EXISTS "Community admins can manage their destinations" ON public.preset_destinations;
CREATE POLICY "Community admins can manage their destinations" 
ON public.preset_destinations 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 更新固定路线策略  
DROP POLICY IF EXISTS "Community admins can manage destination routes" ON public.fixed_routes;
CREATE POLICY "Community admins can manage destination routes" 
ON public.fixed_routes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 更新车辆策略
DROP POLICY IF EXISTS "Community admins can manage destination vehicles" ON public.vehicles;
CREATE POLICY "Community admins can manage destination vehicles" 
ON public.vehicles 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 更新钱包地址策略
DROP POLICY IF EXISTS "Community admins can manage destination wallets" ON public.wallet_addresses;
CREATE POLICY "Community admins can manage destination wallets" 
ON public.wallet_addresses 
FOR ALL 
USING (true)
WITH CHECK (true);