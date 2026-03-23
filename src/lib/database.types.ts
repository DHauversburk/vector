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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_booked: boolean | null
          member_id: string | null
          notes: string | null
          provider_id: string
          start_time: string
          status: string | null
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_booked?: boolean | null
          member_id?: string | null
          notes?: string | null
          provider_id: string
          start_time: string
          status?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_booked?: boolean | null
          member_id?: string | null
          notes?: string | null
          provider_id?: string
          start_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          severity: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          severity?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          severity?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      encounter_notes: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          category: string
          content: string
          created_at: string
          follow_up_appointment_id: string | null
          id: string
          member_id: string
          member_name: string | null
          provider_id: string
          resolved: boolean | null
          status: string
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          category: string
          content: string
          created_at?: string
          follow_up_appointment_id?: string | null
          id?: string
          member_id: string
          member_name?: string | null
          provider_id: string
          resolved?: boolean | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          category?: string
          content?: string
          created_at?: string
          follow_up_appointment_id?: string | null
          id?: string
          member_id?: string
          member_name?: string | null
          provider_id?: string
          resolved?: boolean | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encounter_notes_follow_up_appointment_id_fkey"
            columns: ["follow_up_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounter_notes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          appointment_id: string
          comment: string | null
          created_at: string | null
          id: string
          rating: number
        }
        Insert: {
          appointment_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
        }
        Update: {
          appointment_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "feedback_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      help_requests: {
        Row: {
          category: string
          created_at: string
          id: string
          member_id: string
          member_name: string | null
          message: string
          provider_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          status: string
          subject: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          member_id: string
          member_name?: string | null
          message: string
          provider_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          member_id?: string
          member_name?: string | null
          message?: string
          provider_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      note_statistics: {
        Row: {
          by_category: Json | null
          created_at: string | null
          id: string
          period: string
          provider_id: string
          requires_action_count: number | null
          total_encounters: number | null
          unique_patients: number | null
          updated_at: string | null
        }
        Insert: {
          by_category?: Json | null
          created_at?: string | null
          id?: string
          period: string
          provider_id: string
          requires_action_count?: number | null
          total_encounters?: number | null
          unique_patients?: number | null
          updated_at?: string | null
        }
        Update: {
          by_category?: Json | null
          created_at?: string | null
          id?: string
          period?: string
          provider_id?: string
          requires_action_count?: number | null
          total_encounters?: number | null
          unique_patients?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          provider_id: string
          title: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          provider_id: string
          title: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          provider_id?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      user_pins: {
        Row: {
          created_at: string
          pin_hash: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          pin_hash: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          pin_hash?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: string
          service_type: string | null
          status: string
          token_alias: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: string
          service_type?: string | null
          status: string
          token_alias: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: string
          service_type?: string | null
          status?: string
          token_alias?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          id: string
          member_id: string
          member_name: string | null
          note: string | null
          preferred_days: number[] | null
          provider_id: string
          service_type: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          member_name?: string | null
          note?: string | null
          preferred_days?: number[] | null
          provider_id: string
          service_type?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          member_name?: string | null
          note?: string | null
          preferred_days?: number[] | null
          provider_id?: string
          service_type?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_clear_schedule: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: number
      }
      admin_create_user: {
        Args: {
          new_email: string
          new_password: string
          new_role: string
          new_service_type: string
          new_token: string
        }
        Returns: string
      }
      admin_delete_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_prune_unused_accounts: {
        Args: { days_inactive: number }
        Returns: number
      }
      clear_provider_schedule: {
        Args: {
          p_end_date: string
          p_include_booked?: boolean
          p_start_date: string
        }
        Returns: number
      }
      delete_appointment: {
        Args: { p_appointment_id: string }
        Returns: undefined
      }
      fix_duplicate_users: { Args: never; Returns: number }
      generate_slots:
        | {
            Args: {
              p_break_minutes: number
              p_days_of_week: number[]
              p_duration_minutes: number
              p_end_date: string
              p_end_time: string
              p_is_block: boolean
              p_notes: string
              p_start_date: string
              p_start_time: string
              p_timezone_offset_minutes?: number
            }
            Returns: number
          }
        | {
            Args: {
              p_break_minutes: number
              p_days_of_week: number[]
              p_duration_minutes: number
              p_end_date: string
              p_end_time: string
              p_is_block?: boolean
              p_notes?: string
              p_start_date: string
              p_start_time: string
            }
            Returns: number
          }
      get_audit_logs:
        | {
            Args: {
              p_limit?: number
              p_offset?: number
              p_severity?: string
              p_type?: string
            }
            Returns: {
              action_type: string
              created_at: string
              description: string
              id: string
              metadata: Json
              role: string
              severity: string
              token_alias: string
              user_id: string
            }[]
          }
        | {
            Args: { p_limit: number; p_severity: string; p_type: string }
            Returns: {
              action_type: string
              created_at: string
              description: string
              id: string
              metadata: Json
              role: string
              severity: string
              token_alias: string
              user_id: string
            }[]
          }
      get_system_stats: { Args: never; Returns: Json }
      log_event: {
        Args: {
          p_action_type: string
          p_description: string
          p_metadata: Json
          p_severity: string
        }
        Returns: undefined
      }
      member_cancel_appointment: {
        Args: { p_appointment_id: string }
        Returns: undefined
      }
      provision_member: {
        Args: { p_service_type: string; p_token: string }
        Returns: string
      }
      reschedule_appointment: {
        Args: {
          new_end_time: string
          new_notes?: string
          new_provider_id: string
          new_start_time: string
          old_appointment_id: string
        }
        Returns: Json
      }
      reschedule_appointment_swap: {
        Args: { p_new_slot_id: string; p_old_appointment_id: string }
        Returns: undefined
      }
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
