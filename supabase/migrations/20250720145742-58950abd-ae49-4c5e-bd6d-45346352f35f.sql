-- 修复数据一致性：将preset_destinations表中的admin_user_id与users表的destination_id关联
-- 更新users表，为社区管理员设置正确的destination_id
UPDATE users 
SET destination_id = pd.id
FROM preset_destinations pd
WHERE users.id = pd.admin_user_id 
AND users.role = 'community_admin'
AND users.destination_id IS NULL;

-- 创建一个专门给乘客查看已批准目的地的函数，绕过RLS限制
CREATE OR REPLACE FUNCTION public.get_approved_destinations()
RETURNS TABLE (
  id uuid,
  name text,
  address text,
  description text,
  is_approved boolean,
  is_active boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pd.id,
    pd.name,
    pd.address,
    pd.description,
    pd.is_approved,
    pd.is_active,
    pd.created_at
  FROM public.preset_destinations pd
  WHERE pd.is_approved = true 
    AND pd.is_active = true
  ORDER BY pd.name;
END;
$$;