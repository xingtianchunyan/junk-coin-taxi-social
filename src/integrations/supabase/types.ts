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
          destination_id: string | null
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
          destination_id?: string | null
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
          destination_id?: string | null
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
            foreignKeyName: "fixed_routes_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "preset_destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_routes_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      luggage_items: {
        Row: {
          created_at: string
          height_cm: number
          id: string
          length_cm: number
          quantity: number
          ride_request_id: string | null
          size_category: string
          width_cm: number
        }
        Insert: {
          created_at?: string
          height_cm: number
          id?: string
          length_cm: number
          quantity?: number
          ride_request_id?: string | null
          size_category: string
          width_cm: number
        }
        Update: {
          created_at?: string
          height_cm?: number
          id?: string
          length_cm?: number
          quantity?: number
          ride_request_id?: string | null
          size_category?: string
          width_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "luggage_items_ride_request_id_fkey"
            columns: ["ride_request_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
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
          admin_user_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          address: string
          admin_user_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          address?: string
          admin_user_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
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
      ride_group_members: {
        Row: {
          group_id: string | null
          id: string
          joined_at: string
          ride_request_id: string | null
        }
        Insert: {
          group_id?: string | null
          id?: string
          joined_at?: string
          ride_request_id?: string | null
        }
        Update: {
          group_id?: string | null
          id?: string
          joined_at?: string
          ride_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ride_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_group_members_ride_request_id_fkey"
            columns: ["ride_request_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_groups: {
        Row: {
          created_at: string
          id: string
          requested_time: string
          route_id: string | null
          status: string | null
          total_luggage_volume: number | null
          total_passengers: number | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          requested_time: string
          route_id?: string | null
          status?: string | null
          total_luggage_volume?: number | null
          total_passengers?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          requested_time?: string
          route_id?: string | null
          status?: string | null
          total_luggage_volume?: number | null
          total_passengers?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_groups_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "fixed_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_groups_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
      vehicles: {
        Row: {
          created_at: string
          destination_id: string | null
          driver_name: string
          id: string
          is_active: boolean | null
          license_plate: string
          max_passengers: number
          trunk_height_cm: number
          trunk_length_cm: number
          trunk_width_cm: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_id?: string | null
          driver_name: string
          id?: string
          is_active?: boolean | null
          license_plate: string
          max_passengers?: number
          trunk_height_cm?: number
          trunk_length_cm?: number
          trunk_width_cm?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_id?: string | null
          driver_name?: string
          id?: string
          is_active?: boolean | null
          license_plate?: string
          max_passengers?: number
          trunk_height_cm?: number
          trunk_length_cm?: number
          trunk_width_cm?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "preset_destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_addresses: {
        Row: {
          address: string
          chain_name: string
          created_at: string | null
          destination_id: string | null
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
          destination_id?: string | null
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
          destination_id?: string | null
          driver_id?: string | null
          id?: string
          is_active?: boolean | null
          owner_type?: string | null
          qr_code_url?: string | null
          symbol?: string
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
      user_role: ["passenger", "driver", "owner", "admin"],
    },
  },
} as const
