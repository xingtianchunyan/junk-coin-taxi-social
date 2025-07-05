-- Add payment_blockchain column to ride_requests table
ALTER TABLE public.ride_requests 
ADD COLUMN payment_blockchain TEXT;