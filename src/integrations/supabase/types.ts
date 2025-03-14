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
      daily_points: {
        Row: {
          date: string
          id: string
          points: number | null
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          points?: number | null
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          points?: number | null
          user_id?: string
        }
        Relationships: []
      }
      login_logs: {
        Row: {
          device: string | null
          id: string
          ip_address: string | null
          login_time: string | null
          successful: boolean | null
          user_id: string | null
          username: string
        }
        Insert: {
          device?: string | null
          id?: string
          ip_address?: string | null
          login_time?: string | null
          successful?: boolean | null
          user_id?: string | null
          username: string
        }
        Update: {
          device?: string | null
          id?: string
          ip_address?: string | null
          login_time?: string | null
          successful?: boolean | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      monthly_points: {
        Row: {
          id: string
          points: number | null
          user_id: string
          year_month: string
        }
        Insert: {
          id?: string
          points?: number | null
          user_id: string
          year_month: string
        }
        Update: {
          id?: string
          points?: number | null
          user_id?: string
          year_month?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          date: string | null
          id: string
          method: string | null
          status: string
          transaction_id: string | null
          type: string
          user_id: string
          username: string
        }
        Insert: {
          amount: number
          date?: string | null
          id?: string
          method?: string | null
          status: string
          transaction_id?: string | null
          type: string
          user_id: string
          username: string
        }
        Update: {
          amount?: number
          date?: string | null
          id?: string
          method?: string | null
          status?: string
          transaction_id?: string | null
          type?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          phone: string | null
          points: number | null
          suspended: boolean | null
          updated_at: string | null
          upi_id: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          phone?: string | null
          points?: number | null
          suspended?: boolean | null
          updated_at?: string | null
          upi_id?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          phone?: string | null
          points?: number | null
          suspended?: boolean | null
          updated_at?: string | null
          upi_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          answered_at: string | null
          id: string
          is_correct: boolean
          points_earned: number | null
          question_id: string | null
          user_answer: string
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          id?: string
          is_correct: boolean
          points_earned?: number | null
          question_id?: string | null
          user_answer: string
          user_id: string
        }
        Update: {
          answered_at?: string | null
          id?: string
          is_correct?: boolean
          points_earned?: number | null
          question_id?: string | null
          user_answer?: string
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
          active: boolean | null
          category: string
          correct_answer: string
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          options: string[]
          question: string
        }
        Insert: {
          active?: boolean | null
          category: string
          correct_answer: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options: string[]
          question: string
        }
        Update: {
          active?: boolean | null
          category?: string
          correct_answer?: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options?: string[]
          question?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referee_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          referee_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          referee_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      user_referrals: {
        Row: {
          active_this_month: boolean | null
          date: string | null
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
          date?: string | null
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
          date?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "team_leader" | "player"
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
