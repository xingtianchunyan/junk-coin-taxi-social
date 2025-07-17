
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
  user_id?: string;
  access_code?: string;
}

