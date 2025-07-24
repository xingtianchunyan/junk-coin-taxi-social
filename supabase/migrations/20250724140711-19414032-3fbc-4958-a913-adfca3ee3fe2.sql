-- 修复update_updated_at_column函数的搜索路径安全问题
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Update the updated_at column to current timestamp
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;