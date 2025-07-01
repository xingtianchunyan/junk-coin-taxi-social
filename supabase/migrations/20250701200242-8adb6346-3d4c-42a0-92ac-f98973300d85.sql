
-- 创建支付途径表
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('exchange_uid', 'wallet_address', 'other')),
  identifier TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建支持的币种表
CREATE TABLE public.supported_coins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL CHECK (exchange IN ('binance', 'okx', 'manual')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(symbol, exchange)
);

-- 创建预设目的地表
CREATE TABLE public.preset_destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 为这些表启用RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preset_destinations ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略 - 所有用户都可以查看激活的记录
CREATE POLICY "Anyone can view active payment methods" 
  ON public.payment_methods 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Anyone can view active coins" 
  ON public.supported_coins 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Anyone can view active destinations" 
  ON public.preset_destinations 
  FOR SELECT 
  USING (is_active = true);

-- 插入一些初始的支付途径示例
INSERT INTO public.payment_methods (name, type, identifier, description) VALUES
('币安交易所', 'exchange_uid', 'binance_uid', '通过币安交易所UID进行转账'),
('OKX交易所', 'exchange_uid', 'okx_uid', '通过OKX交易所UID进行转账');

-- 插入一些常见币种
INSERT INTO public.supported_coins (symbol, name, exchange) VALUES
('BTC', 'Bitcoin', 'manual'),
('ETH', 'Ethereum', 'manual'),
('USDT', 'Tether', 'manual'),
('USDC', 'USD Coin', 'manual');

-- 插入一些预设目的地示例
INSERT INTO public.preset_destinations (name, address, description) VALUES
('主校区', '大学主校区门口', '学校主要入口'),
('图书馆', '中央图书馆', '图书馆主入口'),
('体育馆', '体育运动中心', '体育馆正门');
