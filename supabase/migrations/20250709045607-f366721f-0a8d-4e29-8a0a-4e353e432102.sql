
-- 为vehicles表添加关联的用户ID字段
ALTER TABLE public.vehicles 
ADD COLUMN user_id UUID REFERENCES public.users(id);

-- 创建函数，在添加车辆时自动创建对应的司机用户
CREATE OR REPLACE FUNCTION public.create_driver_user_for_vehicle()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果没有指定user_id，则创建新的司机用户
  IF NEW.user_id IS NULL THEN
    INSERT INTO public.users (role, access_code)
    VALUES ('driver', gen_random_uuid())
    RETURNING id INTO NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器，在插入车辆记录前自动创建司机用户
CREATE TRIGGER create_driver_user_before_vehicle_insert
  BEFORE INSERT ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_driver_user_for_vehicle();
