
export interface Vehicle {
  id: string;
  driver_name: string;
  license_plate: string;
  max_passengers: number;
  trunk_length_cm: number;
  trunk_width_cm: number;
  trunk_height_cm: number;
  is_active: boolean;
  user_id?: string;
  access_code?: string;
  created_at: Date;
  updated_at: Date;
}

export interface LuggageItem {
  id: string;
  ride_request_id?: string;
  size_category: 'small' | 'medium' | 'large' | 'extra_large';
  length_cm: number;
  width_cm: number;
  height_cm: number;
  quantity: number;
  created_at: Date;
}

export interface RideGroup {
  id: string;
  vehicle_id?: string;
  route_id?: string;
  requested_time: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_passengers: number;
  total_luggage_volume: number;
  created_at: Date;
  updated_at: Date;
  vehicle?: Vehicle;
  members?: RideGroupMember[];
}

export interface RideGroupMember {
  id: string;
  group_id?: string;
  ride_request_id?: string;
  joined_at: Date;
  ride_request?: any;
}
