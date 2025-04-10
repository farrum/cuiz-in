
import { Database } from '@/integrations/supabase/types';

// Extend the existing Database type
export interface ExtendedDatabase extends Database {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      user_attendance: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          attendance_date: string;
          login_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          attendance_date: string;
          login_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          attendance_date?: string;
          login_time?: string;
          created_at?: string;
        };
      };
      ad_slot_versions: {
        Row: {
          id: string;
          slot_id: string;
          name: string;
          position: string;
          code: string;
          active: boolean;
          created_at: string;
          version_number: number;
          created_by: string | null;
          version_notes: string | null;
        };
        Insert: {
          id?: string;
          slot_id: string;
          name: string;
          position: string;
          code: string;
          active: boolean;
          created_at?: string;
          version_number: number;
          created_by?: string | null;
          version_notes?: string | null;
        };
        Update: {
          id?: string;
          slot_id?: string;
          name?: string;
          position?: string;
          code?: string;
          active?: boolean;
          created_at?: string;
          version_number?: number;
          created_by?: string | null;
          version_notes?: string | null;
        };
      };
      ad_version_performance: {
        Row: {
          id: string;
          version_id: string;
          slot_id: string;
          start_date: string;
          end_date: string | null;
          views: number;
          clicks: number;
          ctr: number;
        };
        Insert: {
          id?: string;
          version_id: string;
          slot_id: string;
          start_date?: string;
          end_date?: string | null;
          views?: number;
          clicks?: number;
          ctr?: number;
        };
        Update: {
          id?: string;
          version_id?: string;
          slot_id?: string;
          start_date?: string;
          end_date?: string | null;
          views?: number;
          clicks?: number;
          ctr?: number;
        };
      };
    };
    Views: Database['public']['Views'] & {
      // Add any additional view types here
    };
    Functions: Database['public']['Functions'] & {
      // RPC function return types
      get_ad_impressions_count: {
        Args: Record<string, unknown>;
        Returns: {
          ad_id: string;
          ad_position: string;
          slot_id: string;
          page_section: string;
          count: string;
        }[];
      };
      get_ad_clicks_count: {
        Args: Record<string, unknown>;
        Returns: {
          ad_id: string;
          ad_position: string;
          slot_id: string;
          page_section: string;
          count: string;
        }[];
      };
      has_user_been_active_in_days: {
        Args: {
          p_user_id: string;
          p_days: number;
        };
        Returns: boolean;
      };
    };
  };
}
