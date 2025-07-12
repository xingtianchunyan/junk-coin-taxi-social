
-- 删除过于严格的管理员策略
DROP POLICY IF EXISTS "Admin manage fixed routes" ON public.fixed_routes;
DROP POLICY IF EXISTS "Admin manage destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Admin manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admin manage wallet addresses" ON public.wallet_addresses;

-- 为社区管理员重新建立适当的策略
-- 预设目的地 - 允许社区管理员管理自己的目的地
CREATE POLICY "Community admins can manage their destinations" 
ON public.preset_destinations 
FOR ALL 
USING (
  admin_user_id IN (
    SELECT id FROM public.users 
    WHERE access_code::text = current_setting('request.jwt.claims', true)::json->>'access_code'
  )
)
WITH CHECK (
  admin_user_id IN (
    SELECT id FROM public.users 
    WHERE access_code::text = current_setting('request.jwt.claims', true)::json->>'access_code'
  )
);

-- 允许社区管理员创建新的目的地
CREATE POLICY "Community admins can create destinations" 
ON public.preset_destinations 
FOR INSERT 
WITH CHECK (true);

-- 固定路线 - 允许社区管理员管理其目的地下的路线
CREATE POLICY "Community admins can manage destination routes" 
ON public.fixed_routes 
FOR ALL 
USING (
  destination_id IN (
    SELECT id FROM public.preset_destinations 
    WHERE admin_user_id IN (
      SELECT id FROM public.users 
      WHERE access_code::text = current_setting('request.jwt.claims', true)::json->>'access_code'
    )
  )
)
WITH CHECK (
  destination_id IN (
    SELECT id FROM public.preset_destinations 
    WHERE admin_user_id IN (
      SELECT id FROM public.users 
      WHERE access_code::text = current_setting('request.jwt.claims', true)::json->>'access_code'
    )
  )
);

-- 车辆 - 允许社区管理员管理其目的地下的车辆
CREATE POLICY "Community admins can manage destination vehicles" 
ON public.vehicles 
FOR ALL 
USING (
  destination_id IN (
    SELECT id FROM public.preset_destinations 
    WHERE admin_user_id IN (
      SELECT id FROM public.users 
      WHERE access_code::text = current_setting('request.jwt.claims', true)::json->>'access_code'
    )
  )
)
WITH CHECK (
  destination_id IN (
    SELECT id FROM public.preset_destinations 
    WHERE admin_user_id IN (
      SELECT id FROM public.users 
      WHERE access_code::text = current_setting('request.jwt.claims', true)::json->>'access_code'
    )
  )
);

-- 钱包地址 - 允许社区管理员管理其目的地下的支付方式
CREATE POLICY "Community admins can manage destination wallets" 
ON public.wallet_addresses 
FOR ALL 
USING (
  destination_id IN (
    SELECT id FROM public.preset_destinations 
    WHERE admin_user_id IN (
      SELECT id FROM public.users 
      WHERE access_code::text = current_setting('request.jwt.claims', true)::json->>'access_code'
    )
  )
)
WITH CHECK (
  destination_id IN (
    SELECT id FROM public.preset_destinations 
    WHERE admin_user_id IN (
      SELECT id FROM public.users 
      WHERE access_code::text = current_setting('request.jwt.claims', true)::json->>'access_code'
    )
  )
);
