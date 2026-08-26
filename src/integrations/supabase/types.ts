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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      approval_tier_steps: {
        Row: {
          approver_id: string
          created_at: string
          id: string
          step_order: number
          tier_id: string
        }
        Insert: {
          approver_id: string
          created_at?: string
          id?: string
          step_order: number
          tier_id: string
        }
        Update: {
          approver_id?: string
          created_at?: string
          id?: string
          step_order?: number
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_tier_steps_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_tier_steps_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "approval_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_tiers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          max_value: number | null
          min_value: number
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          max_value?: number | null
          min_value?: number
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          max_value?: number | null
          min_value?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          changed_by: string | null
          changed_fields: string[]
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          changed_fields?: string[]
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          changed_fields?: string[]
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      billing_documents: {
        Row: {
          created_at: string
          doc_number: string
          doc_type: string
          file_name: string
          file_path: string
          id: string
          movement_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          doc_number?: string
          doc_type?: string
          file_name: string
          file_path: string
          id?: string
          movement_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          doc_number?: string
          doc_type?: string
          file_name?: string
          file_path?: string
          id?: string
          movement_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_documents_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "financial_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carreteiro_closings: {
        Row: {
          contract_id: string
          created_at: string
          created_by: string | null
          fuel_total: number
          id: string
          loads_total: number
          measurement_id: string | null
          net_total: number
          period_end: string
          period_start: string
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          created_by?: string | null
          fuel_total?: number
          id?: string
          loads_total?: number
          measurement_id?: string | null
          net_total?: number
          period_end: string
          period_start: string
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          created_by?: string | null
          fuel_total?: number
          id?: string
          loads_total?: number
          measurement_id?: string | null
          net_total?: number
          period_end?: string
          period_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carreteiro_closings_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "carreteiro_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_closings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_closings_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "contract_measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      carreteiro_contracts: {
        Row: {
          active: boolean
          carrier_name: string
          contract_id: string | null
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          end_date: string | null
          financial_category: string
          id: string
          notes: string
          number: string
          pricing_mode: string
          start_date: string
          supplier_id: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          carrier_name: string
          contract_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          financial_category?: string
          id?: string
          notes?: string
          number: string
          pricing_mode?: string
          start_date?: string
          supplier_id?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          carrier_name?: string
          contract_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          financial_category?: string
          id?: string
          notes?: string
          number?: string
          pricing_mode?: string
          start_date?: string
          supplier_id?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carreteiro_contracts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_contracts_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_contracts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      carreteiro_fuel: {
        Row: {
          closing_id: string | null
          contract_id: string | null
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          fuel_date: string
          id: string
          liters: number
          notes: string
          plate_id: string
          price_per_liter: number
          total_value: number
          updated_at: string
        }
        Insert: {
          closing_id?: string | null
          contract_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          fuel_date?: string
          id?: string
          liters?: number
          notes?: string
          plate_id: string
          price_per_liter?: number
          total_value?: number
          updated_at?: string
        }
        Update: {
          closing_id?: string | null
          contract_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          fuel_date?: string
          id?: string
          liters?: number
          notes?: string
          plate_id?: string
          price_per_liter?: number
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carreteiro_fuel_closing_fk"
            columns: ["closing_id"]
            isOneToOne: false
            referencedRelation: "carreteiro_closings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_fuel_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "carreteiro_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_fuel_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_fuel_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_fuel_plate_id_fkey"
            columns: ["plate_id"]
            isOneToOne: false
            referencedRelation: "carreteiro_plates"
            referencedColumns: ["id"]
          },
        ]
      }
      carreteiro_loads: {
        Row: {
          closing_id: string | null
          contract_id: string
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          destination: string
          financial_category: string
          id: string
          km: number
          load_date: string
          notes: string
          origin: string
          plate_id: string
          pricing_mode: string
          tons: number
          total_value: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          closing_id?: string | null
          contract_id: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string
          financial_category?: string
          id?: string
          km?: number
          load_date?: string
          notes?: string
          origin?: string
          plate_id: string
          pricing_mode?: string
          tons?: number
          total_value?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          closing_id?: string | null
          contract_id?: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string
          financial_category?: string
          id?: string
          km?: number
          load_date?: string
          notes?: string
          origin?: string
          plate_id?: string
          pricing_mode?: string
          tons?: number
          total_value?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carreteiro_loads_closing_fk"
            columns: ["closing_id"]
            isOneToOne: false
            referencedRelation: "carreteiro_closings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_loads_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "carreteiro_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_loads_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_loads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_loads_plate_id_fkey"
            columns: ["plate_id"]
            isOneToOne: false
            referencedRelation: "carreteiro_plates"
            referencedColumns: ["id"]
          },
        ]
      }
      carreteiro_plate_links: {
        Row: {
          contract_id: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          plate_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          plate_id: string
          start_date?: string
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          plate_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carreteiro_plate_links_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "carreteiro_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_plate_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_plate_links_plate_id_fkey"
            columns: ["plate_id"]
            isOneToOne: false
            referencedRelation: "carreteiro_plates"
            referencedColumns: ["id"]
          },
        ]
      }
      carreteiro_plates: {
        Row: {
          active: boolean
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          driver_name: string
          id: string
          notes: string
          plate: string
          status: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          driver_name?: string
          id?: string
          notes?: string
          plate: string
          status?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          driver_name?: string
          id?: string
          notes?: string
          plate?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carreteiro_plates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carreteiro_plates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      contract_documents: {
        Row: {
          contract_id: string
          created_at: string
          file_name: string
          file_path: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      contract_measurement_approvals: {
        Row: {
          approver_id: string
          comment: string | null
          created_at: string
          decision: string
          id: string
          measurement_id: string
          step_order: number
        }
        Insert: {
          approver_id: string
          comment?: string | null
          created_at?: string
          decision: string
          id?: string
          measurement_id: string
          step_order: number
        }
        Update: {
          approver_id?: string
          comment?: string | null
          created_at?: string
          decision?: string
          id?: string
          measurement_id?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_measurement_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_measurement_approvals_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "contract_measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_measurement_cost_centers: {
        Row: {
          cost_center_id: string | null
          created_at: string
          id: string
          measurement_id: string
          value: number
        }
        Insert: {
          cost_center_id?: string | null
          created_at?: string
          id?: string
          measurement_id: string
          value?: number
        }
        Update: {
          cost_center_id?: string | null
          created_at?: string
          id?: string
          measurement_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_measurement_cost_centers_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_measurement_cost_centers_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "contract_measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_measurements: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          contract_id: string
          created_at: string
          created_by: string
          current_step: number
          id: string
          notes: string
          reference_month: string
          rejection_reason: string | null
          status: string
          tier_id: string | null
          total_value: number
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contract_id: string
          created_at?: string
          created_by: string
          current_step?: number
          id?: string
          notes?: string
          reference_month?: string
          rejection_reason?: string | null
          status?: string
          tier_id?: string | null
          total_value?: number
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contract_id?: string
          created_at?: string
          created_by?: string
          current_step?: number
          id?: string
          notes?: string
          reference_month?: string
          rejection_reason?: string | null
          status?: string
          tier_id?: string | null
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_measurements_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_measurements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_measurements_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "measurement_approval_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_request_approvals: {
        Row: {
          approver_id: string
          comment: string | null
          created_at: string
          decision: string
          id: string
          request_id: string
          step_order: number
        }
        Insert: {
          approver_id: string
          comment?: string | null
          created_at?: string
          decision: string
          id?: string
          request_id: string
          step_order: number
        }
        Update: {
          approver_id?: string
          comment?: string | null
          created_at?: string
          decision?: string
          id?: string
          request_id?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_request_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_request_approvals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "contract_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_request_cost_centers: {
        Row: {
          cost_center_id: string | null
          created_at: string
          id: string
          request_id: string
          value: number
        }
        Insert: {
          cost_center_id?: string | null
          created_at?: string
          id?: string
          request_id: string
          value?: number
        }
        Update: {
          cost_center_id?: string | null
          created_at?: string
          id?: string
          request_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_request_cost_centers_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_request_cost_centers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "contract_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_request_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          request_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          request_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          request_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_request_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "contract_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_request_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_requests: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          contract_id: string | null
          created_at: string
          current_step: number
          deadline_days: number
          financial_category: string
          id: string
          object: string
          obligations_contracted: string
          obligations_contractor: string
          payment_terms: string
          rejection_reason: string | null
          requester_id: string
          specification: string
          status: string
          supplier_address: string
          supplier_cnpj: string
          supplier_id: string | null
          supplier_name: string
          supplier_representative: string
          tier_id: string | null
          total_value: number
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contract_id?: string | null
          created_at?: string
          current_step?: number
          deadline_days?: number
          financial_category?: string
          id?: string
          object?: string
          obligations_contracted?: string
          obligations_contractor?: string
          payment_terms?: string
          rejection_reason?: string | null
          requester_id: string
          specification?: string
          status?: string
          supplier_address?: string
          supplier_cnpj?: string
          supplier_id?: string | null
          supplier_name?: string
          supplier_representative?: string
          tier_id?: string | null
          total_value?: number
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contract_id?: string | null
          created_at?: string
          current_step?: number
          deadline_days?: number
          financial_category?: string
          id?: string
          object?: string
          obligations_contracted?: string
          obligations_contractor?: string
          payment_terms?: string
          rejection_reason?: string | null
          requester_id?: string
          specification?: string
          status?: string
          supplier_address?: string
          supplier_cnpj?: string
          supplier_id?: string | null
          supplier_name?: string
          supplier_representative?: string
          tier_id?: string | null
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_requests_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "approval_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          adjustment_index: string
          adjustment_month: number
          budget_value: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
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
          status: string
          supplier: string
          updated_at: string
        }
        Insert: {
          adjustment_index?: string
          adjustment_month?: number
          budget_value?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
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
          status?: string
          supplier: string
          updated_at?: string
        }
        Update: {
          adjustment_index?: string
          adjustment_month?: number
          budget_value?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
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
          status?: string
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
      financial_categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          kind: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          kind?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          kind?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_movements: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          due_date: string | null
          id: string
          measurement_id: string
          notes: string
          paid_at: string | null
          paid_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          contract_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          measurement_id: string
          notes?: string
          paid_at?: string | null
          paid_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          measurement_id?: string
          notes?: string
          paid_at?: string | null
          paid_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_movements_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_movements_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: true
            referencedRelation: "contract_measurements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_movements_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_approval_tier_steps: {
        Row: {
          approver_id: string
          created_at: string
          id: string
          step_order: number
          tier_id: string
        }
        Insert: {
          approver_id: string
          created_at?: string
          id?: string
          step_order: number
          tier_id: string
        }
        Update: {
          approver_id?: string
          created_at?: string
          id?: string
          step_order?: number
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurement_approval_tier_steps_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_approval_tier_steps_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "measurement_approval_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_approval_tiers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          max_value: number | null
          min_value: number
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          max_value?: number | null
          min_value?: number
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          max_value?: number | null
          min_value?: number
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
      products_services: {
        Row: {
          active: boolean
          created_at: string
          fiscal_code: string
          id: string
          kind: string
          name: string
          sku: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          fiscal_code?: string
          id?: string
          kind?: string
          name: string
          sku?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          fiscal_code?: string
          id?: string
          kind?: string
          name?: string
          sku?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
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
      suppliers: {
        Row: {
          active: boolean
          address: string
          city: string
          contact_name: string
          created_at: string
          district: string
          doc: string | null
          doc_type: string
          email: string
          id: string
          legal_name: string
          notes: string
          phone: string
          representative: string
          state: string
          trade_name: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          active?: boolean
          address?: string
          city?: string
          contact_name?: string
          created_at?: string
          district?: string
          doc?: string | null
          doc_type?: string
          email?: string
          id?: string
          legal_name?: string
          notes?: string
          phone?: string
          representative?: string
          state?: string
          trade_name: string
          updated_at?: string
          zip_code?: string
        }
        Update: {
          active?: boolean
          address?: string
          city?: string
          contact_name?: string
          created_at?: string
          district?: string
          doc?: string | null
          doc_type?: string
          email?: string
          id?: string
          legal_name?: string
          notes?: string
          phone?: string
          representative?: string
          state?: string
          trade_name?: string
          updated_at?: string
          zip_code?: string
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
      can_manage_master_data: { Args: { _user_id: string }; Returns: boolean }
      fn_cancel_contract: {
        Args: { _contract_id: string; _reason: string; _user_id: string }
        Returns: undefined
      }
      fn_cancel_contract_request: {
        Args: { _reason: string; _request_id: string; _user_id: string }
        Returns: undefined
      }
      fn_cancel_measurement: {
        Args: { _measurement_id: string; _reason: string; _user_id: string }
        Returns: undefined
      }
      fn_convert_request_to_contract: {
        Args: { _request_id: string }
        Returns: string
      }
      fn_decide_contract_request: {
        Args: { _approve: boolean; _comment?: string; _request_id: string }
        Returns: undefined
      }
      fn_decide_measurement: {
        Args: { _approve: boolean; _comment?: string; _measurement_id: string }
        Returns: undefined
      }
      fn_ensure_carreteiro_shadow_contract: {
        Args: { _cc_id: string }
        Returns: string
      }
      fn_find_approval_tier: { Args: { _value: number }; Returns: string }
      fn_find_measurement_tier: { Args: { _value: number }; Returns: string }
      fn_generate_carreteiro_closing: {
        Args: { _cc_id: string; _end: string; _start: string }
        Returns: string
      }
      fn_mark_movement_paid: {
        Args: { _movement_id: string }
        Returns: undefined
      }
      fn_submit_contract_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      fn_submit_measurement: {
        Args: { _measurement_id: string }
        Returns: undefined
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "financeiro" | "leitura" | "comprador"
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
      app_role: ["admin", "gestor", "financeiro", "leitura", "comprador"],
    },
  },
} as const
