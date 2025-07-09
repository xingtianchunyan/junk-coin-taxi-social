-- Update the validate_wallet_address function to handle larger UIDs
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
$function$