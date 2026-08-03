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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contract_addendum_items: {
        Row: {
          addendum_id: string
          cost_center_id: string | null
          created_at: string
          description: string
          financial_category: string
          id: string
          updated_at: string
          value: number
        }
        Insert: {
          addendum_id: string
          cost_center_id?: string | null
          created_at?: string
          description?: string
          financial_category?: string
          id?: string
          updated_at?: string
          value?: number
        }
        Update: {
          addendum_id?: string
          cost_center_id?: string | null
          created_at?: string
          description?: string
          financial_category?: string
          id?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_addendum_items_addendum_id_fkey"
            columns: ["addendum_id"]
            isOneToOne: false
            referencedRelation: "contract_addendums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_addendum_items_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_addendums: {
        Row: {
          contract_id: string
          created_at: string
          date: string
          description: string
          id: string
          tipo: string
          updated_at: string
          value: number
        }
        Insert: {
          contract_id: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          tipo?: string
          updated_at?: string
          value?: number
        }
        Update: {
          contract_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          tipo?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_addendums_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_items: {
        Row: {
          contract_id: string
          cost_center_id: string | null
          created_at: string
          description: string
          financial_category: string
          id: string
          updated_at: string
          value: number
        }
        Insert: {
          contract_id: string
          cost_center_id?: string | null
          created_at?: string
          description?: string
          financial_category?: string
          id?: string
          updated_at?: string
          value?: number
        }
        Update: {
          contract_id?: string
          cost_center_id?: string | null
          created_at?: string
          description?: string
          financial_category?: string
          id?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_items_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          adjustment_index: string
          adjustment_month: number
          budget_value: number | null
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          end_date: string
          financial_category: string
          global_value: number
          id: string
          number: string
          object: string
          signed: boolean
          start_date: string
          supplier: string
          updated_at: string
        }
        Insert: {
          adjustment_index?: string
          adjustment_month?: number
          budget_value?: number | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date: string
          financial_category?: string
          global_value?: number
          id?: string
          number: string
          object?: string
          signed?: boolean
          start_date: string
          supplier: string
          updated_at?: string
        }
        Update: {
          adjustment_index?: string
          adjustment_month?: number
          budget_value?: number | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string
          financial_category?: string
          global_value?: number
          id?: string
          number?: string
          object?: string
          signed?: boolean
          start_date?: string
          supplier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          active: boolean
          code: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      measurements: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          date: string
          description: string
          discount: number
          end_date: string | null
          id: string
          observation: string | null
          other_expenses: number
          start_date: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          contract_id: string
          created_at?: string
          date?: string
          description?: string
          discount?: number
          end_date?: string | null
          id?: string
          observation?: string | null
          other_expenses?: number
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          date?: string
          description?: string
          discount?: number
          end_date?: string | null
          id?: string
          observation?: string | null
          other_expenses?: number
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurements_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_contract_cost_center_allocation: {
        Row: {
          adjustment_value: number | null
          base_value: number | null
          contract_id: string | null
          contract_number: string | null
          contract_supplier: string | null
          contracted_value: number | null
          cost_center_id: string | null
          cost_center_name: string | null
          realized_value: number | null
          share: number | null
        }
        Relationships: []
      }
      v_contract_cost_center_sources: {
        Row: {
          addendum_description: string | null
          addendum_id: string | null
          contract_id: string | null
          cost_center_id: string | null
          description: string | null
          financial_category: string | null
          origin_type: string | null
          value: number | null
        }
        Relationships: []
      }
      v_cost_center_summary: {
        Row: {
          balance: number | null
          contract_count: number | null
          contracted_value: number | null
          cost_center_id: string | null
          cost_center_name: string | null
          realized_value: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_manage_contracts: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "financeiro" | "leitura"
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
      app_role: ["admin", "gestor", "financeiro", "leitura"],
    },
  },
} as const
