-- Add route_id and vehicle_id to wallet_addresses table to link payment methods to specific routes and vehicles
ALTER TABLE public.wallet_addresses 
ADD COLUMN route_id UUID REFERENCES public.fixed_routes(id),
ADD COLUMN vehicle_id UUID REFERENCES public.vehicles(id);