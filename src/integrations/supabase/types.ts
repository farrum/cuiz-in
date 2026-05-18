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
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
          page_section: string | null
          page_url: string | null
          session_id: string
          slot_id: string | null
          user_id: string | null
        }
        Insert: {
          ad_id: string
          ad_position: string
          click_date?: string
          conversion?: boolean | null
          device_info?: string | null
          id?: string
          page_section?: string | null
          page_url?: string | null
          session_id: string
          slot_id?: string | null
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          ad_position?: string
          click_date?: string
          conversion?: boolean | null
          device_info?: string | null
          id?: string
          page_section?: string | null
          page_url?: string | null
          session_id?: string
          slot_id?: string | null
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
      ad_slot_versions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          position: string
          slot_id: string
          version_notes: string | null
          version_number: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          position: string
          slot_id: string
          version_notes?: string | null
          version_number: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          position?: string
          slot_id?: string
          version_notes?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "ad_slot_versions_slot_id_fkey"
            columns: ["slot_id"]
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
          version_number: number | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          name: string
          position: string
          version_number?: number | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          name?: string
          position?: string
          version_number?: number | null
        }
        Relationships: []
      }
      ad_version_performance: {
        Row: {
          clicks: number | null
          ctr: number | null
          end_date: string | null
          id: string
          slot_id: string
          start_date: string
          version_id: string
          views: number | null
        }
        Insert: {
          clicks?: number | null
          ctr?: number | null
          end_date?: string | null
          id?: string
          slot_id: string
          start_date?: string
          version_id: string
          views?: number | null
        }
        Update: {
          clicks?: number | null
          ctr?: number | null
          end_date?: string | null
          id?: string
          slot_id?: string
          start_date?: string
          version_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_version_performance_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "ad_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_version_performance_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "ad_slot_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_views: {
        Row: {
          ad_id: string
          ad_position: string
          device_info: string | null
          id: string
          page_section: string | null
          page_url: string | null
          session_id: string
          slot_id: string | null
          user_id: string | null
          view_date: string
        }
        Insert: {
          ad_id: string
          ad_position: string
          device_info?: string | null
          id?: string
          page_section?: string | null
          page_url?: string | null
          session_id: string
          slot_id?: string | null
          user_id?: string | null
          view_date?: string
        }
        Update: {
          ad_id?: string
          ad_position?: string
          device_info?: string | null
          id?: string
          page_section?: string | null
          page_url?: string | null
          session_id?: string
          slot_id?: string | null
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
      admin_notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          num_questions: number
          points_multiplier: number
          question_ids: string[]
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          num_questions: number
          points_multiplier?: number
          question_ids: string[]
          start_date: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          num_questions?: number
          points_multiplier?: number
          question_ids?: string[]
          start_date?: string
          title?: string
        }
        Relationships: []
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
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          question?: string
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
      partner_sites: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          created_at: string
          domain_authority: number | null
          id: number
          name: string
          notes: string | null
          partnership_status: string
          referral_traffic: number | null
          updated_at: string
          website: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          domain_authority?: number | null
          id?: number
          name: string
          notes?: string | null
          partnership_status?: string
          referral_traffic?: number | null
          updated_at?: string
          website: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          domain_authority?: number | null
          id?: number
          name?: string
          notes?: string | null
          partnership_status?: string
          referral_traffic?: number | null
          updated_at?: string
          website?: string
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
          auth_migrated: boolean | null
          created_at: string | null
          display_name: string | null
          email: string | null
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
          auth_migrated?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
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
          auth_migrated?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
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
          image_url: string | null
          options: Json
          points: number | null
          question: string
          question_type: string | null
        }
        Insert: {
          category: string
          correct_answer: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          image_url?: string | null
          options: Json
          points?: number | null
          question: string
          question_type?: string | null
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          image_url?: string | null
          options?: Json
          points?: number | null
          question?: string
          question_type?: string | null
        }
        Relationships: []
      }
      team_leader_earnings: {
        Row: {
          active_members: number
          amount: number
          created_at: string | null
          id: string
          month: string
          team_leader_id: string
          updated_at: string | null
          year: number
        }
        Insert: {
          active_members?: number
          amount?: number
          created_at?: string | null
          id?: string
          month: string
          team_leader_id: string
          updated_at?: string | null
          year: number
        }
        Update: {
          active_members?: number
          amount?: number
          created_at?: string | null
          id?: string
          month?: string
          team_leader_id?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      user_attendance: {
        Row: {
          attendance_date: string
          created_at: string
          id: string
          login_time: string
          user_id: string
          username: string
        }
        Insert: {
          attendance_date: string
          created_at?: string
          id?: string
          login_time: string
          user_id: string
          username: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          id?: string
          login_time?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          id: string
          score: number
          started_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          score?: number
          started_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          score?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
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
          page_section: string | null
          slot_id: string | null
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
      sitemap_entries: {
        Row: {
          changefreq: string | null
          last_modified: string | null
          path: string | null
          priority: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_delete_profile_icon: {
        Args: { p_icon_id: string }
        Returns: boolean
      }
      admin_get_quiz_questions: {
        Args: { p_ids?: string[] }
        Returns: {
          category: string
          correct_answer: string
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          image_url: string | null
          options: Json
          points: number | null
          question: string
          question_type: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "quiz_questions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_insert_profile_icon: {
        Args: { icon_name: string; icon_url: string; is_active?: boolean }
        Returns: string
      }
      check_admin_access: { Args: never; Returns: boolean }
      get_ad_performance_data: {
        Args: never
        Returns: {
          ad_id: string
          ad_name: string
          ad_position: string
          clicks: number
          ctr: number
          impressions: number
          page_section: string
          slot_id: string
        }[]
      }
      get_current_user_id: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_daily_ad_reports: {
        Args: never
        Returns: {
          ad_id: string
          ad_position: string
          impressions: number
          report_date: string
          unique_views: number
        }[]
      }
      has_user_been_active_in_days: {
        Args: { p_days: number; p_user_id: string }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      regenerate_sitemap: { Args: never; Returns: undefined }
      set_user_context: { Args: { user_id: string }; Returns: undefined }
      slugify_ascii: { Args: { input: string }; Returns: string }
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
