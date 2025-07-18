-- 删除admin_users表，改用固定钱包地址验证超级管理员
-- 根据安全分析文档，这样做可以提升安全性并简化架构

-- 1. 删除admin_users表及其相关策略
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- 2. 删除原有的is_admin函数
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- 3. 创建新的超级管理员验证函数
-- 这个函数将通过应用层设置的钱包地址进行验证
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- 通过应用层设置的钱包地址验证超级管理员身份
  -- 应用层需要在认证时设置 app.super_admin_verified = 'true'
  RETURN current_setting('app.super_admin_verified', true) = 'true';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$function$;

-- 4. 创建设置超级管理员状态的函数（仅供应用层调用）
CREATE OR REPLACE FUNCTION public.set_super_admin_verified(is_verified boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- 设置当前会话的超级管理员验证状态
  PERFORM set_config('app.super_admin_verified', is_verified::text, false);
END;
$function$;

-- 5. 更新users表的策略，允许超级管理员查看所有社区管理员申请
CREATE POLICY "Super admins can view all community admin requests" 
ON public.users 
FOR SELECT 
USING (
  is_super_admin() AND role = 'community_admin'
);

-- 6. 允许超级管理员删除社区管理员申请（拒绝申请时）
CREATE POLICY "Super admins can delete community admin requests" 
ON public.users 
FOR DELETE 
USING (
  is_super_admin() AND role = 'community_admin'
);

-- 7. 添加注释说明新的认证机制
COMMENT ON FUNCTION public.is_super_admin() IS '验证超级管理员身份，基于应用层设置的钱包地址验证状态';
COMMENT ON FUNCTION public.set_super_admin_verified(boolean) IS '设置超级管理员验证状态，仅供应用层在钱包签名验证后调用';