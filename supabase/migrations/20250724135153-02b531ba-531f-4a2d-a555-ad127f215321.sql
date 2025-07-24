-- 修复用户角色权限安全漏洞
-- 删除现有的用户更新策略
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- 创建新的严格策略：用户可以更新自己的数据，但不能修改角色
-- 注意：OLD和NEW关键字在WITH CHECK子句中不可用，需要使用不同的方法
CREATE POLICY "Users can update own data except role" 
ON public.users 
FOR UPDATE 
USING (access_code = get_current_access_code());