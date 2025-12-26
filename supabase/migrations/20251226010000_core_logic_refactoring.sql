-- Phase 2: Core Logic Refactoring (Business Enhancement)
-- Move fare calculation and payment verification logic to the backend

-- 1) Fare calculation function
CREATE OR REPLACE FUNCTION public.calculate_ride_fare(
  p_fixed_route_id uuid,
  p_vehicle_id uuid DEFAULT NULL
)
RETURNS TABLE (
  amount decimal(10,2),
  currency text,
  is_discounted boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_market_price decimal(10,2);
  v_our_price decimal(10,2);
  v_currency text;
  v_discount_percentage decimal(5,2);
BEGIN
  -- Get route prices
  SELECT market_price, our_price, COALESCE(currency, 'CNY')
  INTO v_market_price, v_our_price, v_currency
  FROM public.fixed_routes
  WHERE id = p_fixed_route_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Route not found' USING ERRCODE = '42P01';
  END IF;

  -- Get vehicle discount if applicable
  IF p_vehicle_id IS NOT NULL THEN
    SELECT discount_percentage
    INTO v_discount_percentage
    FROM public.vehicles
    WHERE id = p_vehicle_id;
  END IF;

  -- Calculate final amount
  IF v_market_price IS NOT NULL AND v_discount_percentage IS NOT NULL THEN
    RETURN QUERY SELECT 
      (v_market_price * (v_discount_percentage / 100.0))::decimal(10,2),
      v_currency,
      true;
  ELSE
    RETURN QUERY SELECT 
      COALESCE(v_our_price, v_market_price, 0.00)::decimal(10,2),
      v_currency,
      false;
  END IF;
END;
$$;

-- 2) Trigger to enforce server-side fare calculation on ride_requests
CREATE OR REPLACE FUNCTION public.enforce_ride_fare_calculation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_calculated RECORD;
BEGIN
  -- Call the calculation function
  SELECT * INTO v_calculated FROM public.calculate_ride_fare(NEW.fixed_route_id, NEW.vehicle_id);
  
  -- Override frontend-provided values for security
  NEW.payment_amount := v_calculated.amount;
  NEW.payment_currency := v_calculated.currency;
  NEW.payment_required := (v_calculated.amount > 0);
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_ride_fare_calculation ON public.ride_requests;
CREATE TRIGGER trg_enforce_ride_fare_calculation
BEFORE INSERT ON public.ride_requests
FOR EACH ROW
EXECUTE FUNCTION public.enforce_ride_fare_calculation();

-- 3) Secure payment verification placeholder
-- In a real scenario, this would be called by an Edge Function or a backend service 
-- that verifies the transaction hash on-chain.
CREATE OR REPLACE FUNCTION public.verify_and_confirm_payment(
  p_payment_id uuid,
  p_transaction_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. In a real implementation, you would use a Supabase Edge Function to:
  --    a. Call a blockchain provider (e.g., Infura, Alchemy)
  --    b. Verify that the transaction hash exists and is confirmed
  --    c. Check that the amount and recipient address match the payment record
  
  -- 2. For now, we update the payment record and the associated ride request
  UPDATE public.payments
  SET 
    transaction_hash = p_transaction_hash,
    status = 'confirmed',
    confirmed_at = now()
  WHERE id = p_payment_id;

  IF FOUND THEN
    UPDATE public.ride_requests
    SET payment_status = 'paid'
    WHERE id = (SELECT ride_request_id FROM public.payments WHERE id = p_payment_id);
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
