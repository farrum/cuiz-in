
import { Database as OriginalDatabase } from '@/integrations/supabase/types';

// Extend the Database types to include our new tables
export interface Database extends OriginalDatabase {
  public: {
    Tables: {
      // Include all existing tables from the original Database
      ...OriginalDatabase['public']['Tables'],
      
      // Add our new tables
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
          created_by?: string;
          version_notes?: string;
        };
        Insert: {
          id?: string;
          slot_id: string;
          name: string;
          position: string;
          code: string;
          active?: boolean;
          created_at?: string;
          version_number: number;
          created_by?: string;
          version_notes?: string;
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
          created_by?: string;
          version_notes?: string;
        };
      };
      ad_version_performance: {
        Row: {
          id: string;
          version_id: string;
          slot_id: string;
          start_date: string;
          end_date?: string;
          views: number;
          clicks: number;
          ctr?: number;
        };
        Insert: {
          id?: string;
          version_id: string;
          slot_id: string;
          start_date?: string;
          end_date?: string;
          views?: number;
          clicks?: number;
          ctr?: number;
        };
        Update: {
          id?: string;
          version_id?: string;
          slot_id?: string;
          start_date?: string;
          end_date?: string;
          views?: number;
          clicks?: number;
          ctr?: number;
        };
      }
    };
    Views: OriginalDatabase['public']['Views'];
    Functions: {
      // Include all existing functions from the original Database
      ...OriginalDatabase['public']['Functions'],
      
      // Add our new function
      has_user_been_active_in_days: {
        Args: {
          p_user_id: string;
          p_days: number;
        };
        Returns: boolean;
      };
    };
    Enums: OriginalDatabase['public']['Enums'];
    CompositeTypes: OriginalDatabase['public']['CompositeTypes'];
  };
}

// Export additional types for use throughout the app
export interface AdSlotVersion {
  id: string;
  slot_id: string;
  name: string;
  position: string;
  code: string;
  active: boolean;
  created_at: string;
  version_number: number;
  created_by?: string;
  version_notes?: string;
}

export interface AttendanceRecord {
  user_id: string;
  username: string;
  attendance_date: string;
  login_time: string;
}
