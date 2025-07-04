-- Allow system/admin to insert wallet addresses
CREATE POLICY "Allow system to insert wallet addresses" 
ON public.wallet_addresses 
FOR INSERT 
WITH CHECK (true);

-- Allow system/admin to update wallet addresses  
CREATE POLICY "Allow system to update wallet addresses"
ON public.wallet_addresses
FOR UPDATE
USING (true);