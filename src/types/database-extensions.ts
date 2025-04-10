
import { Database } from '@/integrations/supabase/types';

// Extend the existing Database type
export interface ExtendedDatabase extends Database {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      // Add any additional table types here
    };
    Views: Database['public']['Views'] & {
      // Add any additional view types here
    };
    Functions: Database['public']['Functions'] & {
      // Add RPC function return types
      get_ad_impressions_count: {
        Returns: {
          ad_id: string;
          ad_position: string;
          slot_id: string;
          page_section: string;
          count: string;
        }[];
      };
      get_ad_clicks_count: {
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
