-- Migration: Add driver timing conflict check RPC
-- Date: 2025-12-26

-- Function to check if a driver has timing conflicts for a given ride request
CREATE OR REPLACE FUNCTION check_driver_timing_conflict(
  p_vehicle_id UUID,
  p_fixed_route_id UUID,
  p_requested_time TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_route_duration INTEGER;
  v_is_start_from_dest BOOLEAN;
  v_request_start_time TIMESTAMPTZ;
  v_request_end_time TIMESTAMPTZ;
  v_conflict_exists BOOLEAN;
  v_driver_id UUID;
  v_dest_name TEXT;
  v_dest_address TEXT;
BEGIN
  -- Get driver user_id from vehicle
  SELECT user_id INTO v_driver_id FROM vehicles WHERE id = p_vehicle_id;
  
  -- Get route duration and destination info
  SELECT 
    COALESCE(estimated_duration_minutes, 60),
    d.name,
    d.address
  INTO 
    v_route_duration,
    v_dest_name,
    v_dest_address
  FROM fixed_routes r
  JOIN preset_destinations d ON r.destination_id = d.id
  WHERE r.id = p_fixed_route_id;

  -- Check if start location is the destination
  SELECT EXISTS (
    SELECT 1 FROM fixed_routes 
    WHERE id = p_fixed_route_id 
    AND (start_location ILIKE '%' || v_dest_name || '%' OR start_location ILIKE '%' || v_dest_address || '%')
  ) INTO v_is_start_from_dest;

  -- Calculate request time range
  IF v_is_start_from_dest THEN
    v_request_start_time := p_requested_time;
    v_request_end_time := p_requested_time + (v_route_duration || ' minutes')::INTERVAL;
  ELSE
    v_request_start_time := p_requested_time - (v_route_duration || ' minutes')::INTERVAL;
    v_request_end_time := p_requested_time + (v_route_duration || ' minutes')::INTERVAL;
  END IF;

  -- Check for overlapping processing requests for the same driver
  SELECT EXISTS (
    SELECT 1 
    FROM ride_requests rr
    JOIN fixed_routes fr ON rr.fixed_route_id = fr.id
    WHERE rr.processing_driver_id = v_driver_id
    AND rr.status = 'processing'
    AND (
      -- Check overlapping with other requests' time ranges
      -- This is a simplified version of the frontend logic
      CASE 
        WHEN (fr.start_location ILIKE '%' || v_dest_name || '%' OR fr.start_location ILIKE '%' || v_dest_address || '%') THEN
          rr.requested_time <= v_request_end_time AND (rr.requested_time + (COALESCE(fr.estimated_duration_minutes, 60) || ' minutes')::INTERVAL) >= v_request_start_time
        ELSE
          (rr.requested_time - (COALESCE(fr.estimated_duration_minutes, 60) || ' minutes')::INTERVAL) <= v_request_end_time AND (rr.requested_time + (COALESCE(fr.estimated_duration_minutes, 60) || ' minutes')::INTERVAL) >= v_request_start_time
      END
    )
  ) INTO v_conflict_exists;

  RETURN v_conflict_exists;
END;
$$;
