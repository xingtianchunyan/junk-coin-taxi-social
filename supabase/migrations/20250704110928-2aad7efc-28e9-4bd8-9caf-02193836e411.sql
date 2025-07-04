-- Phase 1: User Role System and Basic Architecture

-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('passenger', 'driver', 'owner', 'admin');

-- Create drivers table
CREATE TABLE public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    license_number VARCHAR(50),
    experience_years INTEGER,
    rating DECIMAL(3,2) DEFAULT 5.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create vehicles table
CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER,
    license_plate VARCHAR(20) UNIQUE,
    color VARCHAR(30),
    capacity INTEGER DEFAULT 4,
    features JSONB,
    images TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicle reservations table
CREATE TABLE public.vehicle_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create driver schedules table
CREATE TABLE public.driver_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create driver pricing table
CREATE TABLE public.driver_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    route_id UUID REFERENCES public.fixed_routes(id) ON DELETE SET NULL,
    base_price DECIMAL(10,2),
    price_per_km DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'USDT',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicle availability table
CREATE TABLE public.vehicle_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicle operation logs table
CREATE TABLE public.vehicle_operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    ride_request_id UUID REFERENCES public.ride_requests(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    distance_km DECIMAL(8,2),
    revenue DECIMAL(10,2),
    currency VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user profiles table for role management
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    phone VARCHAR(20),
    roles user_role[] DEFAULT ARRAY['passenger']::user_role[],
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Extend existing tables
ALTER TABLE public.ride_requests 
ADD COLUMN driver_id UUID REFERENCES public.drivers(id),
ADD COLUMN vehicle_id UUID REFERENCES public.vehicles(id),
ADD COLUMN passenger_count INTEGER DEFAULT 1,
ADD COLUMN is_shared BOOLEAN DEFAULT false;

ALTER TABLE public.fixed_routes 
ADD COLUMN driver_id UUID REFERENCES public.drivers(id),
ADD COLUMN max_passengers INTEGER DEFAULT 4;

ALTER TABLE public.wallet_addresses 
ADD COLUMN driver_id UUID REFERENCES public.drivers(id),
ADD COLUMN owner_type VARCHAR(20) DEFAULT 'system';

-- Enable RLS on new tables
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for drivers
CREATE POLICY "Anyone can view active drivers"
ON public.drivers
FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can manage their own driver profile"
ON public.drivers
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policies for vehicles
CREATE POLICY "Anyone can view active vehicles"
ON public.vehicles
FOR SELECT
USING (is_active = true);

CREATE POLICY "Vehicle owners can manage their vehicles"
ON public.vehicles
FOR ALL
TO authenticated
USING (auth.uid() = owner_id);

-- Create RLS policies for vehicle reservations
CREATE POLICY "Drivers can view their reservations"
ON public.vehicle_reservations
FOR SELECT
TO authenticated
USING (auth.uid() IN (
    SELECT user_id FROM public.drivers WHERE id = driver_id
));

CREATE POLICY "Drivers can create reservations"
ON public.vehicle_reservations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.drivers WHERE id = driver_id
));

-- Create RLS policies for other tables
CREATE POLICY "Drivers can manage their schedules"
ON public.driver_schedules
FOR ALL
TO authenticated
USING (auth.uid() IN (
    SELECT user_id FROM public.drivers WHERE id = driver_id
));

CREATE POLICY "Drivers can manage their pricing"
ON public.driver_pricing
FOR ALL
TO authenticated
USING (auth.uid() IN (
    SELECT user_id FROM public.drivers WHERE id = driver_id
));

CREATE POLICY "Vehicle owners can manage availability"
ON public.vehicle_availability
FOR ALL
TO authenticated
USING (auth.uid() IN (
    SELECT owner_id FROM public.vehicles WHERE id = vehicle_id
));

CREATE POLICY "Anyone can view operation logs for their vehicles or drives"
ON public.vehicle_operation_logs
FOR SELECT
TO authenticated
USING (
    auth.uid() IN (SELECT owner_id FROM public.vehicles WHERE id = vehicle_id) OR
    auth.uid() IN (SELECT user_id FROM public.drivers WHERE id = driver_id)
);

-- Create updated_at triggers
CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON public.drivers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicle_reservations_updated_at
    BEFORE UPDATE ON public.vehicle_reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_schedules_updated_at
    BEFORE UPDATE ON public.driver_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_pricing_updated_at
    BEFORE UPDATE ON public.driver_pricing
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX idx_vehicles_owner_id ON public.vehicles(owner_id);
CREATE INDEX idx_vehicle_reservations_driver_id ON public.vehicle_reservations(driver_id);
CREATE INDEX idx_vehicle_reservations_vehicle_id ON public.vehicle_reservations(vehicle_id);
CREATE INDEX idx_driver_schedules_driver_id ON public.driver_schedules(driver_id);
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);