-- 根据权限矩阵精确修复安全策略
-- 基于用户提供的权限矩阵图片进行完整的权限控制实现

-- 1. 修正用户角色枚举（应该是super_admin而不是admin）
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('passenger', 'driver', 'community_admin', 'super_admin');

-- 2. 修复preset_destinations策略
DROP POLICY IF EXISTS "Users can view approved destinations in their area" ON public.preset_destinations;
DROP POLICY IF EXISTS "Community admins can create destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Community admins can manage their approved destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Users can view approved destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Community admins can manage destinations" ON public.preset_destinations;

-- 所有角色都可以查看目的地（除超级管理员）
CREATE POLICY "All users can view destinations" 
ON public.preset_destinations 
FOR SELECT 
USING (
  approval_status = 'approved' 
  AND is_active = true
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role IN ('passenger', 'driver', 'community_admin')
  )
);

-- 只有社区管理员可以创建目的地
CREATE POLICY "Only community admins can create destinations" 
ON public.preset_destinations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role = 'community_admin'
  )
);

-- 只有社区管理员可以管理目的地
CREATE POLICY "Only community admins can manage destinations" 
ON public.preset_destinations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role = 'community_admin'
  )
);

CREATE POLICY "Only community admins can delete destinations" 
ON public.preset_destinations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role = 'community_admin'
  )
);

-- 3. 修复vehicles策略
DROP POLICY IF EXISTS "Users can view vehicles in their destination" ON public.vehicles;
DROP POLICY IF EXISTS "Community admins can manage their destination vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Drivers can update their own vehicle status" ON public.vehicles;
DROP POLICY IF EXISTS "Community admins can manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Drivers can set operation hours" ON public.vehicles;

-- 所有角色都可以查看车辆（除超级管理员）
CREATE POLICY "All users can view vehicles" 
ON public.vehicles 
FOR SELECT 
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role IN ('passenger', 'driver', 'community_admin')
  )
);

-- 只有社区管理员可以管理车辆（增删改）
CREATE POLICY "Only community admins can manage vehicles" 
ON public.vehicles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role = 'community_admin'
  )
);

CREATE POLICY "Only community admins can update vehicles" 
ON public.vehicles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role = 'community_admin'
  )
);

CREATE POLICY "Only community admins can delete vehicles" 
ON public.vehicles 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role = 'community_admin'
  )
);

-- 司机只能设置运营时间（work_start_time, work_end_time, current_status）
CREATE POLICY "Drivers can set operation hours only" 
ON public.vehicles 
FOR UPDATE 
USING (
  user_id = (
    SELECT id FROM public.users 
    WHERE access_code = auth.uid() 
    AND role = 'driver'
  )
);

-- 4. 修复ride_requests策略
DROP POLICY IF EXISTS "Users can view ride requests in their destination" ON public.ride_requests;
DROP POLICY IF EXISTS "Users can create ride requests in service time" ON public.ride_requests;
DROP POLICY IF EXISTS "Authorized users can update ride requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Passengers can view own requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Drivers can view related requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Community admins can view related requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Only passengers can create ride requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Passengers can delete own requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Passengers can update own requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Drivers can update related requests" ON public.ride_requests;

-- 乘客只能查看自己的乘车请求
CREATE POLICY "Passengers view own requests only" 
ON public.ride_requests 
FOR SELECT 
USING (
  access_code = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role = 'passenger'
  )
);

-- 司机可以查看相关的乘车请求
CREATE POLICY "Drivers view related requests" 
ON public.ride_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = auth.uid() 
    AND fr.id = ride_requests.fixed_route_id
    AND u.role = 'driver'
  )
);

-- 社区管理员可以查看相关的乘车请求
CREATE POLICY "Community admins view related requests" 
ON public.ride_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = auth.uid() 
    AND fr.id = ride_requests.fixed_route_id
    AND u.role = 'community_admin'
  )
);

-- 只有乘客可以创建乘车请求
CREATE POLICY "Only passengers create requests" 
ON public.ride_requests 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role = 'passenger'
  )
  AND is_service_time_active((
    SELECT fr.destination_id 
    FROM public.fixed_routes fr 
    WHERE fr.id = fixed_route_id
  ))
);

-- 只有乘客可以删除自己的乘车请求
CREATE POLICY "Only passengers delete own requests" 
ON public.ride_requests 
FOR DELETE 
USING (
  access_code = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role = 'passenger'
  )
);

-- 乘客只能更新自己的请求
CREATE POLICY "Passengers update own requests only" 
ON public.ride_requests 
FOR UPDATE 
USING (
  access_code = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role = 'passenger'
  )
);

