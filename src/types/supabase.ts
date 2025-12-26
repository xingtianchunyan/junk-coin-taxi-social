import type { Database } from '@/integrations/supabase/types';

export interface ExtendedDatabase extends Database {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      payments: {
        Row: {
          id: string;
          ride_request_id: string;
          amount: number;
          currency: string;
          wallet_address: string;
          transaction_hash: string | null;
          payment_method: string;
          status: string;
          created_at: string;
          confirmed_at: string | null;
        };
        Insert: Omit<ExtendedDatabase['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'confirmed_at'> & {
          id?: string;
          created_at?: string;
          confirmed_at?: string | null;
        };
        Update: Partial<ExtendedDatabase['public']['Tables']['payments']['Insert']>;
      };
    };
    Functions: {
      calculate_ride_fare: {
        Args: {
          p_fixed_route_id: string;
          p_vehicle_id?: string;
        };
        Returns: {
          amount: number;
          currency: string;
          is_discounted: boolean;
        }[];
      };
      verify_and_confirm_payment: {
        Args: {
          p_payment_id: string;
          p_transaction_hash: string;
        };
        Returns: boolean;
      };
      check_driver_timing_conflict: {
        Args: {
          p_vehicle_id: string;
          p_fixed_route_id: string;
          p_requested_time: string;
        };
        Returns: boolean;
      };
    };
  };
}
