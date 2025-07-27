-- 第一阶段：数据库结构修复和触发器重建

-- 1. 重新创建缺失的触发器
CREATE OR REPLACE FUNCTION public.create_driver_user_for_vehicle()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果没有指定user_id，则创建新的司机用户
  IF NEW.user_id IS NULL THEN
    INSERT INTO users (role, access_code)
    VALUES ('driver', gen_random_uuid())
    RETURNING id INTO NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器（如果不存在）
DROP TRIGGER IF EXISTS trigger_create_driver_user ON vehicles;
CREATE TRIGGER trigger_create_driver_user
  BEFORE INSERT ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION create_driver_user_for_vehicle();

-- 2. 简化RLS策略 - 先删除复杂策略
DROP POLICY IF EXISTS "Drivers and admins view related requests" ON ride_requests;
DROP POLICY IF EXISTS "Drivers and admins update related requests" ON ride_requests;
DROP POLICY IF EXISTS "Drivers view related requests" ON ride_requests;
DROP POLICY IF EXISTS "Community admins view related requests" ON ride_requests;
DROP POLICY IF EXISTS "Drivers update related requests" ON ride_requests;

-- 3. 创建简化的RLS策略
CREATE POLICY "Community users can view related ride requests" ON ride_requests
FOR SELECT USING (
  -- 用户可以查看自己的请求
  access_code = get_current_access_code() OR
  -- 或者用户是相关目的地的管理员/司机
  EXISTS (
    SELECT 1 FROM users u
    JOIN fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = get_current_access_code()
    AND fr.id = ride_requests.fixed_route_id
    AND u.role IN ('driver', 'community_admin')
  )
);

CREATE POLICY "Community users can update related ride requests" ON ride_requests
FOR UPDATE USING (
  -- 用户可以更新自己的请求
  access_code = get_current_access_code() OR
  -- 或者用户是相关目的地的管理员/司机
  EXISTS (
    SELECT 1 FROM users u
    JOIN fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = get_current_access_code()
    AND fr.id = ride_requests.fixed_route_id
    AND u.role IN ('driver', 'community_admin')
  )
);

-- 4. 确保设置了default访问码函数
CREATE OR REPLACE FUNCTION public.set_default_access_code()
RETURNS TRIGGER AS $$
BEGIN
  -- 确保每个新用户都有访问码
  IF NEW.access_code IS NULL THEN
    NEW.access_code = gen_random_uuid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器确保用户有访问码
DROP TRIGGER IF EXISTS ensure_access_code ON users;
CREATE TRIGGER ensure_access_code
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_default_access_code();