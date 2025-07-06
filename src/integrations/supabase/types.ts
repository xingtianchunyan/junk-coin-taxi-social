export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password_hash?: string
          username?: string
        }
        Relationships: []
      }
      driver_pricing: {
        Row: {
          base_price: number | null
          created_at: string | null
          currency: string | null
          driver_id: string
          id: string
          is_active: boolean | null
          price_per_km: number | null
          route_id: string | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          created_at?: string | null
          currency?: string | null
          driver_id: string
          id?: string
          is_active?: boolean | null
          price_per_km?: number | null
          route_id?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          created_at?: string | null
          currency?: string | null
          driver_id?: string
          id?: string
          is_active?: boolean | null
          price_per_km?: number | null
          route_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_pricing_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_pricing_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "fixed_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_schedules: {
        Row: {
          created_at: string | null
          day_of_week: number
          driver_id: string
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          driver_id: string
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          driver_id?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_schedules_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string | null
          experience_years: number | null
          id: string
          is_active: boolean | null
          license_number: string | null
          rating: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          experience_years?: number | null
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          rating?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          experience_years?: number | null
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          rating?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fixed_routes: {
        Row: {
          created_at: string
          currency: string | null
          distance_km: number | null
          driver_id: string | null
          end_location: string
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean | null
          market_price: number | null
          max_passengers: number | null
          name: string
          our_price: number | null
          start_location: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          distance_km?: number | null
          driver_id?: string | null
          end_location: string
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          market_price?: number | null
          max_passengers?: number | null
          name: string
          our_price?: number | null
          start_location: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          distance_km?: number | null
          driver_id?: string | null
          end_location?: string
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          market_price?: number | null
          max_passengers?: number | null
          name?: string
          our_price?: number | null
          start_location?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_routes_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          description: string | null
          id: string
          identifier: string
          is_active: boolean | null
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          identifier: string
          is_active?: boolean | null
          name: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          identifier?: string
          is_active?: boolean | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string | null
          currency: string
          id: string
          payment_method: string
          ride_request_id: string | null
          status: string | null
          transaction_hash: string | null
          wallet_address: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string | null
          currency: string
          id?: string
          payment_method: string
          ride_request_id?: string | null
          status?: string | null
          transaction_hash?: string | null
          wallet_address: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          payment_method?: string
          ride_request_id?: string | null
          status?: string | null
          transaction_hash?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_ride_request_id_fkey"
            columns: ["ride_request_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      preset_destinations: {
        Row: {
          address: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          address: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          address?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      ride_requests: {
        Row: {
          access_code: string
          contact_info: string | null
          created_at: string | null
          driver_id: string | null
          end_location: string
          fixed_route_id: string | null
          friend_name: string
          id: string
          is_shared: boolean | null
          notes: string | null
          passenger_count: number | null
          payment_amount: number | null
          payment_blockchain: string | null
          payment_currency: string | null
          payment_required: boolean | null
          payment_status: string | null
          payment_tx_hash: string | null
          requested_time: string
          sender_wallet_address: string | null
          start_location: string
          status: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          access_code?: string
          contact_info?: string | null
          created_at?: string | null
          driver_id?: string | null
          end_location: string
          fixed_route_id?: string | null
          friend_name: string
          id?: string
          is_shared?: boolean | null
          notes?: string | null
          passenger_count?: number | null
          payment_amount?: number | null
          payment_blockchain?: string | null
          payment_currency?: string | null
          payment_required?: boolean | null
          payment_status?: string | null
          payment_tx_hash?: string | null
          requested_time: string
          sender_wallet_address?: string | null
          start_location: string
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          access_code?: string
          contact_info?: string | null
          created_at?: string | null
          driver_id?: string | null
          end_location?: string
          fixed_route_id?: string | null
          friend_name?: string
          id?: string
          is_shared?: boolean | null
          notes?: string | null
          passenger_count?: number | null
          payment_amount?: number | null
          payment_blockchain?: string | null
          payment_currency?: string | null
          payment_required?: boolean | null
          payment_status?: string | null
          payment_tx_hash?: string | null
          requested_time?: string
          sender_wallet_address?: string | null
          start_location?: string
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_fixed_route_id_fkey"
            columns: ["fixed_route_id"]
            isOneToOne: false
            referencedRelation: "fixed_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      supported_coins: {
        Row: {
          created_at: string
          exchange: string
          id: string
          is_active: boolean | null
          name: string
          symbol: string
        }
        Insert: {
          created_at?: string
          exchange: string
          id?: string
          is_active?: boolean | null
          name: string
          symbol: string
        }
        Update: {
          created_at?: string
          exchange?: string
          id?: string
          is_active?: boolean | null
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          phone: string | null
          roles: Database["public"]["Enums"]["user_role"][] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          phone?: string | null
          roles?: Database["public"]["Enums"]["user_role"][] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          phone?: string | null
          roles?: Database["public"]["Enums"]["user_role"][] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          access_code: string
          created_at: string
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          access_code?: string
          created_at?: string
          id?: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          access_code?: string
          created_at?: string
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vehicle_availability: {
        Row: {
          available_date: string
          created_at: string | null
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          available_date: string
          created_at?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          available_date?: string
          created_at?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_availability_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_operation_logs: {
        Row: {
          created_at: string | null
          currency: string | null
          distance_km: number | null
          driver_id: string
          end_time: string | null
          id: string
          revenue: number | null
          ride_request_id: string | null
          start_time: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          distance_km?: number | null
          driver_id: string
          end_time?: string | null
          id?: string
          revenue?: number | null
          ride_request_id?: string | null
          start_time?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          distance_km?: number | null
          driver_id?: string
          end_time?: string | null
          id?: string
          revenue?: number | null
          ride_request_id?: string | null
          start_time?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_operation_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_operation_logs_ride_request_id_fkey"
            columns: ["ride_request_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_operation_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_reservations: {
        Row: {
          created_at: string | null
          driver_id: string
          end_time: string
          id: string
          start_time: string
          status: string | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          driver_id: string
          end_time: string
          id?: string
          start_time: string
          status?: string | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          driver_id?: string
          end_time?: string
          id?: string
          start_time?: string
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_reservations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_reservations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity: number | null
          color: string | null
          created_at: string | null
          features: Json | null
          id: string
          images: string[] | null
          is_active: boolean | null
          license_plate: string | null
          make: string
          model: string
          owner_id: string
          updated_at: string | null
          year: number | null
        }
        Insert: {
          capacity?: number | null
          color?: string | null
          created_at?: string | null
          features?: Json | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          license_plate?: string | null
          make: string
          model: string
          owner_id: string
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          capacity?: number | null
          color?: string | null
          created_at?: string | null
          features?: Json | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          license_plate?: string | null
          make?: string
          model?: string
          owner_id?: string
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      wallet_addresses: {
        Row: {
          address: string
          chain_name: string
          created_at: string | null
          driver_id: string | null
          id: string
          is_active: boolean | null
          owner_type: string | null
          qr_code_url: string | null
          symbol: string
        }
        Insert: {
          address: string
          chain_name: string
          created_at?: string | null
          driver_id?: string | null
          id?: string
          is_active?: boolean | null
          owner_type?: string | null
          qr_code_url?: string | null
          symbol: string
        }
        Update: {
          address?: string
          chain_name?: string
          created_at?: string | null
          driver_id?: string | null
          id?: string
          is_active?: boolean | null
          owner_type?: string | null
          qr_code_url?: string | null
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_addresses_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "passenger" | "driver" | "owner" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["passenger", "driver", "owner", "admin"],
    },
  },
} as const
