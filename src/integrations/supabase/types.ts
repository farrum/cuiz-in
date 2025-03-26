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
      ad_clicks: {
        Row: {
          ad_id: string
          ad_position: string
          click_date: string
          conversion: boolean | null
          device_info: string | null
          id: string
          page_url: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          ad_id: string
          ad_position: string
          click_date?: string
          conversion?: boolean | null
          device_info?: string | null
          id?: string
          page_url?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          ad_position?: string
          click_date?: string
          conversion?: boolean | null
          device_info?: string | null
          id?: string
          page_url?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ad_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_slots: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          id: string
          last_updated: string | null
          name: string
          position: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          name: string
          position: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          name?: string
          position?: string
        }
        Relationships: []
      }
      ad_views: {
        Row: {
          ad_id: string
          ad_position: string
          device_info: string | null
          id: string
          page_url: string | null
          session_id: string
          user_id: string | null
          view_date: string
        }
        Insert: {
          ad_id: string
          ad_position: string
          device_info?: string | null
          id?: string
          page_url?: string | null
          session_id: string
          user_id?: string | null
          view_date?: string
        }
        Update: {
          ad_id?: string
          ad_position?: string
          device_info?: string | null
          id?: string
          page_url?: string | null
          session_id?: string
          user_id?: string | null
          view_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_views_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ad_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_points: {
        Row: {
          created_at: string | null
          date: string
          id: string
          points: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          points?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          points?: number
          user_id?: string
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          ad_views: number | null
          created_at: string | null
          date: string
          id: string
          logins: number | null
          plays: number | null
          updated_at: string | null
        }
        Insert: {
          ad_views?: number | null
          created_at?: string | null
          date: string
          id?: string
          logins?: number | null
          plays?: number | null
          updated_at?: string | null
        }
        Update: {
          ad_views?: number | null
          created_at?: string | null
          date?: string
          id?: string
          logins?: number | null
          plays?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fun_messages: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          text: string
          type: string
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          text: string
          type: string
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          text?: string
          type?: string
        }
        Relationships: []
      }
      login_logs: {
        Row: {
          created_at: string | null
          device: string | null
          id: string
          ip_address: string | null
          login_time: string | null
          successful: boolean | null
          username: string
        }
        Insert: {
          created_at?: string | null
          device?: string | null
          id?: string
          ip_address?: string | null
          login_time?: string | null
          successful?: boolean | null
          username: string
        }
        Update: {
          created_at?: string | null
          device?: string | null
          id?: string
          ip_address?: string | null
          login_time?: string | null
          successful?: boolean | null
          username?: string
        }
        Relationships: []
      }
      login_streaks: {
        Row: {
          bonus_claimed_today: boolean
          bonus_points_today: number
          created_at: string | null
          current_streak: number
          highest_streak: number
          id: string
          last_login_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bonus_claimed_today?: boolean
          bonus_points_today?: number
          created_at?: string | null
          current_streak?: number
          highest_streak?: number
          id?: string
          last_login_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bonus_claimed_today?: boolean
          bonus_points_today?: number
          created_at?: string | null
          current_streak?: number
          highest_streak?: number
          id?: string
          last_login_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_points: {
        Row: {
          created_at: string | null
          id: string
          month: string
          points: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: string
          points?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: string
          points?: number
          user_id?: string
        }
        Relationships: []
      }
      news_ticker: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          text?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          date: string | null
          id: string
          method: string | null
          status: string | null
          transaction_id: string | null
          type: string
          user_id: string
          username: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string | null
          id?: string
          method?: string | null
          status?: string | null
          transaction_id?: string | null
          type: string
          user_id: string
          username: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string | null
          id?: string
          method?: string | null
          status?: string | null
          transaction_id?: string | null
          type?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      profile_icons: {
        Row: {
          created_at: string | null
          icon_url: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          icon_url: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          icon_url?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          is_admin: boolean | null
          password_hash: string | null
          phone: string | null
          points: number | null
          profile_picture: string | null
          reactivation_approved: boolean | null
          reactivation_approved_at: string | null
          reactivation_requested: boolean | null
          reactivation_requested_at: string | null
          suspended: boolean | null
          upi_id: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_admin?: boolean | null
          password_hash?: string | null
          phone?: string | null
          points?: number | null
          profile_picture?: string | null
          reactivation_approved?: boolean | null
          reactivation_approved_at?: string | null
          reactivation_requested?: boolean | null
          reactivation_requested_at?: string | null
          suspended?: boolean | null
          upi_id?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_admin?: boolean | null
          password_hash?: string | null
          phone?: string | null
          points?: number | null
          profile_picture?: string | null
          reactivation_approved?: boolean | null
          reactivation_approved_at?: string | null
          reactivation_requested?: boolean | null
          reactivation_requested_at?: string | null
          suspended?: boolean | null
          upi_id?: string | null
          username?: string
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          answered_at: string | null
          correct: boolean
          created_at: string | null
          id: string
          points_earned: number | null
          question_id: string | null
          selected_answer: string
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          correct: boolean
          created_at?: string | null
          id?: string
          points_earned?: number | null
          question_id?: string | null
          selected_answer: string
          user_id: string
        }
        Update: {
          answered_at?: string | null
          correct?: boolean
          created_at?: string | null
          id?: string
          points_earned?: number | null
          question_id?: string | null
          selected_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          category: string
          correct_answer: string
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          options: Json
          points: number | null
          question: string
        }
        Insert: {
          category: string
          correct_answer: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options: Json
          points?: number | null
          question: string
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options?: Json
          points?: number | null
          question?: string
        }
        Relationships: []
      }
      user_referrals: {
        Row: {
          active_this_month: boolean | null
          created_at: string | null
          date: string
          earnings: number | null
          id: string
          last_active_date: string | null
          referred_email: string | null
          referred_id: string
          referred_name: string
          referrer_id: string
          referrer_name: string
          status: string | null
        }
        Insert: {
          active_this_month?: boolean | null
          created_at?: string | null
          date: string
          earnings?: number | null
          id?: string
          last_active_date?: string | null
          referred_email?: string | null
          referred_id: string
          referred_name: string
          referrer_id: string
          referrer_name: string
          status?: string | null
        }
        Update: {
          active_this_month?: boolean | null
          created_at?: string | null
          date?: string
          earnings?: number | null
          id?: string
          last_active_date?: string | null
          referred_email?: string | null
          referred_id?: string
          referred_name?: string
          referrer_id?: string
          referrer_name?: string
          status?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      ad_performance_reports: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          ad_position: string | null
          clicks: number | null
          ctr: number | null
          impressions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_views_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ad_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_ad_reports: {
        Row: {
          ad_id: string | null
          ad_position: string | null
          impressions: number | null
          report_date: string | null
          unique_views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_views_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ad_slots"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_delete_profile_icon: {
        Args: {
          p_icon_id: string
        }
        Returns: boolean
      }
      admin_insert_profile_icon: {
        Args: {
          icon_name: string
          icon_url: string
          is_active?: boolean
        }
        Returns: string
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
