-- 清理未使用的数据库表和字段

-- 1. 删除未使用的表
DROP TABLE IF EXISTS public.ride_group_members CASCADE;
DROP TABLE IF EXISTS public.ride_groups CASCADE;
DROP TABLE IF EXISTS public.luggage_items CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.supported_coins CASCADE;

-- 2. 删除drivers表中未使用的字段
ALTER TABLE public.drivers 
DROP COLUMN IF EXISTS experience_years,
DROP COLUMN IF EXISTS license_number,
DROP COLUMN IF EXISTS rating;

-- 3. 清理fixed_routes表中未使用的字段（driver_id引用已删除字段的表）
ALTER TABLE public.fixed_routes 
DROP COLUMN IF EXISTS driver_id,
DROP COLUMN IF EXISTS max_passengers;

-- 4. 删除ride_requests表中未使用的字段
ALTER TABLE public.ride_requests
DROP COLUMN IF EXISTS driver_id;