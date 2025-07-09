
-- 为 ride_requests 表添加行李字段
ALTER TABLE public.ride_requests 
ADD COLUMN luggage jsonb DEFAULT '[]'::jsonb;

-- 添加注释说明字段用途
COMMENT ON COLUMN public.ride_requests.luggage IS '行李信息数组，每个元素包含长度、宽度、高度（cm）和数量';
