-- 第一步：为 preset_destinations 表添加 admin_user_id 字段
ALTER TABLE public.preset_destinations 
ADD COLUMN admin_user_id UUID REFERENCES public.users(id);

-- 为现有的两个目的地设置对应的管理员
UPDATE public.preset_destinations 
SET admin_user_id = (SELECT id FROM public.users WHERE access_code = 'd292568b-b187-4e9a-a96a-ba8f39848a31'::uuid)
WHERE name = 'DN黄山';

UPDATE public.preset_destinations 
SET admin_user_id = (SELECT id FROM public.users WHERE access_code = '94aec8aa-0532-442c-97c0-d80664026d3a'::uuid)
WHERE name = '屏南县村庄群';

-- 第二步：为 fixed_routes 表添加 destination_id 字段
ALTER TABLE public.fixed_routes 
ADD COLUMN destination_id UUID REFERENCES public.preset_destinations(id);

-- 第三步：为 vehicles 表添加 destination_id 字段
ALTER TABLE public.vehicles 
ADD COLUMN destination_id UUID REFERENCES public.preset_destinations(id);

-- 第四步：为 wallet_addresses 表添加 destination_id 字段
ALTER TABLE public.wallet_addresses 
ADD COLUMN destination_id UUID REFERENCES public.preset_destinations(id);

-- 第五步：更新 preset_destinations 的RLS策略
DROP POLICY IF EXISTS "Anyone can view active destinations" ON public.preset_destinations;

CREATE POLICY "Anyone can view active destinations" 
  ON public.preset_destinations 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Community admins can manage their destinations" 
  ON public.preset_destinations 
  FOR ALL 
  USING (admin_user_id = (SELECT id FROM public.users WHERE access_code::text = current_setting('request.jwt.claims', true)::json->>'access_code'));

-- 第六步：更新 fixed_routes 的RLS策略
DROP POLICY IF EXISTS "Anyone can view active fixed routes" ON public.fixed_routes;
DROP POLICY IF EXISTS "Allow system to insert fixed routes" ON public.fixed_routes;
DROP POLICY IF EXISTS "Allow system to update fixed routes" ON public.fixed_routes;

CREATE POLICY "Anyone can view active destination routes" 
  ON public.fixed_routes 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Community admins can manage their destination routes" 
  ON public.fixed_routes 
  FOR ALL 
  USING (destination_id IN (SELECT id FROM public.preset_destinations WHERE admin_user_id = (SELECT id FROM public.users WHERE access_code::text = current_setting('request.jwt.claims', true)::json->>'access_code')));

-- 第七步：更新 vehicles 的RLS策略
DROP POLICY IF EXISTS "Anyone can view active vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Only admins can manage vehicles" ON public.vehicles;

CREATE POLICY "Anyone can view active destination vehicles" 
  ON public.vehicles 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Community admins can manage their destination vehicles" 
  ON public.vehicles 
  FOR ALL 
  USING (destination_id IN (SELECT id FROM public.preset_destinations WHERE admin_user_id = (SELECT id FROM public.users WHERE access_code::text = current_setting('request.jwt.claims', true)::json->>'access_code')));

-- 第八步：更新 wallet_addresses 的RLS策略
DROP POLICY IF EXISTS "Anyone can view active wallet addresses" ON public.wallet_addresses;
DROP POLICY IF EXISTS "Only admins can insert wallet addresses" ON public.wallet_addresses;
DROP POLICY IF EXISTS "Only admins can update wallet addresses" ON public.wallet_addresses;

CREATE POLICY "Anyone can view active destination wallets" 
  ON public.wallet_addresses 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Community admins can manage their destination wallets" 
  ON public.wallet_addresses 
  FOR ALL 
  USING (destination_id IN (SELECT id FROM public.preset_destinations WHERE admin_user_id = (SELECT id FROM public.users WHERE access_code::text = current_setting('request.jwt.claims', true)::json->>'access_code')));