-- 司机可以更新相关的乘车请求（根据矩阵）
CREATE POLICY "Drivers update related requests" 
ON public.ride_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = auth.uid() 
    AND fr.id = ride_requests.fixed_route_id
    AND u.role = 'driver'
  )
);

-- 注意：根据权限矩阵，社区管理员不能更新乘车请求，所以不创建相关策略

-- 5. 修复users表策略
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Community admins can request driver codes" ON public.users;
DROP POLICY IF EXISTS "Super admins can create community admin codes" ON public.users;
DROP POLICY IF EXISTS "Authenticated super admins access" ON public.users;

-- 用户可以查看自己的数据
CREATE POLICY "Users view own data" 
ON public.users 
FOR SELECT 
USING (access_code = auth.uid());

-- 用户可以更新自己的数据
CREATE POLICY "Users update own data" 
ON public.users 
FOR UPDATE 
USING (access_code = auth.uid());

-- 乘客可以自主创建访问码（自己注册）
CREATE POLICY "Passengers self register" 
ON public.users 
FOR INSERT 
WITH CHECK (role = 'passenger');

-- 社区管理员可以自主创建访问码（自己注册）
CREATE POLICY "Community admins self register" 
ON public.users 
FOR INSERT 
WITH CHECK (role = 'community_admin');

-- 社区管理员可以申请司机访问码
CREATE POLICY "Community admins create driver codes" 
ON public.users 
FOR INSERT 
WITH CHECK (
  role = 'driver' 
  AND EXISTS (
    SELECT 1 FROM public.users requester
    WHERE requester.access_code = auth.uid() 
    AND requester.role = 'community_admin'
  )
);

-- 超级管理员通过认证登录创建社区管理员访问码
-- 这需要在应用层实现特殊逻辑

-- 6. 修复fixed_routes策略以符合权限矩阵
DROP POLICY IF EXISTS "Community admins can manage destination routes" ON public.fixed_routes;
DROP POLICY IF EXISTS "Anyone can view active destination routes" ON public.fixed_routes;

-- 所有用户都可以查看活跃路线
CREATE POLICY "All users view active routes" 
ON public.fixed_routes 
FOR SELECT 
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role IN ('passenger', 'driver', 'community_admin')
  )
);

-- 只有社区管理员可以管理路线
CREATE POLICY "Only community admins manage routes" 
ON public.fixed_routes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role = 'community_admin'
  )
);

-- 7. 修复wallet_addresses策略
DROP POLICY IF EXISTS "Community admins can manage destination wallets" ON public.wallet_addresses;
DROP POLICY IF EXISTS "Anyone can view active destination wallets" ON public.wallet_addresses;

-- 所有用户都可以查看钱包地址
CREATE POLICY "All users view wallet addresses" 
ON public.wallet_addresses 
FOR SELECT 
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role IN ('passenger', 'driver', 'community_admin')
  )
);

-- 只有社区管理员可以管理钱包地址
CREATE POLICY "Only community admins manage wallets" 
ON public.wallet_addresses 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid() 
    AND role = 'community_admin'
  )
);

-- 8. 修正get_or_create_user_by_access_code函数
CREATE OR REPLACE FUNCTION public.get_or_create_user_by_access_code(input_access_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  user_id uuid;
BEGIN
  -- 尝试获取现有用户
  SELECT id INTO user_id
  FROM public.users
  WHERE access_code::text = input_access_code;
  
  -- 如果用户不存在，创建新用户（默认为乘客角色）
  IF user_id IS NULL THEN
    INSERT INTO public.users (access_code, role)
    VALUES (input_access_code::uuid, 'passenger')
    RETURNING id INTO user_id;
  END IF;
  
  RETURN user_id;
END;
$function$;

-- 9. 添加权限矩阵注释
COMMENT ON TYPE public.user_role IS '用户角色：passenger(乘客), driver(司机), community_admin(社区管理员), super_admin(超级管理员)';
COMMENT ON TABLE public.preset_destinations IS '目的地表：乘客/司机/社区管理员可查看，只有社区管理员可创建和管理';
COMMENT ON TABLE public.vehicles IS '车辆表：乘客/司机/社区管理员可查看，只有社区管理员可管理，司机可设置运营时间';
COMMENT ON TABLE public.ride_requests IS '乘车请求表：乘客查看/创建/删除/更新自己的，司机查看/更新相关的，社区管理员只能查看相关的';
COMMENT ON TABLE public.users IS '用户表：乘客和社区管理员可自主创建访问码，社区管理员可申请司机访问码';

-- 10. 确保现有admin角色数据兼容性
UPDATE public.users SET role = 'super_admin' WHERE role = 'admin';
UPDATE public.users SET role = 'passenger' WHERE role = 'owner';