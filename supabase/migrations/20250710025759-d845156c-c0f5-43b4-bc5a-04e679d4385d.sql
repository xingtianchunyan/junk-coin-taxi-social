
-- Remove payment-related fields that are no longer needed for auto-detection
ALTER TABLE public.ride_requests 
DROP COLUMN IF EXISTS sender_wallet_address,
DROP COLUMN IF EXISTS payment_blockchain;

-- Remove the auto-detect-payment function and related migration
-- Note: The function file will be removed from the codebase separately
