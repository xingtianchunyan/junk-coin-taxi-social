-- Add work date range columns to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN work_start_date DATE,
ADD COLUMN work_end_date DATE;