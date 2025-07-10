-- 为users表添加钱包地址字段
ALTER TABLE public.users 
ADD COLUMN wallet_address TEXT UNIQUE;

-- 添加索引以提高查询性能
CREATE INDEX idx_users_wallet_address ON public.users(wallet_address);

-- 添加评论说明
COMMENT ON COLUMN public.users.wallet_address IS 'Web3钱包地址，与访问码绑定';