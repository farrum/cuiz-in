
export interface AdPerformance {
  ad_id: string;
  ad_name: string;
  ad_position: string;
  impressions: number;
  clicks: number;
  ctr: number;
  slot_id?: string;
  page_section?: string;
}

// Define types for Supabase query responses
export interface ImpressionData {
  ad_id: string;
  ad_position: string;
  slot_id: string | null;
  page_section: string | null;
  count: string;
}

export interface ClickData {
  ad_id: string;
  ad_position: string;
  slot_id: string | null;
  page_section: string | null;
  count: string;
}

export interface SlotData {
  id: string;
  name: string;
}
