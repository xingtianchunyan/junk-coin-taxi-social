-- Fix the validate_wallet_address function to handle integer types correctly
CREATE OR REPLACE FUNCTION public.validate_wallet_address()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Validate address format (basic validation)
  IF NEW.address IS NULL OR LENGTH(NEW.address) < 10 THEN
    RAISE EXCEPTION 'Invalid wallet address format';
  END IF;
  
  -- Validate symbol format (only check if symbol is provided)
  IF NEW.symbol IS NOT NULL AND (LENGTH(NEW.symbol) < 2 OR LENGTH(NEW.symbol) > 10) THEN
    RAISE EXCEPTION 'Invalid symbol format';
  END IF;
  
  -- Validate chain name (check if it's a valid number, not length)
  IF NEW.chain_name IS NULL OR NEW.chain_name < 1 OR NEW.chain_name > 10 THEN
    RAISE EXCEPTION 'Invalid chain name';
  END IF;
  
  -- Validate pay_way 
  IF NEW.pay_way IS NULL OR NEW.pay_way < 1 OR NEW.pay_way > 5 THEN
    RAISE EXCEPTION 'Invalid pay way';
  END IF;
  
  RETURN NEW;
END;
$function$;