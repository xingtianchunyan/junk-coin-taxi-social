-- Add discount_percentage column to vehicles table for driver's willing discount
ALTER TABLE public.vehicles 
ADD COLUMN discount_percentage INTEGER DEFAULT 50 CHECK (discount_percentage >= 0 AND discount_percentage <= 80);