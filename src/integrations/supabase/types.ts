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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      monthly_targets: {
        Row: {
          id: string
          user_id: string
          year: number
          month: number
          target_profit: number
          target_qty: number
          target_stock: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          year: number
          month: number
          target_profit?: number
          target_qty?: number
          target_stock?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          year?: number
          month?: number
          target_profit?: number
          target_qty?: number
          target_stock?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string
          tier: string
          total_orders: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone: string
          tier?: string
          total_orders?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string
          tier?: string
          total_orders?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      general_expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          expense_date: string
          id: string
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          expense_date?: string
          id?: string
          name: string
          notes?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          expense_date?: string
          id?: string
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      general_income: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          id: string
          income_date: string
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          id?: string
          income_date?: string
          name: string
          notes?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          id?: string
          income_date?: string
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_per_bottle: number
          product_id: string | null
          product_name: string
          quantity: number
          subtotal: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_per_bottle: number
          product_id?: string | null
          product_name: string
          quantity?: number
          subtotal: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_per_bottle?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          user_id?: string
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
          buy_price: number
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          id: string
          margin: number
          price_per_bottle: number
          quantity: number
          status: string
          tier: string
          total_price: number
          transfer_proof_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          buy_price: number
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          margin: number
          price_per_bottle: number
          quantity: number
          status?: string
          tier: string
          total_price: number
          transfer_proof_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          buy_price?: number
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          margin?: number
          price_per_bottle?: number
          quantity?: number
          status?: string
          tier?: string
          total_price?: number
          transfer_proof_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          default_sell_price: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_sell_price?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_sell_price?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          location: string | null
          mitra_level: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          mitra_level?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          mitra_level?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_entries: {
        Row: {
          buy_price_per_bottle: number | null
          created_at: string
          id: string
          notes: string | null
          order_id: string | null
          quantity: number
          tier: string | null
          total_buy_price: number | null
          transfer_proof_url: string | null
          type: string
          user_id: string
        }
        Insert: {
          buy_price_per_bottle?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          quantity: number
          tier?: string | null
          total_buy_price?: number | null
          transfer_proof_url?: string | null
          type: string
          user_id: string
        }
        Update: {
          buy_price_per_bottle?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          quantity?: number
          tier?: string | null
          total_buy_price?: number | null
          transfer_proof_url?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stock: {
        Row: {
          current_stock: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_stock?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_stock?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
