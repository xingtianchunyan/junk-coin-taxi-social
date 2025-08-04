-- Update the status check constraint to include 'processing' status
ALTER TABLE public.ride_requests 
DROP CONSTRAINT ride_requests_status_check;

ALTER TABLE public.ride_requests 
ADD CONSTRAINT ride_requests_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text]));