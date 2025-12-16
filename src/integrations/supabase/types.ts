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
      ai_analysed_resume: {
        Row: {
          city: string | null
          consideration: string | null
          created_at: string
          cv_url: string | null
          educational_details: string | null
          email: string | null
          id: string
          job_history: string | null
          job_id: string
          name: string | null
          phone: string | null
          skills: string | null
          status: string | null
          summarize: string | null
          vote: string | null
        }
        Insert: {
          city?: string | null
          consideration?: string | null
          created_at?: string
          cv_url?: string | null
          educational_details?: string | null
          email?: string | null
          id?: string
          job_history?: string | null
          job_id: string
          name?: string | null
          phone?: string | null
          skills?: string | null
          status?: string | null
          summarize?: string | null
          vote?: string | null
        }
        Update: {
          city?: string | null
          consideration?: string | null
          created_at?: string
          cv_url?: string | null
          educational_details?: string | null
          email?: string | null
          id?: string
          job_history?: string | null
          job_id?: string
          name?: string | null
          phone?: string | null
          skills?: string | null
          status?: string | null
          summarize?: string | null
          vote?: string | null
        }
        Relationships: []
      }
      applicants: {
        Row: {
          created_at: string
          cv_url: string
          email: string
          id: string
          job_id: string
          name: string
        }
        Insert: {
          created_at?: string
          cv_url: string
          email: string
          id?: string
          job_id: string
          name: string
        }
        Update: {
          created_at?: string
          cv_url?: string
          email?: string
          id?: string
          job_id?: string
          name?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          conflict_notified: boolean | null
          created_at: string
          department: string
          id: string
          purpose: string
          status: string
          time_slot: string
          tractor_id: string
          trolley_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date: string
          conflict_notified?: boolean | null
          created_at?: string
          department: string
          id?: string
          purpose: string
          status?: string
          time_slot: string
          tractor_id: string
          trolley_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          conflict_notified?: boolean | null
          created_at?: string
          department?: string
          id?: string
          purpose?: string
          status?: string
          time_slot?: string
          tractor_id?: string
          trolley_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_tractor_id_fkey"
            columns: ["tractor_id"]
            isOneToOne: false
            referencedRelation: "tractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trolley_id_fkey"
            columns: ["trolley_id"]
            isOneToOne: false
            referencedRelation: "trolleys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          booking_id: string
          created_at: string
          feedback_date: string
          id: string
          received: boolean
        }
        Insert: {
          booking_id: string
          created_at?: string
          feedback_date?: string
          id?: string
          received: boolean
        }
        Update: {
          booking_id?: string
          created_at?: string
          feedback_date?: string
          id?: string
          received?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "feedback_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_profiles: {
        Row: {
          company_name: string
          created_at: string
          id: string
          initials: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id: string
          initials: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          initials?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_listings: {
        Row: {
          company_name: string
          created_at: string
          education_required: string | null
          expected_salary: string | null
          hr_user_id: string
          id: string
          job_description: string
          job_id: string
          job_profile: string
          location_type: string | null
          ranking_criteria: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          education_required?: string | null
          expected_salary?: string | null
          hr_user_id: string
          id?: string
          job_description: string
          job_id: string
          job_profile: string
          location_type?: string | null
          ranking_criteria?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          education_required?: string | null
          expected_salary?: string | null
          hr_user_id?: string
          id?: string
          job_description?: string
          job_id?: string
          job_profile?: string
          location_type?: string | null
          ranking_criteria?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotation_requests: {
        Row: {
          address: string | null
          builder_name: string | null
          chat_id: string | null
          created_at: string | null
          customer_name: string
          discount_percentage: number | null
          final_amount_gst: number | null
          final_amount_net: number | null
          id: number
          products_raw: string | null
          quotation_number: string | null
        }
        Insert: {
          address?: string | null
          builder_name?: string | null
          chat_id?: string | null
          created_at?: string | null
          customer_name: string
          discount_percentage?: number | null
          final_amount_gst?: number | null
          final_amount_net?: number | null
          id?: number
          products_raw?: string | null
          quotation_number?: string | null
        }
        Update: {
          address?: string | null
          builder_name?: string | null
          chat_id?: string | null
          created_at?: string | null
          customer_name?: string
          discount_percentage?: number | null
          final_amount_gst?: number | null
          final_amount_net?: number | null
          id?: number
          products_raw?: string | null
          quotation_number?: string | null
        }
        Relationships: []
      }
      shortlinks: {
        Row: {
          created_at: string
          id: string
          job_listing_id: string
        }
        Insert: {
          created_at?: string
          id: string
          job_listing_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlinks_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      tractors: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      trolleys: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
          type?: string
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "department"
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
      app_role: ["admin", "department"],
    },
  },
} as const
