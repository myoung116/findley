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
      bookings: {
        Row: {
          adult_count: number
          booking_type: Database["public"]["Enums"]["booking_type"]
          created_at: string
          end_date: string
          guest_count: number
          id: string
          kid_count: number
          notes: string | null
          rooms_requested: string[]
          season: Database["public"]["Enums"]["season_type"]
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          user_id: string
          waiver_eligible: boolean
        }
        Insert: {
          adult_count?: number
          booking_type: Database["public"]["Enums"]["booking_type"]
          created_at?: string
          end_date: string
          guest_count?: number
          id?: string
          kid_count?: number
          notes?: string | null
          rooms_requested?: string[]
          season: Database["public"]["Enums"]["season_type"]
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          user_id: string
          waiver_eligible?: boolean
        }
        Update: {
          adult_count?: number
          booking_type?: Database["public"]["Enums"]["booking_type"]
          created_at?: string
          end_date?: string
          guest_count?: number
          id?: string
          kid_count?: number
          notes?: string | null
          rooms_requested?: string[]
          season?: Database["public"]["Enums"]["season_type"]
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          user_id?: string
          waiver_eligible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conflicts: {
        Row: {
          booking_id_a: string
          booking_id_b: string
          created_at: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["conflict_status"]
        }
        Insert: {
          booking_id_a: string
          booking_id_b: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["conflict_status"]
        }
        Update: {
          booking_id_a?: string
          booking_id_b?: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["conflict_status"]
        }
        Relationships: [
          {
            foreignKeyName: "conflicts_booking_id_a_fkey"
            columns: ["booking_id_a"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflicts_booking_id_b_fkey"
            columns: ["booking_id_b"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflicts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_members: {
        Row: {
          booking_id: string
          member_id: string
        }
        Insert: {
          booking_id: string
          member_id: string
        }
        Update: {
          booking_id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_members_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "branch_members"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_members: {
        Row: {
          id: string
          family_branch: Database["public"]["Enums"]["family_branch"]
          name: string
          linked_user_id: string | null
          preferred_room_ids: string[]
          is_child: boolean
          created_at: string
        }
        Insert: {
          id?: string
          family_branch: Database["public"]["Enums"]["family_branch"]
          name: string
          linked_user_id?: string | null
          preferred_room_ids?: string[]
          is_child?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          family_branch?: Database["public"]["Enums"]["family_branch"]
          name?: string
          linked_user_id?: string | null
          preferred_room_ids?: string[]
          is_child?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_members_linked_user_id_fkey"
            columns: ["linked_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_policies: {
        Row: {
          family_branch: Database["public"]["Enums"]["family_branch"]
          require_cousin_approval: boolean
          cousin_guest_cap: number | null
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          family_branch: Database["public"]["Enums"]["family_branch"]
          require_cousin_approval?: boolean
          cousin_guest_cap?: number | null
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          family_branch?: Database["public"]["Enums"]["family_branch"]
          require_cousin_approval?: boolean
          cousin_guest_cap?: number | null
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_policies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          category: Database["public"]["Enums"]["feedback_category"]
          created_at: string
          id: string
          message: string
          status: Database["public"]["Enums"]["feedback_status"]
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["feedback_category"]
          created_at?: string
          id?: string
          message: string
          status?: Database["public"]["Enums"]["feedback_status"]
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["feedback_category"]
          created_at?: string
          id?: string
          message?: string
          status?: Database["public"]["Enums"]["feedback_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          created_at: string
          id: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          sent_at: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          sent_at?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          sent_at?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          attributes: Json
          bed_count: number
          flex_capacity: number
          id: string
          max_occupancy: number
          name: string
          sort_order: number
        }
        Insert: {
          attributes?: Json
          bed_count: number
          flex_capacity?: number
          id?: string
          max_occupancy: number
          name: string
          sort_order?: number
        }
        Update: {
          attributes?: Json
          bed_count?: number
          flex_capacity?: number
          id?: string
          max_occupancy?: number
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      sleep_assignments: {
        Row: {
          assigned_guests: Json
          booking_id: string
          created_at: string
          id: string
          room_id: string
        }
        Insert: {
          assigned_guests?: Json
          booking_id: string
          created_at?: string
          id?: string
          room_id: string
        }
        Update: {
          assigned_guests?: Json
          booking_id?: string
          created_at?: string
          id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_assignments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sleep_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          family_branch: Database["public"]["Enums"]["family_branch"]
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email: string
          family_branch: Database["public"]["Enums"]["family_branch"]
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string
          family_branch?: Database["public"]["Enums"]["family_branch"]
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      waiver_scores: {
        Row: {
          calculated_at: string
          id: string
          nights_ttm: number
          requests_ttm: number
          score: number
          user_id: string
        }
        Insert: {
          calculated_at?: string
          id?: string
          nights_ttm?: number
          requests_ttm?: number
          score?: number
          user_id: string
        }
        Update: {
          calculated_at?: string
          id?: string
          nights_ttm?: number
          requests_ttm?: number
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiver_scores_user_id_fkey"
            columns: ["user_id"]
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
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      booking_status: "draft" | "pending" | "confirmed" | "bumped" | "cancelled"
      booking_type:
        | "exclusive_offseason"
        | "exclusive_peak"
        | "open_shared"
        | "lastminute_guest"
      conflict_status: "open" | "resolved"
      family_branch:
        | "Grandma and Papa"
        | "Smoothie and Lynn"
        | "Tom and Moe"
        | "Keke and Matt"
        | "Dick and Colleen"
      feedback_category: "bug" | "suggestion" | "question" | "other"
      feedback_status: "new" | "reviewed"
      notification_type:
        | "exclusive_overlap"
        | "papa_overlap"
        | "conflict_deadline_3wk"
        | "conflict_deadline_1wk"
        | "post_lockin_cancellation"
        | "waiver_bump"
        | "booking_confirmed"
        | "cousin_pending_approval"
      season_type: "peak" | "offseason"
      user_role: "papa" | "principal" | "cousin" | "admin"
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
      booking_status: ["draft", "pending", "confirmed", "bumped", "cancelled"],
      booking_type: [
        "exclusive_offseason",
        "exclusive_peak",
        "open_shared",
        "lastminute_guest",
      ],
      conflict_status: ["open", "resolved"],
      family_branch: [
        "Grandma and Papa",
        "Smoothie and Lynn",
        "Tom and Moe",
        "Keke and Matt",
        "Dick and Colleen",
      ],
      feedback_category: ["bug", "suggestion", "question", "other"],
      feedback_status: ["new", "reviewed"],
      notification_type: [
        "exclusive_overlap",
        "papa_overlap",
        "conflict_deadline_3wk",
        "conflict_deadline_1wk",
        "post_lockin_cancellation",
        "waiver_bump",
        "booking_confirmed",
      ],
      season_type: ["peak", "offseason"],
      user_role: ["papa", "principal", "cousin", "admin"],
    },
  },
} as const