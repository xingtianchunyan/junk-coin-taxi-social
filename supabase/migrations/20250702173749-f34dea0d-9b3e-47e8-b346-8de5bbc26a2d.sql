-- 为ride_requests表添加发送方钱包地址字段
ALTER TABLE public.ride_requests 
ADD COLUMN sender_wallet_address TEXT;

-- 添加注释说明字段用途
COMMENT ON COLUMN public.ride_requests.sender_wallet_address IS '乘客发送支付的钱包地址，用于自动检测交易';