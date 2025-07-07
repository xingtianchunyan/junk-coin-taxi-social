
-- 创建车辆信息表
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_name TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  max_passengers INTEGER NOT NULL DEFAULT 4,
  trunk_length_cm INTEGER NOT NULL DEFAULT 100,
  trunk_width_cm INTEGER NOT NULL DEFAULT 80,
  trunk_height_cm INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建行李信息表
CREATE TABLE public.luggage_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_request_id UUID REFERENCES public.ride_requests(id) ON DELETE CASCADE,
  size_category TEXT NOT NULL CHECK (size_category IN ('small', 'medium', 'large', 'extra_large')),
  length_cm INTEGER NOT NULL,
  width_cm INTEGER NOT NULL,
  height_cm INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建组队表
CREATE TABLE public.ride_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id),
  route_id UUID REFERENCES public.fixed_routes(id),
  requested_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_passengers INTEGER DEFAULT 0,
  total_luggage_volume INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建组队成员表
CREATE TABLE public.ride_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.ride_groups(id) ON DELETE CASCADE,
  ride_request_id UUID REFERENCES public.ride_requests(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, ride_request_id)
);

-- 为车辆表添加RLS策略
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active vehicles" 
  ON public.vehicles 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Only admins can manage vehicles" 
  ON public.vehicles 
  FOR ALL 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 为行李表添加RLS策略
ALTER TABLE public.luggage_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view luggage items" 
  ON public.luggage_items 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert luggage items" 
  ON public.luggage_items 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update luggage items" 
  ON public.luggage_items 
  FOR UPDATE 
  USING (true);

-- 为组队相关表添加RLS策略
ALTER TABLE public.ride_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ride groups" 
  ON public.ride_groups 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can manage ride groups" 
  ON public.ride_groups 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view group members" 
  ON public.ride_group_members 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can manage group members" 
  ON public.ride_group_members 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- 在ride_requests表中添加passenger_count列（如果还没有的话）
ALTER TABLE public.ride_requests 
ADD COLUMN IF NOT EXISTS passenger_count INTEGER DEFAULT 1;
