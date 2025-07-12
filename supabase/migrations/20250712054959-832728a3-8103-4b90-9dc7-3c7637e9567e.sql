
-- 清理不再需要的字段和功能
-- 1. 从 ride_requests 表中删除支付相关的自动检测字段
ALTER TABLE public.ride_requests 
DROP COLUMN IF EXISTS sender_wallet_address,
DROP COLUMN IF EXISTS payment_blockchain;

-- 2. 删除自动生成路线相关的策略（如果存在过于宽松的临时策略）
DROP POLICY IF EXISTS "Allow system to insert fixed routes" ON public.fixed_routes;
DROP POLICY IF EXISTS "Allow system to update fixed routes" ON public.fixed_routes;
DROP POLICY IF EXISTS "Temporary: Anyone can manage routes" ON public.fixed_routes;
DROP POLICY IF EXISTS "Temporary: Anyone can manage destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Temporary: Anyone can manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Temporary: Anyone can manage wallets" ON public.wallet_addresses;

-- 3. 重新建立更严格的 RLS 策略
-- 固定路线 - 只允许查看活动路线，管理需要管理员权限
CREATE POLICY "View active fixed routes" 
ON public.fixed_routes 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin manage fixed routes" 
ON public.fixed_routes 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 预设目的地 - 只允许查看活动目的地，管理需要管理员权限
CREATE POLICY "View active destinations" 
ON public.preset_destinations 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin manage destinations" 
ON public.preset_destinations 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 车辆 - 只允许查看活动车辆，管理需要管理员权限
CREATE POLICY "View active vehicles" 
ON public.vehicles 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin manage vehicles" 
ON public.vehicles 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 钱包地址 - 只允许查看活动钱包，管理需要管理员权限
CREATE POLICY "View active wallet addresses" 
ON public.wallet_addresses 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin manage wallet addresses" 
ON public.wallet_addresses 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
