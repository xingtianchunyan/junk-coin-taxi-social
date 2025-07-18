-- 为users表添加contact字段存储联系方式
ALTER TABLE public.users ADD COLUMN contact TEXT;

-- 为超级管理员添加查看目的地的权限
CREATE POLICY "Super admins can view all destinations" 
ON public.preset_destinations 
FOR SELECT 
USING (is_super_admin());

-- 为超级管理员添加查看所有用户的权限（已存在但确保完整）
-- 这个策略可能已经存在，如果存在会报错但不影响功能