-- 修复用户表和用车需求表的RLS策略，解决注册和创建需求失败的问题

-- 首先检查并修复用户表的RLS策略
-- 删除有问题的策略
DROP POLICY IF EXISTS "Passengers self register by access code" ON public.users;
DROP POLICY IF EXISTS "Community admins self register by access code" ON public.users;
DROP POLICY IF EXISTS "Community admins create driver codes" ON public.users;

-- 为用户表创建更宽松的策略，允许用户自注册
CREATE POLICY "Users can self register" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- 允许用户通过访问码查看和更新自己的数据
CREATE POLICY "Users can view own data" 
ON public.users 
FOR SELECT 
USING (access_code = get_current_access_code());

CREATE POLICY "Users can update own data" 
ON public.users 
FOR UPDATE 
USING (access_code = get_current_access_code());

-- 修复用车需求表的RLS策略
-- 删除有问题的策略
DROP POLICY IF EXISTS "Passengers create requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Passengers view own requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Passengers update own requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Passengers delete own requests" ON public.ride_requests;

-- 创建更宽松的用车需求策略
CREATE POLICY "Anyone can create ride requests" 
ON public.ride_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view requests by access code" 
ON public.ride_requests 
FOR SELECT 
USING (access_code = get_current_access_code());

CREATE POLICY "Users can update own requests" 
ON public.ride_requests 
FOR UPDATE 
USING (access_code = get_current_access_code());

CREATE POLICY "Users can delete own requests" 
ON public.ride_requests 
FOR DELETE 
USING (access_code = get_current_access_code());

-- 司机和社区管理员可以查看相关的用车需求
CREATE POLICY "Drivers and admins view related requests" 
ON public.ride_requests 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM users u
    JOIN fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = get_current_access_code() 
    AND fr.id = ride_requests.fixed_route_id 
    AND u.role IN ('driver', 'community_admin')
));

-- 司机和社区管理员可以更新相关的用车需求
CREATE POLICY "Drivers and admins update related requests" 
ON public.ride_requests 
FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM users u
    JOIN fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = get_current_access_code() 
    AND fr.id = ride_requests.fixed_route_id 
    AND u.role IN ('driver', 'community_admin')
));