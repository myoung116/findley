export type UserRole = 'admin' | 'papa' | 'principal' | 'cousin'

export type FamilyBranch =
  | 'Grandma and Papa'
  | 'Smoothie and Lynn'
  | 'Tom and Moe'
  | 'Keke and Matt'
  | 'Dick and Colleen'

export type BookingType =
  | 'exclusive_offseason'
  | 'exclusive_peak'
  | 'open_shared'
  | 'lastminute_guest'

export type BookingStatus = 'draft' | 'pending' | 'confirmed' | 'bumped' | 'cancelled'

export type SeasonType = 'peak' | 'offseason'

export type ConflictStatus = 'open' | 'resolved'

export type NotificationType =
  | 'exclusive_overlap'
  | 'papa_overlap'
  | 'conflict_deadline_3wk'
  | 'conflict_deadline_1wk'
  | 'post_lockin_cancellation'
  | 'waiver_bump'
  | 'booking_confirmed'
  | 'cousin_pending_approval'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: UserRole
          family_branch: FamilyBranch
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      rooms: {
        Row: {
          id: string
          name: string
          bed_count: number
          max_occupancy: number
          attributes: Record<string, unknown>
        }
        Insert: Omit<Database['public']['Tables']['rooms']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['rooms']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          start_date: string
          end_date: string
          booking_type: BookingType
          status: BookingStatus
          season: SeasonType
          rooms_requested: string[]
          guest_count: number
          waiver_eligible: boolean
          notes: string | null
          created_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['bookings']['Row'],
          'id' | 'waiver_eligible' | 'created_at'
        >
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      sleep_assignments: {
        Row: {
          id: string
          booking_id: string
          room_id: string
          assigned_guests: Array<{ name: string; relationship: string }>
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['sleep_assignments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['sleep_assignments']['Insert']>
      }
      interests: {
        Row: {
          id: string
          user_id: string
          week_start_date: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['interests']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['interests']['Insert']>
      }
      waiver_scores: {
        Row: {
          id: string
          user_id: string
          score: number
          nights_ttm: number
          requests_ttm: number
          calculated_at: string
        }
        Insert: Omit<Database['public']['Tables']['waiver_scores']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['waiver_scores']['Insert']>
      }
      conflicts: {
        Row: {
          id: string
          booking_id_a: string
          booking_id_b: string
          status: ConflictStatus
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['conflicts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['conflicts']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          payload: Record<string, unknown>
          sent_at: string | null
          read_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      branch_policies: {
        Row: {
          family_branch: FamilyBranch
          require_cousin_approval: boolean
          cousin_guest_cap: number | null
          updated_by: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['branch_policies']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['branch_policies']['Insert']>
      }
    }
  }
}
