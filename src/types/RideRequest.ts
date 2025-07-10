export interface LuggageItem {
  length: number;
  width: number;
  height: number;
  quantity: number;
}

export interface RideRequest {
  id: string;
  access_code: string;
  friend_name: string;
  start_location: string;
  end_location: string;
  requested_time: Date;
  contact_info: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_required: boolean;
  payment_amount?: number;
  payment_currency?: string;
  payment_status: 'unpaid' | 'pending' | 'confirmed' | 'failed';
  payment_tx_hash?: string;
  fixed_route_id?: string;
  passenger_count?: number;
  luggage: LuggageItem[];
  created_at: Date;
  updated_at: Date;
}

export interface WalletAddress {
  id: string;
  pay_way: number; // 1=区块链支付, 2=交易所转账, 3=支付宝/微信, 4=现金, 5=免费
  chain_name: number; // 1=BITCOIN, 2=EVM-Compatible, 3=SOLANA, 4=TRON, 5=TON, 6=SUI
  exchange_name?: number; // 1=BINANCE, 2=OKX, 3=coinbase, 4=Bitget, 5=Gate, 6=Bybit, 7=KuCoin, 8=火币
  symbol: string;
  address: string;
  qr_code_url?: string;
  is_active: boolean;
  created_at: Date;
  destination_id?: string;
  route_id?: string;
  vehicle_id?: string;
  // 关联数据
  route?: {
    id: string;
    name: string;
    start_location: string;
    end_location: string;
  };
  vehicle?: {
    id: string;
    driver_name: string;
    license_plate: string;
  };
}

export interface Payment {
  id: string;
  ride_request_id: string;
  amount: number;
  currency: string;
  wallet_address: string;
  transaction_hash?: string;
  payment_method: string;
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  created_at: Date;
  confirmed_at?: Date;
}


export interface PresetDestination {
  id: string;
  name: string;
  address: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  admin_user_id?: string;
}

export interface FixedRoute {
  id: string;
  name: string;
  start_location: string;
  end_location: string;
  distance_km?: number;
  estimated_duration_minutes?: number;
  market_price?: number;
  our_price?: number;
  currency: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  destination_id?: string;
}

export interface Vehicle {
  id: string;
  driver_name: string;
  driver_phone?: string;
  license_plate: string;
  max_passengers: number;
  trunk_length_cm: number;
  trunk_width_cm: number;
  trunk_height_cm: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  destination_id?: string;
}
