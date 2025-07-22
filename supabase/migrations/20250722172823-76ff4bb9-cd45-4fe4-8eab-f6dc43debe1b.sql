-- 修复社区管理员创建目的地的RLS策略
-- 删除存在问题的策略
DROP POLICY IF EXISTS "Community admins can create destination requests" ON public.preset_destinations;

-- 创建新的策略，允许社区管理员创建目的地申请
CREATE POLICY "Community admins can create destination requests" 
ON public.preset_destinations 
FOR INSERT 
WITH CHECK (
  -- 检查是否为社区管理员
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = get_current_access_code() 
    AND role = 'community_admin'
  ) 
  -- 确保目的地默认为未批准状态
  AND is_approved = false
  -- 确保admin_user_id不为空
  AND admin_user_id IS NOT NULL
);

-- 添加策略允许社区管理员查看自己创建的目的地（无论是否批准）
CREATE POLICY "Community admins can view own destinations" 
ON public.preset_destinations 
FOR SELECT 
USING (
  admin_user_id IN (
    SELECT id FROM public.users 
    WHERE access_code = get_current_access_code() 
    AND role = 'community_admin'
  )
);