-- 为 fixed_routes 表添加插入权限，允许系统生成固定路线
CREATE POLICY "Allow system to insert fixed routes" 
ON public.fixed_routes 
FOR INSERT 
WITH CHECK (true);

-- 为 fixed_routes 表添加更新权限，允许系统更新路线信息
CREATE POLICY "Allow system to update fixed routes" 
ON public.fixed_routes 
FOR UPDATE 
USING (true);