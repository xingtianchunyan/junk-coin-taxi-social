
-- 1. 为车辆表添加司机电话字段
ALTER TABLE public.vehicles 
ADD COLUMN driver_phone TEXT;

-- 2. 重构钱包地址表以支持多种支付方式
-- 删除不需要的字段
ALTER TABLE public.wallet_addresses 
DROP COLUMN IF EXISTS driver_id,
DROP COLUMN IF EXISTS owner_type;

-- 添加支付方式字段
ALTER TABLE public.wallet_addresses 
ADD COLUMN pay_way INTEGER DEFAULT 1, -- 1=区块链支付, 2=交易所转账, 3=支付宝/微信, 4=现金, 5=免费
ADD COLUMN exchange_name INTEGER; -- 1=BINANCE, 2=OKX, 3=coinbase, 4=Bitget, 5=Gate, 6=Bybit, 7=KuCoin, 8=火币

-- 修改chain_name字段为integer类型 
-- 先添加新的integer字段
ALTER TABLE public.wallet_addresses 
ADD COLUMN chain_name_int INTEGER; -- 1=BITCOIN, 2=EVM-Compatible, 3=SOLANA, 4=TRON, 5=TON, 6=SUI

-- 将现有的文本数据转换为整数（如果有数据的话）
UPDATE public.wallet_addresses 
SET chain_name_int = CASE 
  WHEN chain_name ILIKE '%bitcoin%' THEN 1
  WHEN chain_name ILIKE '%evm%' OR chain_name ILIKE '%ethereum%' THEN 2
  WHEN chain_name ILIKE '%solana%' THEN 3
  WHEN chain_name ILIKE '%tron%' THEN 4
  WHEN chain_name ILIKE '%ton%' THEN 5
  WHEN chain_name ILIKE '%sui%' THEN 6
  ELSE 2 -- 默认为EVM-Compatible
END;

-- 删除旧的文本字段
ALTER TABLE public.wallet_addresses 
DROP COLUMN chain_name;

-- 重命名新字段
ALTER TABLE public.wallet_addresses 
RENAME COLUMN chain_name_int TO chain_name;

-- 添加约束
ALTER TABLE public.wallet_addresses 
ALTER COLUMN pay_way SET NOT NULL,
ALTER COLUMN chain_name SET NOT NULL;

-- 为新字段添加检查约束
ALTER TABLE public.wallet_addresses 
ADD CONSTRAINT check_pay_way CHECK (pay_way IN (1, 2, 3, 4, 5)),
ADD CONSTRAINT check_chain_name CHECK (chain_name IN (1, 2, 3, 4, 5, 6)),
ADD CONSTRAINT check_exchange_name CHECK (exchange_name IS NULL OR exchange_name IN (1, 2, 3, 4, 5, 6, 7, 8));

-- 清理现有的钱包地址数据以确保新结构正常工作
DELETE FROM public.wallet_addresses WHERE destination_id IS NULL;

-- 为pay_way添加注释
COMMENT ON COLUMN public.wallet_addresses.pay_way IS '支付方式: 1=区块链支付, 2=交易所转账, 3=支付宝/微信, 4=现金, 5=免费';
COMMENT ON COLUMN public.wallet_addresses.chain_name IS '区块链网络: 1=BITCOIN, 2=EVM-Compatible, 3=SOLANA, 4=TRON, 5=TON, 6=SUI';
COMMENT ON COLUMN public.wallet_addresses.exchange_name IS '交易所: 1=BINANCE, 2=OKX, 3=coinbase, 4=Bitget, 5=Gate, 6=Bybit, 7=KuCoin, 8=火币';
