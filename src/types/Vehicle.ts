
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
  destination_id?: string;
  work_start_time?: string;
  work_end_time?: string;
  work_start_date?: string;
  work_end_date?: string;
  current_status?: string;
  discount_percentage?: number;
  users?: {
    access_code?: string;
  };
}

