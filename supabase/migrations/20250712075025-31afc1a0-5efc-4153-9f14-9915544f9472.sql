-- 创建设置配置的函数
CREATE OR REPLACE FUNCTION public.set_config(setting_name text, setting_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config(setting_name, setting_value, false);
END;
$$;