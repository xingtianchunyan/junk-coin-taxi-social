-- 阶段二：更新 RLS 策略

-- 9. 更新 RLS 策略 - preset_destinations
DROP POLICY IF EXISTS "Community admins can create destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Community admins can manage their destinations" ON public.preset_destinations;
DROP POLICY IF EXISTS "Anyone can view active destinations" ON public.preset_destinations;

CREATE POLICY "Users can view approved destinations in their area" 
ON public.preset_destinations 
FOR SELECT 
USING (approval_status = 'approved' AND is_active = true);

CREATE POLICY "Community admins can create destinations" 
ON public.preset_destinations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Super admins can manage all destinations" 
ON public.preset_destinations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid()::uuid 
    AND role = 'admin'
  )
);

CREATE POLICY "Community admins can manage their approved destinations" 
ON public.preset_destinations 
FOR UPDATE 
USING (
  approval_status = 'approved' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid()::uuid 
    AND destination_id = preset_destinations.id
    AND role = 'owner'
  )
);

-- 10. 更新 RLS 策略 - vehicles
DROP POLICY IF EXISTS "Community admins can manage destination vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Anyone can view active destination vehicles" ON public.vehicles;

CREATE POLICY "Users can view vehicles in their destination" 
ON public.vehicles 
FOR SELECT 
USING (
  is_active = true 
  AND user_has_destination_access(auth.uid()::uuid, destination_id)
);

CREATE POLICY "Community admins can manage their destination vehicles" 
ON public.vehicles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE access_code = auth.uid()::uuid 
    AND destination_id = vehicles.destination_id
    AND role = 'owner'
  )
);

CREATE POLICY "Drivers can update their own vehicle status" 
ON public.vehicles 
FOR UPDATE 
USING (
  user_id = (
    SELECT id FROM public.users 
    WHERE access_code = auth.uid()::uuid
  )
);

-- 11. 更新 RLS 策略 - ride_requests
DROP POLICY IF EXISTS "Anyone can view basic ride info" ON public.ride_requests;
DROP POLICY IF EXISTS "Anyone can insert ride requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Users can update ride requests with proper authorization" ON public.ride_requests;

CREATE POLICY "Users can view ride requests in their destination" 
ON public.ride_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = auth.uid()::uuid 
    AND fr.id = ride_requests.fixed_route_id
  ) 
  OR 
  access_code = auth.uid()::uuid
);

CREATE POLICY "Users can create ride requests in service time" 
ON public.ride_requests 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fixed_routes fr
    WHERE fr.id = fixed_route_id 
    AND is_service_time_active(fr.destination_id)
  )
);

CREATE POLICY "Authorized users can update ride requests" 
ON public.ride_requests 
FOR UPDATE 
USING (
  access_code = auth.uid()::uuid 
  OR 
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.fixed_routes fr ON fr.destination_id = u.destination_id
    WHERE u.access_code = auth.uid()::uuid 
    AND fr.id = ride_requests.fixed_route_id
    AND u.role IN ('owner', 'driver')
  )
);

-- 12. 更新已有目的地为已批准状态（兼容现有数据）
UPDATE public.preset_destinations 
SET approval_status = 'approved' 
WHERE approval_status = 'pending';

-- 13. 为现有车辆设置默认工作状态
UPDATE public.vehicles 
SET current_status = 'available' 
WHERE current_status = 'offline';