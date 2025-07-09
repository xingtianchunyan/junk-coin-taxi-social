-- Fix wallet address validation function to use correct chain mappings
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
    -- No need to validate length - allow any integer within int4 range
    -- The int4 range is from -2,147,483,648 to 2,147,483,647
    
    -- Ensure the address contains only digits (for UIDs)
    IF NEW.address !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'Exchange UID must contain only digits';
    END IF;
    
    -- Convert to integer to ensure it's within int4 range
    -- This will automatically raise an error if the number is too large
    PERFORM NEW.address::integer;
    
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