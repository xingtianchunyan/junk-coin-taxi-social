export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      fixed_routes: {
        Row: {
          created_at: string
          currency: string | null
          destination_id: string | null
          distance_km: number | null
          end_location: string
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean | null
          market_price: number | null
          name: string
          our_price: number | null
          start_location: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          destination_id?: string | null
          distance_km?: number | null
          end_location: string
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          market_price?: number | null
          name: string
          our_price?: number | null
          start_location: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          destination_id?: string | null
          distance_km?: number | null
          end_location?: string
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          market_price?: number | null
          name?: string
          our_price?: number | null
          start_location?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_routes_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "preset_destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      preset_destinations: {
        Row: {
          address: string
          admin_user_id: string | null
          contact: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          name: string
          service_days: Json | null
          service_end_time: string | null
          service_start_time: string | null
        }
        Insert: {
          address: string
          admin_user_id?: string | null
          contact?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          name: string
          service_days?: Json | null
          service_end_time?: string | null
          service_start_time?: string | null
        }
        Update: {
          address?: string
          admin_user_id?: string | null
          contact?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          name?: string
          service_days?: Json | null
          service_end_time?: string | null
          service_start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preset_destinations_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_requests: {
        Row: {
          access_code: string
          contact_info: string | null
          created_at: string | null
          end_location: string
          fixed_route_id: string | null
          friend_name: string
          id: string
          is_shared: boolean | null
          luggage: Json | null
          notes: string | null
          passenger_count: number | null
          payment_amount: number | null
          payment_currency: string | null
          payment_required: boolean | null
          payment_status: string | null
          payment_tx_hash: string | null
          requested_time: string
          start_location: string
          status: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          access_code?: string
          contact_info?: string | null
          created_at?: string | null
          end_location: string
          fixed_route_id?: string | null
          friend_name: string
          id?: string
          is_shared?: boolean | null
          luggage?: Json | null
          notes?: string | null
          passenger_count?: number | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_required?: boolean | null
          payment_status?: string | null
          payment_tx_hash?: string | null
          requested_time: string
          start_location: string
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          access_code?: string
          contact_info?: string | null
          created_at?: string | null
          end_location?: string
          fixed_route_id?: string | null
          friend_name?: string
          id?: string
          is_shared?: boolean | null
          luggage?: Json | null
          notes?: string | null
          passenger_count?: number | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_required?: boolean | null
          payment_status?: string | null
          payment_tx_hash?: string | null
          requested_time?: string
          start_location?: string
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_requests_fixed_route_id_fkey"
            columns: ["fixed_route_id"]
            isOneToOne: false
            referencedRelation: "fixed_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          access_code: string
          created_at: string
          destination_id: string | null
          id: string
          role: string | null
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          access_code?: string
          created_at?: string
          destination_id?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          access_code?: string
          created_at?: string
          destination_id?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "preset_destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          current_status: string | null
          destination_id: string | null
          discount_percentage: number | null
          driver_name: string
          driver_phone: string | null
          id: string
          is_active: boolean | null
          last_trip_end_time: string | null
          license_plate: string
          max_passengers: number
          trunk_height_cm: number
          trunk_length_cm: number
          trunk_width_cm: number
          updated_at: string
          user_id: string | null
          work_end_date: string | null
          work_end_time: string | null
          work_start_date: string | null
          work_start_time: string | null
        }
        Insert: {
          created_at?: string
          current_status?: string | null
          destination_id?: string | null
          discount_percentage?: number | null
          driver_name: string
          driver_phone?: string | null
          id?: string
          is_active?: boolean | null
          last_trip_end_time?: string | null
          license_plate: string
          max_passengers?: number
          trunk_height_cm?: number
          trunk_length_cm?: number
          trunk_width_cm?: number
          updated_at?: string
          user_id?: string | null
          work_end_date?: string | null
          work_end_time?: string | null
          work_start_date?: string | null
          work_start_time?: string | null
        }
        Update: {
          created_at?: string
          current_status?: string | null
          destination_id?: string | null
          discount_percentage?: number | null
          driver_name?: string
          driver_phone?: string | null
          id?: string
          is_active?: boolean | null
          last_trip_end_time?: string | null
          license_plate?: string
          max_passengers?: number
          trunk_height_cm?: number
          trunk_length_cm?: number
          trunk_width_cm?: number
          updated_at?: string
          user_id?: string | null
          work_end_date?: string | null
          work_end_time?: string | null
          work_start_date?: string | null
          work_start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "preset_destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_addresses: {
        Row: {
          address: string
          chain_name: number
          created_at: string | null
          destination_id: string | null
          exchange_name: number | null
          id: string
          is_active: boolean | null
          pay_way: number
          qr_code_url: string | null
          route_id: string | null
          symbol: string
          vehicle_id: string | null
        }
        Insert: {
          address: string
          chain_name: number
          created_at?: string | null
          destination_id?: string | null
          exchange_name?: number | null
          id?: string
          is_active?: boolean | null
          pay_way?: number
          qr_code_url?: string | null
          route_id?: string | null
          symbol: string
          vehicle_id?: string | null
        }
        Update: {
          address?: string
          chain_name?: number
          created_at?: string | null
          destination_id?: string | null
          exchange_name?: number | null
          id?: string
          is_active?: boolean | null
          pay_way?: number
          qr_code_url?: string | null
          route_id?: string | null
          symbol?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_addresses_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "preset_destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_addresses_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "fixed_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_addresses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_approved_destinations: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          address: string
          contact: string
          description: string
          service_start_time: string
          service_end_time: string
          service_days: Json
          is_active: boolean
          is_approved: boolean
          admin_user_id: string
          created_at: string
        }[]
      }
      get_or_create_user_by_access_code: {
        Args: { input_access_code: string }
        Returns: {
          id: string
          access_code: string
          role: string
          wallet_address: string
          destination_id: string
          created_at: string
          updated_at: string
        }[]
      }
      validate_access_code: {
        Args: { input_access_code: string }
        Returns: {
          access_code: string
          role: string
        }[]
      }
    }
    Enums: {
      user_role: "passenger" | "driver" | "community_admin" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["passenger", "driver", "community_admin", "super_admin"],
    },
  },
} as const
