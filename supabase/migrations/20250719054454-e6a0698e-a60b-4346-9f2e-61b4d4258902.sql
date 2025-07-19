-- 创建函数获取当前访问码（仅用于非超级管理员角色）
CREATE OR REPLACE FUNCTION public.get_current_access_code()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- 返回当前会话的访问码
  RETURN current_setting('app.current_access_code', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- 重新创建用户表的RLS策略
DROP POLICY IF EXISTS "Users view own data" ON public.users;
DROP POLICY IF EXISTS "Users update own data" ON public.users;
DROP POLICY IF EXISTS "Passengers self register" ON public.users;
DROP POLICY IF EXISTS "Community admins self register" ON public.users;
DROP POLICY IF EXISTS "Community admins create driver codes" ON public.users;
DROP POLICY IF EXISTS "Super admins can view all community admin requests" ON public.users;
DROP POLICY IF EXISTS "Super admins can delete community admin requests" ON public.users;

-- 用户表新策略
CREATE POLICY "Users view own data by access code" 
ON public.users 
FOR SELECT 
USING (access_code = get_current_access_code());

CREATE POLICY "Users update own data by access code" 
ON public.users 
FOR UPDATE 
USING (access_code = get_current_access_code());

CREATE POLICY "Passengers self register by access code" 
ON public.users 
FOR INSERT 
WITH CHECK (role = 'passenger' AND access_code = get_current_access_code());

CREATE POLICY "Community admins self register by access code" 
ON public.users 
FOR INSERT 
WITH CHECK (role = 'community_admin' AND access_code = get_current_access_code());

CREATE POLICY "Community admins create driver codes" 
ON public.users 
FOR INSERT 
WITH CHECK (
  role = 'driver' AND 
  EXISTS (
    SELECT 1 FROM users requester 
    WHERE requester.access_code = get_current_access_code() 
    AND requester.role = 'community_admin'
  )
);

-- 保留超级管理员策略（不再管理社区管理员申请）
-- 超级管理员现在主要管理预设目的地的审批

-- 重新创建预设目的地表的RLS策略
DROP POLICY IF EXISTS "Super admins can view all destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Only community admins can create destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Only community admins can manage destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Only community admins can delete destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "All users can view destinations" ON public.preset_destinations;

-- 超级管理员策略：管理所有预设目的地的审批
CREATE POLICY "Super admins can view all destinations" 
ON public.preset_destinations 
FOR SELECT 
USING (is_super_admin());

CREATE POLICY "Super admins can approve destinations" 
ON public.preset_destinations 
FOR UPDATE 
USING (is_super_admin());

CREATE POLICY "Super admins can delete destinations" 
ON public.preset_destinations 
FOR DELETE 
USING (is_super_admin());

-- 社区管理员策略：只能创建预设目的地申请，不能直接管理
CREATE POLICY "Community admins can create destination requests" 
ON public.preset_destinations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role = 'community_admin'
  ) AND 
  is_approved = false  -- 创建时默认为未审批状态
);

-- 社区管理员只能查看自己创建的预设目的地
CREATE POLICY "Community admins can view own destinations" 
ON public.preset_destinations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role = 'community_admin'
    AND destination_id = preset_destinations.id
  )
);

-- 所有角色查看已批准的目的地
CREATE POLICY "All roles can view approved destinations" 
ON public.preset_destinations 
FOR SELECT 
USING (
  is_approved = true AND is_active = true AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role IN ('passenger', 'driver', 'community_admin')
  )
);

-- 重新创建固定路线表的RLS策略
DROP POLICY IF EXISTS "All users view active routes" ON public.fixed_routes;
DROP POLICY IF EXISTS "Only community admins manage routes" ON public.fixed_routes;

CREATE POLICY "All roles view active routes" 
ON public.fixed_routes 
FOR SELECT 
USING (
  is_active = true AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role IN ('passenger', 'driver', 'community_admin')
  )
);

CREATE POLICY "Community admins manage routes" 
ON public.fixed_routes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role = 'community_admin'
  )
);

