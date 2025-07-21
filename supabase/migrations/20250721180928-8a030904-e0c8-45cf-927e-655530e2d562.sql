-- 修复RLS策略中的角色一致性问题
-- 将所有"admin"角色改为"community_admin"以区分社区管理员和超级管理员

-- 1. 更新 validate_wallet_address 函数支持现金支付
CREATE OR REPLACE FUNCTION public.validate_wallet_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Check if pay_way is exchange UID (2)
  IF NEW.pay_way = 2 THEN
    -- For exchange UID, we store the UID in the address field
    -- Allow UIDs up to bigint range (64-bit signed integer)
    
    -- Ensure the address contains only digits (for UIDs)
    IF NEW.address !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'Exchange UID must contain only digits';
    END IF;
    
    -- Convert to bigint to ensure it's within bigint range
    -- This allows much larger numbers than int4
    PERFORM NEW.address::bigint;
    
  -- Check if pay_way is cash payment (3)
  ELSIF NEW.pay_way = 3 THEN
    -- For cash payments, no specific validation needed
    -- Address field can be used for notes or location info
    NULL; -- No validation required for cash payments
    
  -- Check if pay_way is wallet address (1)
  ELSIF NEW.pay_way = 1 THEN
    -- For blockchain addresses, validate based on chain_name
    CASE NEW.chain_name
      -- Bitcoin addresses
      WHEN 1 THEN
        IF NEW.address !~ '^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$' AND NEW.address !~ '^bc1[a-zA-Z0-9]{25,39}$' THEN
          RAISE EXCEPTION 'Invalid Bitcoin address format';
        END IF;
      
      -- Ethereum/EVM-Compatible addresses
      WHEN 2 THEN
        IF NEW.address !~ '^0x[a-fA-F0-9]{40}$' THEN
          RAISE EXCEPTION 'Invalid Ethereum address format';
        END IF;
      
      -- Solana addresses
      WHEN 3 THEN
        IF NEW.address !~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$' THEN
          RAISE EXCEPTION 'Invalid Solana address format';
        END IF;
      
      -- Tron/TRC20 addresses
      WHEN 4 THEN
        IF NEW.address !~ '^T[a-zA-Z0-9]{33}$' THEN
          RAISE EXCEPTION 'Invalid Tron address format';
        END IF;
      
      -- TON addresses
      WHEN 5 THEN
        IF length(NEW.address) < 10 THEN
          RAISE EXCEPTION 'Address seems too short for a TON address';
        END IF;
      
      -- SUI addresses
      WHEN 6 THEN
        IF NEW.address !~ '^0x[a-fA-F0-9]{64}$' THEN
          RAISE EXCEPTION 'Invalid Sui address format';
        END IF;
      
      -- Other chains - basic validation
      ELSE
        IF length(NEW.address) < 10 THEN
          RAISE EXCEPTION 'Address seems too short for a blockchain address';
        END IF;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. 更新 wallet_addresses 表的RLS策略
DROP POLICY IF EXISTS "Community admins manage wallet addresses" ON public.wallet_addresses;

CREATE POLICY "Community admins manage wallet addresses" 
ON public.wallet_addresses 
FOR ALL 
USING (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.access_code = get_current_access_code()) AND (users.role = 'community_admin'::text))));

-- 3. 更新 vehicles 表的RLS策略
DROP POLICY IF EXISTS "Community admins can manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Community admins can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Community admins can delete vehicles" ON public.vehicles;

CREATE POLICY "Community admins can manage vehicles" 
ON public.vehicles 
FOR INSERT 
WITH CHECK (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.access_code = get_current_access_code()) AND (users.role = 'community_admin'::text))));

CREATE POLICY "Community admins can update vehicles" 
ON public.vehicles 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.access_code = get_current_access_code()) AND (users.role = 'community_admin'::text))));

CREATE POLICY "Community admins can delete vehicles" 
ON public.vehicles 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.access_code = get_current_access_code()) AND (users.role = 'community_admin'::text))));

-- 4. 更新 fixed_routes 表的RLS策略
DROP POLICY IF EXISTS "Community admins manage routes" ON public.fixed_routes;

CREATE POLICY "Community admins manage routes" 
ON public.fixed_routes 
FOR ALL 
USING (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.access_code = get_current_access_code()) AND (users.role = 'community_admin'::text))));

-- 5. 简化 ride_requests 表的创建策略
DROP POLICY IF EXISTS "Anyone can create ride requests" ON public.ride_requests;

CREATE POLICY "All authenticated users can create ride requests" 
ON public.ride_requests 
FOR INSERT 
WITH CHECK (get_current_access_code() IS NOT NULL);