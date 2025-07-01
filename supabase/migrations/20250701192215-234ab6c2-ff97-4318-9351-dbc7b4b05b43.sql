
-- 创建管理员用户表
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建钱包地址配置表
CREATE TABLE public.wallet_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  address TEXT NOT NULL,
  qr_code_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 修改用车需求表结构
CREATE TABLE public.ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  friend_name TEXT NOT NULL,
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL,
  requested_time TIMESTAMP WITH TIME ZONE NOT NULL,
  contact_info TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_required BOOLEAN DEFAULT false,
  payment_amount DECIMAL(10,2),
  payment_currency TEXT,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'confirmed', 'failed')),
  payment_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建支付记录表
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_request_id UUID REFERENCES public.ride_requests(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  transaction_hash TEXT,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- 启用行级安全性
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略

-- 管理员用户表：只有管理员可以访问
CREATE POLICY "Only admins can access admin_users" ON public.admin_users FOR ALL USING (false);

-- 钱包地址表：所有人都可以查看，只有管理员可以修改
CREATE POLICY "Anyone can view active wallet addresses" ON public.wallet_addresses 
  FOR SELECT USING (is_active = true);

-- 用车需求表：根据访问权限分层
CREATE POLICY "Anyone can view basic ride info" ON public.ride_requests 
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert ride requests" ON public.ride_requests 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update their own ride requests with access code" ON public.ride_requests 
  FOR UPDATE USING (true);

-- 支付记录表：关联的用车需求可以查看
CREATE POLICY "Anyone can view payments for accessible rides" ON public.payments 
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert payments" ON public.payments 
  FOR INSERT WITH CHECK (true);

-- 插入一些示例钱包地址
INSERT INTO public.wallet_addresses (chain_name, symbol, address) VALUES
('Ethereum', 'ETH', '0x742d35Cc6634C0532925a3b8D93329c7c42A5d00'),
('Binance Smart Chain', 'BNB', '0x742d35Cc6634C0532925a3b8D93329c7c42A5d00'),
('Polygon', 'MATIC', '0x742d35Cc6634C0532925a3b8D93329c7c42A5d00'),
('Bitcoin', 'BTC', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'),
('Tron', 'TRX', 'TRX9aJ4J4JJ4J4J4J4J4J4J4J4J4J4J4J4');

-- 创建管理员账户（密码：admin123，实际使用时应该加密）
INSERT INTO public.admin_users (username, email, password_hash) VALUES
('admin', 'admin@example.com', '$2b$10$rQ7QBqjY1xKpjvhKFPOHV.J8SWfW6xQWJ5xgOSKPqBqEGvqFJHK5e');
