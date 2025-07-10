-- Add wallet address binding to users table
ALTER TABLE public.users 
ADD COLUMN wallet_address TEXT;

-- Add comment for the new field
COMMENT ON COLUMN public.users.wallet_address IS '绑定的Web3钱包地址';