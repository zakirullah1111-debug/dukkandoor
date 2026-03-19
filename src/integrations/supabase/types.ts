export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      farmer_profiles: {
        Row: {
          created_at: string
          farm_landmark: string | null
          farm_lat: number | null
          farm_lng: number | null
          full_name: string
          id: string
          saved_contacts: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_landmark?: string | null
          farm_lat?: number | null
          farm_lng?: number | null
          full_name?: string
          id?: string
          saved_contacts?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          farm_landmark?: string | null
          farm_lat?: number | null
          farm_lng?: number | null
          full_name?: string
          id?: string
          saved_contacts?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          product_id: string | null
          shop_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          product_id?: string | null
          shop_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          product_id?: string | null
          shop_id?: string | null
        }
        Relationships: []
      }
      hotel_profiles: {
        Row: {
          address: string
          business_hours: Json | null
          created_at: string
          description: string
          hotel_name: string
          hotel_type: string
          id: string
          is_open: boolean
          logo_url: string
          prep_time_minutes: number
          rating: number
          user_id: string
          village: string
        }
        Insert: {
          address?: string
          business_hours?: Json | null
          created_at?: string
          description?: string
          hotel_name?: string
          hotel_type?: string
          id?: string
          is_open?: boolean
          logo_url?: string
          prep_time_minutes?: number
          rating?: number
          user_id: string
          village?: string
        }
        Update: {
          address?: string
          business_hours?: Json | null
          created_at?: string
          description?: string
          hotel_name?: string
          hotel_type?: string
          id?: string
          is_open?: boolean
          logo_url?: string
          prep_time_minutes?: number
          rating?: number
          user_id?: string
          village?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string
          created_at: string
          description: string
          hotel_id: string
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          hotel_id: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          hotel_id?: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotel_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message_text: string
          order_id: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message_text: string
          order_id: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message_text?: string
          order_id?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          price_at_order: number
          product_id: string
          quantity: number
        }
        Insert: {
          id?: string
          order_id: string
          price_at_order?: number
          product_id: string
          quantity?: number
        }
        Update: {
          id?: string
          order_id?: string
          price_at_order?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          customer_note: string
          delivery_address: string
          delivery_fee: number
          delivery_lat: number | null
          delivery_lng: number | null
          delivery_photo_url: string
          farmer_offered_fee: number | null
          fee_acceptance_deadline: string | null
          home_contact_number: string | null
          hotel_id: string | null
          id: string
          items_description: string | null
          order_type: string
          payment_method: string
          rider_id: string | null
          rider_selected_by_customer: boolean
          shop_id: string
          shop_lat: number | null
          shop_lng: number | null
          status: string
          total_amount: number
          urgent: boolean
        }
        Insert: {
          created_at?: string
          customer_id: string
          customer_note?: string
          delivery_address?: string
          delivery_fee?: number
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_photo_url?: string
          farmer_offered_fee?: number | null
          fee_acceptance_deadline?: string | null
          home_contact_number?: string | null
          hotel_id?: string | null
          id?: string
          items_description?: string | null
          order_type?: string
          payment_method?: string
          rider_id?: string | null
          rider_selected_by_customer?: boolean
          shop_id: string
          shop_lat?: number | null
          shop_lng?: number | null
          status?: string
          total_amount?: number
          urgent?: boolean
        }
        Update: {
          created_at?: string
          customer_id?: string
          customer_note?: string
          delivery_address?: string
          delivery_fee?: number
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_photo_url?: string
          farmer_offered_fee?: number | null
          fee_acceptance_deadline?: string | null
          home_contact_number?: string | null
          hotel_id?: string | null
          id?: string
          items_description?: string | null
          order_type?: string
          payment_method?: string
          rider_id?: string | null
          rider_selected_by_customer?: boolean
          shop_id?: string
          shop_lat?: number | null
          shop_lng?: number | null
          status?: string
          total_amount?: number
          urgent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string
          discount_percent: number
          id: string
          image_url: string
          in_stock: boolean
          name: string
          price: number
          shop_id: string
          stock_quantity: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          discount_percent?: number
          id?: string
          image_url?: string
          in_stock?: boolean
          name: string
          price?: number
          shop_id: string
          stock_quantity?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          discount_percent?: number
          id?: string
          image_url?: string
          in_stock?: boolean
          name?: string
          price?: number
          shop_id?: string
          stock_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string
          created_at: string
          id: string
          name: string
          phone: string
          preferred_language: string
          role: string
          village: string
        }
        Insert: {
          address?: string
          created_at?: string
          id: string
          name?: string
          phone?: string
          preferred_language?: string
          role?: string
          village?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string
          preferred_language?: string
          role?: string
          village?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string
          created_at: string
          id: string
          order_id: string
          rated_by: string
          rating: number
          review_text: string
          rider_id: string
        }
        Insert: {
          comment?: string
          created_at?: string
          id?: string
          order_id: string
          rated_by: string
          rating: number
          review_text?: string
          rider_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          order_id?: string
          rated_by?: string
          rating?: number
          review_text?: string
          rider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rated_by_fkey"
            columns: ["rated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string
          id: string
          order_id: string | null
          reason: string
          reported_by: string
          reported_user_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          reason?: string
          reported_by: string
          reported_user_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          reason?: string
          reported_by?: string
          reported_user_id?: string | null
          status?: string
        }
        Relationships: []
      }
      riders: {
        Row: {
          average_rating: number
          bio: string
          current_lat: number | null
          current_lng: number | null
          id: string
          is_available: boolean
          is_verified: boolean
          location_updated_at: string | null
          profile_photo_url: string
          tier: string
          total_deliveries: number
          total_earnings: number
          user_id: string
          vehicle_type: string
        }
        Insert: {
          average_rating?: number
          bio?: string
          current_lat?: number | null
          current_lng?: number | null
          id?: string
          is_available?: boolean
          is_verified?: boolean
          location_updated_at?: string | null
          profile_photo_url?: string
          tier?: string
          total_deliveries?: number
          total_earnings?: number
          user_id: string
          vehicle_type?: string
        }
        Update: {
          average_rating?: number
          bio?: string
          current_lat?: number | null
          current_lng?: number | null
          id?: string
          is_available?: boolean
          is_verified?: boolean
          location_updated_at?: string | null
          profile_photo_url?: string
          tier?: string
          total_deliveries?: number
          total_earnings?: number
          user_id?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "riders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string
          business_hours: Json | null
          category: string
          created_at: string
          delivery_time: string
          description: string
          id: string
          is_open: boolean
          logo_url: string
          owner_id: string
          rating: number
          shop_name: string
          village: string
        }
        Insert: {
          address?: string
          business_hours?: Json | null
          category?: string
          created_at?: string
          delivery_time?: string
          description?: string
          id?: string
          is_open?: boolean
          logo_url?: string
          owner_id: string
          rating?: number
          shop_name: string
          village?: string
        }
        Update: {
          address?: string
          business_hours?: Json | null
          category?: string
          created_at?: string
          delivery_time?: string
          description?: string
          id?: string
          is_open?: boolean
          logo_url?: string
          owner_id?: string
          rating?: number
          shop_name?: string
          village?: string
        }
        Relationships: [
          {
            foreignKeyName: "shops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