-- 重新创建车辆表的RLS策略
DROP POLICY IF EXISTS "All users can view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Only community admins can manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Only community admins can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Only community admins can delete vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Drivers can set operation hours only" ON public.vehicles;

-- 乘客查看车辆：需在服务时间内且车辆激活
CREATE POLICY "Passengers can view active vehicles in service time" 
ON public.vehicles 
FOR SELECT 
USING (
  is_active = true AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role = 'passenger'
  ) AND 
  is_service_time_active((
    SELECT destination_id FROM users 
    WHERE access_code = get_current_access_code() 
    AND role = 'passenger'
  ))
);

-- 司机和社区管理员查看车辆：只需车辆激活
CREATE POLICY "Drivers and admins can view active vehicles" 
ON public.vehicles 
FOR SELECT 
USING (
  is_active = true AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role IN ('driver', 'community_admin')
  )
);

CREATE POLICY "Community admins can manage vehicles" 
ON public.vehicles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role = 'community_admin'
  )
);

CREATE POLICY "Community admins can update vehicles" 
ON public.vehicles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role = 'community_admin'
  )
);

CREATE POLICY "Community admins can delete vehicles" 
ON public.vehicles 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role = 'community_admin'
  )
);

CREATE POLICY "Drivers can update their vehicle operation hours" 
ON public.vehicles 
FOR UPDATE 
USING (
  user_id = (
    SELECT id FROM users 
    WHERE access_code = get_current_access_code() 
    AND role = 'driver'
  )
);

-- 重新创建钱包地址表的RLS策略
DROP POLICY IF EXISTS "All users view wallet addresses" ON public.wallet_addresses;
DROP POLICY IF EXISTS "Only community admins manage wallets" ON public.wallet_addresses;

CREATE POLICY "All roles view active wallet addresses" 
ON public.wallet_addresses 
FOR SELECT 
USING (
  is_active = true AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role IN ('passenger', 'driver', 'community_admin')
  )
);

CREATE POLICY "Community admins manage wallet addresses" 
ON public.wallet_addresses 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role = 'community_admin'
  )
);

-- 重新创建乘车请求表的RLS策略
DROP POLICY IF EXISTS "Drivers update related requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Passengers view own requests only" ON public.ride_requests;
DROP POLICY IF EXISTS "Drivers view related requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Community admins view related requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Only passengers create requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Only passengers delete own requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Passengers update own requests only" ON public.ride_requests;

CREATE POLICY "Passengers view own requests" 
ON public.ride_requests 
FOR SELECT 
USING (
  access_code = get_current_access_code() AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role = 'passenger'
  )
);

CREATE POLICY "Drivers view related requests" 
ON public.ride_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = get_current_access_code() 
    AND fr.id = ride_requests.fixed_route_id 
    AND u.role = 'driver'
  )
);

CREATE POLICY "Community admins view related requests" 
ON public.ride_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = get_current_access_code() 
    AND fr.id = ride_requests.fixed_route_id 
    AND u.role = 'community_admin'
  )
);

-- 乘客创建乘车请求：不受服务时间限制（支持即时拼车和预约拼车）
CREATE POLICY "Passengers create requests" 
ON public.ride_requests 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role = 'passenger'
  )
);

CREATE POLICY "Passengers update own requests" 
ON public.ride_requests 
FOR UPDATE 
USING (
  access_code = get_current_access_code() AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role = 'passenger'
  )
);

CREATE POLICY "Passengers delete own requests" 
ON public.ride_requests 
FOR DELETE 
USING (
  access_code = get_current_access_code() AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role = 'passenger'
  )
);

CREATE POLICY "Drivers update related requests" 
ON public.ride_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = get_current_access_code() 
    AND fr.id = ride_requests.fixed_route_id 
    AND u.role = 'driver'
  )
);

-- 重新创建支付表的RLS策略
DROP POLICY IF EXISTS "Anyone can view payments for accessible rides" ON public.payments;
DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;

CREATE POLICY "All roles can view payments" 
ON public.payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role IN ('passenger', 'driver', 'community_admin')
  )
);

CREATE POLICY "All roles can insert payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE access_code = get_current_access_code() 
    AND role IN ('passenger', 'driver', 'community_admin')
  )
);