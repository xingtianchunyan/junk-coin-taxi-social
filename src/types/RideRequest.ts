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
  payment_blockchain?: string;
  payment_status: 'unpaid' | 'pending' | 'confirmed' | 'failed';
  payment_tx_hash?: string;
  sender_wallet_address?: string;
  fixed_route_id?: string;
  passenger_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface WalletAddress {
  id: string;
  chain_name: string;
  symbol: string;
  address: string;
  qr_code_url?: string;
  is_active: boolean;
  created_at: Date;
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

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'exchange_uid' | 'wallet_address' | 'other';
  identifier: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
}

export interface SupportedCoin {
  id: string;
  symbol: string;
  name: string;
  exchange: 'binance' | 'okx' | 'manual';
  is_active: boolean;
  created_at: Date;
}

export interface PresetDestination {
  id: string;
  name: string;
  address: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
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
}
